#!/usr/bin/env node

// Helper script: create a mock astro_state_snapshot for a given window_id.
// Usage:
//   node scripts/createMockAstroSnapshot.js WINDOW_ID
//
// This is only for local testing of the rule evaluation engine.

import { query } from '../config/db.js';

function printHeader(title) {
  console.log('='.repeat(60));
  console.log(title);
  console.log('='.repeat(60));
}

async function main() {
  const windowId = Number(process.argv[2]);

  printHeader('🧪 Create Mock Astro Snapshot');

  if (!windowId || Number.isNaN(windowId)) {
    console.error('❌ WINDOW_ID missing or invalid.');
    console.error('   Usage: node scripts/createMockAstroSnapshot.js WINDOW_ID');
    process.exit(1);
  }

  console.log(`➡️  Window ID: ${windowId}`);

  // 1. Check window exists
  const winRes = await query(
    'SELECT id, user_id, chart_id, scope FROM prediction_windows WHERE id = $1',
    [windowId]
  );
  if (winRes.rowCount === 0) {
    console.error(`❌ prediction_window not found: id=${windowId}`);
    process.exit(1);
  }
  const windowRow = winRes.rows[0];

  // 2. Check if snapshot already exists
  const existing = await query('SELECT id FROM astro_state_snapshots WHERE window_id = $1', [
    windowId,
  ]);
  if (existing.rowCount > 0) {
    console.log(`ℹ️  astro_state_snapshot already exists for window_id=${windowId}, id=${existing.rows[0].id}`);
    process.exit(0);
  }

  // 3. Build a very simple mock planets_state that will trigger MONEY_BUSINESS_GENERAL
  const planets_state = [
    { planet: 'JUPITER', house: 2, sign: 8, degree: 10.5 },
    { planet: 'VENUS', house: 7, sign: 2, degree: 15.0 },
    { planet: 'MERCURY', house: 10, sign: 5, degree: 20.0 },
  ];

  const houses_state = null;
  const yogas_state = [];
  const doshas_state = [];
  const transits_state = [];

  const insertSql = `
    INSERT INTO astro_state_snapshots (
      user_id,
      chart_id,
      window_id,
      lagna_sign,
      moon_sign,
      moon_nakshatra,
      running_mahadasha_planet,
      running_antardasha_planet,
      running_pratyantardasha_planet,
      planets_state,
      houses_state,
      yogas_state,
      doshas_state,
      transits_state
    )
    VALUES (
      $1, $2, $3,
      NULL, NULL, NULL,
      NULL, NULL, NULL,
      $4::jsonb,
      $5::jsonb,
      $6::jsonb,
      $7::jsonb,
      $8::jsonb
    )
    RETURNING id;
  `;

  const res = await query(insertSql, [
    windowRow.user_id,
    windowRow.chart_id,
    windowRow.id,
    JSON.stringify(planets_state),
    JSON.stringify(houses_state),
    JSON.stringify(yogas_state),
    JSON.stringify(doshas_state),
    JSON.stringify(transits_state),
  ]);

  console.log(`✅ Created mock astro_state_snapshot id=${res.rows[0].id} for window_id=${windowId}`);
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ createMockAstroSnapshot fatal error:', err.message);
  console.error(err.stack);
  process.exit(1);
});


