/**
 * QA: Phase-2M Monthly Experience Engine
 *
 * Checks:
 * - ok=true
 * - narrative is 10–12 lines
 * - includes one continuity anchor (natural, non-astro)
 * - includes decision block at end: Focus on / Avoid
 * - no planet/dasha/sookshma labels
 * - remedies <= 1
 */
import { query } from '../config/db.js';

const base = 'http://localhost:3000';
const mk = (planet, lon, house) => ({
  planet,
  longitude: lon,
  house,
  sign: Math.floor((((lon % 360) + 360) % 360) / 30) + 1,
});

function assert(cond, msg) {
  if (!cond) throw new Error(`ASSERT FAILED: ${msg}`);
}

async function main() {
  const date = '2025-12-28';

  const chart_data = {
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
    transits: [
      mk('SUN', 251.821874, 1),
      mk('MOON', 338.789343, 4),
      mk('MARS', 255.070057, 1),
      mk('MERCURY', 237.714433, 12),
      mk('JUPITER', 87.707335, 7),
      mk('VENUS', 249.395554, 1),
      mk('SATURN', 331.703651, 4),
      mk('RAHU', 318.185784, 3),
      mk('KETU', 138.185784, 9),
    ],
    lagna: { degree: 265.277761, sign: 10 },
    meta: { birthDateTimeUtc: '1986-12-27T02:44:00.000Z', timezoneOffsetMinutes: 330 },
  };

  const w = await fetch(`${base}/windows`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: 1, chart_id: 1, scope: 'monthly', timezone: 'Asia/Kolkata', date, chart_data }),
  });
  const wj = await w.json();
  const windowId = Number(wj?.window?.id);
  assert(wj.ok && windowId, 'monthly window creation failed');

  const snap = await fetch(`${base}/windows/${windowId}/astro-snapshot`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chart_data }),
  });
  assert(snap.ok, 'snapshot POST failed');

  const out = await (await fetch(`${base}/monthly-experience/${windowId}`)).json();
  assert(out.ok === true, 'monthly-experience ok=false');

  const narrative = String(out?.narrative || '');
  const lines = narrative.split('\n').map(s => s.trim()).filter(Boolean);
  console.log('lines', lines.length);
  assert(lines.length >= 10 && lines.length <= 12, `narrative must be 10–12 lines (got ${lines.length})`);

  const continuityHits = lines.filter(l =>
    l.includes('part of a longer phase') ||
    l.includes('connects to an ongoing period') ||
    l.includes('connects to a longer stretch')
  );
  assert(continuityHits.length === 1, `expected exactly 1 continuity anchor line (got ${continuityHits.length})`);

  assert(lines[lines.length - 2].startsWith('Focus on: '), 'expected "Focus on:" as second last line');
  assert(lines[lines.length - 1].startsWith('Avoid: '), 'expected "Avoid:" as last line');

  const forbidden = [
    'SUN','MOON','MARS','MERCURY','JUPITER','VENUS','SATURN','RAHU','KETU',
    'MAHADASHA','ANTARDASHA','PRATYANTARDASHA','SOOKSHMA','DASHA'
  ];
  const upper = narrative.toUpperCase();
  for (const f of forbidden) assert(!upper.includes(f), `narrative must not include '${f}'`);

  const remedies = Array.isArray(out.remedies) ? out.remedies : [];
  assert(remedies.length <= 1, `remedies must be <=1 (got ${remedies.length})`);

  const s = await query('SELECT running_sookshma_planet FROM astro_state_snapshots WHERE window_id=$1', [windowId]);
  console.log('sookshma id', s.rows[0]?.running_sookshma_planet);

  console.log('meta', out.meta);
  console.log('signals', out.signals);
  console.log('narrative:\\n' + narrative);
  console.log('remedies', remedies);
  console.log('✅ QA PASSED');
}

main().catch((e) => {
  console.error('❌ QA FAILED:', e?.message || e);
  process.exit(1);
});


