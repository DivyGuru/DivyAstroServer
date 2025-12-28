/**
 * Migration: Phase-2 Sookshma columns on astro_state_snapshots
 *
 * Safe to run multiple times.
 *
 * Run:
 *   node scripts/migratePhase2SookshmaColumns.js
 */

import { query } from '../config/db.js';

async function main() {
  console.log('Applying Phase-2 migration: sookshma columns...');

  await query(`ALTER TABLE IF EXISTS astro_state_snapshots
    ADD COLUMN IF NOT EXISTS running_sookshma_planet SMALLINT`);
  await query(`ALTER TABLE IF EXISTS astro_state_snapshots
    ADD COLUMN IF NOT EXISTS running_sookshma_start TIMESTAMPTZ`);
  await query(`ALTER TABLE IF EXISTS astro_state_snapshots
    ADD COLUMN IF NOT EXISTS running_sookshma_end TIMESTAMPTZ`);

  console.log('✅ Migration complete.');
}

main().catch((e) => {
  console.error('❌ Migration failed:', e?.message || e);
  process.exit(1);
});


