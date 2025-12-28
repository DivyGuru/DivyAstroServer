/**
 * QA: Server-side Vimshottari Dasha + Mahadasha Phal fallback
 *
 * Run:
 *   node scripts/qaDasha.js
 */

import { computeVimshottariMahadashaPeriods, computeVimshottariStateAt } from '../src/services/vimshottariDasha.js';
import { query } from '../config/db.js';

function assert(cond, msg) {
  if (!cond) throw new Error(`ASSERT FAILED: ${msg}`);
}

function isoDate(d) {
  return d.toISOString().split('T')[0];
}

function parseISODate(s) {
  const d = new Date(String(s));
  return Number.isNaN(d.getTime()) ? null : d;
}

async function main() {
  console.log('--- QA: computeVimshottariMahadashaPeriods ---');

  // Sample from your logs (birth UTC + Moon longitude from /calc)
  const birthDateTimeUtc = new Date('1986-12-27T02:44:00.000Z');
  const moonLongitudeSidereal = 195.436935;

  const periods = computeVimshottariMahadashaPeriods({
    birthDateTimeUtc,
    moonLongitudeSidereal,
    minPeriods: 18,
  });

  assert(Array.isArray(periods), 'periods should be an array');
  assert(periods.length === 18, `periods length should be 18 (got ${periods.length})`);

  // Basic monotonicity + validity
  for (let i = 0; i < periods.length; i++) {
    const p = periods[i];
    assert(p.planet && typeof p.planet === 'string', `period[${i}].planet missing`);
    assert(/^\d{4}-\d{2}-\d{2}$/.test(p.from), `period[${i}].from invalid: ${p.from}`);
    assert(/^\d{4}-\d{2}-\d{2}$/.test(p.to), `period[${i}].to invalid: ${p.to}`);
    assert(p.from <= p.to, `period[${i}] from > to`);
    if (i > 0) {
      assert(periods[i - 1].to <= p.to, `period[${i}] not non-decreasing`);
    }
  }

  assert(periods[0].from === isoDate(birthDateTimeUtc), 'first period should start at birth date (UTC date)');
  console.log('OK: period count, date shapes, and monotonicity');

  console.log('\n--- QA: North-Indian result check (current MD/AD/PD at sample date) ---');
  // North-Indian Vimshottari expectation for this sample:
  // - Current Mahadasha should be SATURN (2009..2028)
  // - Current Antardasha should be JUPITER around late 2025 (after Rahu AD ends)
  const state = computeVimshottariStateAt({
    birthDateTimeUtc,
    moonLongitudeSidereal,
    atUtc: new Date('2025-12-27T00:00:00.000Z'),
  });
  assert(state.mahadasha?.planet === 'SATURN', `expected current Mahadasha SATURN, got ${state.mahadasha?.planet}`);
  assert(state.antardasha?.planet === 'JUPITER', `expected current Antardasha JUPITER, got ${state.antardasha?.planet}`);
  assert(state.pratyantardasha?.planet, 'expected pratyantardasha to be computed');
  console.log('OK: current MD/AD match previous app output; PD computed:', state.pratyantardasha.planet);

  console.log('\n--- QA: Mahadasha fallback for a fresh window ---');
  // Create a fresh window snapshot that has NO metadata.dasha, but has birthDateTimeUtc in metadata.
  const mk = (planet, lon, house) => ({
    planet,
    longitude: lon,
    house,
    sign: Math.floor((((lon % 360) + 360) % 360) / 30) + 1,
  });

  const date = '2025-12-30';
  const chartData = {
    planets: [
      mk('Sun', 251.363328, 1),
      mk('Moon', 195.436935, 11),
      mk('Mars', 327.665662, 3),
      mk('Mercury', 241.902137, 1),
      mk('Jupiter', 323.09073, 3),
      mk('Venus', 206.228475, 11),
      mk('Saturn', 231.156184, 12),
      mk('Rahu', 353.077564, 4),
      mk('Ketu', 173.077564, 10),
    ],
    lagna: { degree: 265.277761, sign: 10 },
    moon: { nakshatraId: 15 },
    meta: {
      birthDateTimeUtc: '1986-12-27T02:44:00.000Z',
      timezoneOffsetMinutes: 330,
    },
  };

  // Create window + snapshot via DB path? We don't have direct helper here; simplest is insert window then call snapshot function.
  // Instead, insert prediction_windows row + astro_state_snapshots row using same shape server stores.
  const w = await query(
    `INSERT INTO prediction_windows (user_id, chart_id, scope, start_at, end_at, timezone)
     VALUES ($1,$2,'daily',$3,$4,$5)
     RETURNING id`,
    [
      1,
      1,
      new Date(`${date}T00:00:00.000Z`).toISOString(),
      new Date(`${date}T23:59:59.999Z`).toISOString(),
      'Asia/Kolkata',
    ]
  );
  const windowId = Number(w.rows[0].id);
  console.log('Created test windowId:', windowId);

  // Store planets_state + metadata in houses_state (matching server ingestion model)
  const houses_state = { _metadata: { ...chartData.meta, birthDate: '1986-12-27' } };
  await query(
    `INSERT INTO astro_state_snapshots (user_id, chart_id, window_id, planets_state, houses_state, computed_at)
     VALUES ($1,$2,$3,$4::jsonb,$5::jsonb,NOW())`,
    [1, 1, windowId, JSON.stringify(chartData.planets), JSON.stringify(houses_state)]
  );

  // Call generator directly (unit-ish test)
  const { generateMahadashaPhal } = await import('../src/services/mahadashaPhalGeneration.js');
  const out = await generateMahadashaPhal(windowId);
  assert(out?.mahadasha_periods?.length === 18, `expected 18 periods from fallback (got ${out?.mahadasha_periods?.length})`);
  assert(out?.meta?.birth_date === '1986-12-27', `expected meta.birth_date to be 1986-12-27 (got ${out?.meta?.birth_date})`);

  // Ensure current period is marked
  const anyCurrent = out.mahadasha_periods.some(p => p.is_current === true);
  assert(anyCurrent, 'expected one period to be marked is_current=true');

  // Ensure dates parse
  for (const [i, p] of out.mahadasha_periods.entries()) {
    assert(parseISODate(p.from), `invalid from date in period ${i}`);
    assert(parseISODate(p.to), `invalid to date in period ${i}`);
  }

  console.log('OK: fallback generates 18 periods + has current period + birth_date present');

  console.log('\n✅ QA PASSED');
}

main().catch((e) => {
  console.error('❌ QA FAILED:', e?.message || e);
  process.exit(1);
});


