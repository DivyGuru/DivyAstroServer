/**
 * Result-oriented QA: Dasha output quality inside Kundli (North-Indian standard)
 *
 * What this checks:
 * - Snapshot has running MD/AD/PD IDs populated (engine compatible)
 * - `/mahadasha-phal/:windowId` returns current period and remedies
 * - `/kundli/:windowId` present_phase narrative explicitly reflects MD/AD/PD
 */

import { query } from '../config/db.js';

function mk(planet, lon, house) {
  return {
    planet,
    longitude: lon,
    house,
    sign: Math.floor((((lon % 360) + 360) % 360) / 30) + 1,
  };
}

async function main() {
  const base = 'http://localhost:3000';
  const date = '2026-01-03';

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
    lagna: { degree: 265.277761, sign: 10 },
    moon: { nakshatraId: 14, nakshatra: 'Swati' }, // 0-based id from app (Swati)
    meta: {
      birthDateTimeUtc: '1986-12-27T02:44:00.000Z',
      timezoneOffsetMinutes: 330,
    },
  };

  const w = await fetch(`${base}/windows`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: 1,
      chart_id: 1,
      scope: 'daily',
      timezone: 'Asia/Kolkata',
      date,
      chart_data,
    }),
  });
  const wj = await w.json();
  const windowId = Number(wj?.window?.id);
  console.log('window', windowId, 'ok', wj.ok);

  const snap = await query(
    'SELECT running_mahadasha_planet, running_antardasha_planet, running_pratyantardasha_planet, moon_nakshatra FROM astro_state_snapshots WHERE window_id=$1',
    [windowId]
  );
  console.log('snapshot fields', snap.rows[0]);

  const md = await (await fetch(`${base}/mahadasha-phal/${windowId}`)).json();
  const cur = (md.mahadasha_periods || []).find(p => p.is_current);
  console.log('mahadasha current', cur?.planet, cur?.from, cur?.to, 'remedies', cur?.remedies?.length || 0);

  const kundli = await (await fetch(`${base}/kundli/${windowId}?scope=daily`)).json();
  const present = (kundli.sections || []).find(s => s.domain === 'present_phase');
  console.log('\n--- Kundli present_phase ---\n');
  console.log(present?.narrative || '(missing)');
  console.log('\n--- end ---\n');
}

main().catch((e) => {
  console.error('QA FAILED:', e?.message || e);
  process.exit(1);
});


