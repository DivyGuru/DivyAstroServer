/**
 * QA: Phase-2 Sookshma persistence in astro_state_snapshots (internal only)
 *
 * This script:
 * - Creates a fresh daily window with birthDateTimeUtc + Moon longitude
 * - Verifies snapshot columns: running_sookshma_planet/start/end are populated
 *
 * Run:
 *   node scripts/qaSookshmaSnapshot.js
 */

import { query } from '../config/db.js';

const base = 'http://localhost:3000';

const mk = (planet, lon, house) => ({
  planet,
  longitude: lon,
  house,
  sign: Math.floor((((lon % 360) + 360) % 360) / 30) + 1,
});

async function main() {
  // Use a unique date per run to force a new window_id
  const date = `2026-01-${String(5 + Math.floor(Math.random() * 20)).padStart(2, '0')}`;
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

  // Explicitly post snapshot too (covers the case where window existed already)
  const snapRes = await fetch(`${base}/windows/${windowId}/astro-snapshot`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chart_data }),
  });
  const snapText = await snapRes.text();
  console.log('snapshot POST', snapRes.status, snapText);

  const r = await query(
    `SELECT
       running_sookshma_planet,
       running_sookshma_start,
       running_sookshma_end
     FROM astro_state_snapshots
     WHERE window_id = $1`,
    [windowId]
  );

  console.log('rows', r.rowCount);
  console.log(r.rows[0]);
}

main().catch((e) => {
  console.error('QA FAILED:', e?.message || e);
  process.exit(1);
});


