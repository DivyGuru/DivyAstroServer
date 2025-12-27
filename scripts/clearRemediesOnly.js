#!/usr/bin/env node

/**
 * Clear Only Remedies Table
 * 
 * This script clears ONLY remedies and related tables, keeping rules intact.
 * Useful when you want to re-ingest remedies with updated logic (e.g., target_themes).
 * 
 * WARNING: This will delete ALL remedies from the database!
 * 
 * Usage:
 *   node scripts/clearRemediesOnly.js --confirm
 */

import { getClient, query } from '../config/db.js';

async function clearRemediesOnly() {
  const args = process.argv.slice(2);
  if (!args.includes('--confirm')) {
    console.error('\n⚠️  WARNING: This will delete ALL REMEDIES from the database!');
    console.error('   Rules will be preserved.');
    console.error('   To proceed, run: node scripts/clearRemediesOnly.js --confirm\n');
    process.exit(1);
  }

  const client = await getClient();

  try {
    console.log('\n🔄 Starting remedies cleanup (rules preserved)...\n');

    await client.query('BEGIN');

    // Disable triggers temporarily
    await client.query("SET session_replication_role = 'replica'");

    // Get current counts
    const remediesCount = await query('SELECT COUNT(*) as count FROM remedies WHERE is_active = TRUE');
    const rulesCount = await query('SELECT COUNT(*) as count FROM rules WHERE is_active = TRUE');
    
    console.log('📊 Current State:');
    console.log(`   Rules: ${rulesCount.rows[0].count} (will be preserved)`);
    console.log(`   Remedies: ${remediesCount.rows[0].count} (will be deleted)\n`);

    // Clear tables in dependency order (child tables first)
    const tablesToClear = [
      'prediction_recommended_remedies', // References remedies
      'remedies' // Main table
    ];

    console.log('🗑️  Clearing tables...\n');
    for (const tableName of tablesToClear) {
      try {
        const beforeCount = await query(`SELECT COUNT(*) as count FROM ${tableName}`);
        await client.query(`TRUNCATE TABLE ${tableName} CASCADE`);
        console.log(`   ✓ ${tableName} (${beforeCount.rows[0].count} rows deleted)`);
      } catch (error) {
        console.warn(`   ⚠ ${tableName}: ${error.message}`);
      }
    }

    // Reset remedies sequence
    console.log('\n   Resetting sequences...');
    try {
      await client.query(`ALTER SEQUENCE remedies_id_seq RESTART WITH 1`);
      console.log('   ✓ remedies_id_seq reset');
    } catch (error) {
      console.warn(`   ⚠ remedies_id_seq: ${error.message}`);
    }

    try {
      await client.query(`ALTER SEQUENCE prediction_recommended_remedies_id_seq RESTART WITH 1`);
      console.log('   ✓ prediction_recommended_remedies_id_seq reset');
    } catch (error) {
      console.warn(`   ⚠ prediction_recommended_remedies_id_seq: ${error.message}`);
    }

    await client.query('COMMIT');

    console.log('\n✅ Remedies cleanup completed successfully!');
    console.log('   All remedies have been deleted.');
    console.log('   Rules have been preserved.\n');

    // Verify cleanup
    const afterRemediesCount = await query('SELECT COUNT(*) as count FROM remedies');
    const afterRulesCount = await query('SELECT COUNT(*) as count FROM rules WHERE is_active = TRUE');

    console.log('📊 Final State:');
    console.log(`   Rules: ${afterRulesCount.rows[0].count} (preserved ✅)`);
    console.log(`   Remedies: ${afterRemediesCount.rows[0].count} (cleared ✅)\n`);

    if (afterRemediesCount.rows[0].count === 0) {
      console.log('✅ Verification: All remedies cleared successfully.\n');
      console.log('📝 Next Steps:');
      console.log('   1. Re-run ingestion scripts for remedies:');
      console.log('      node scripts/ingest/ingestStrictFinal.js lalkitab');
      console.log('      node scripts/ingest/ingestStrictFinal.js BParasharHoraShastra');
      console.log('   2. Verify remedies have target_themes populated\n');
    } else {
      console.log('⚠️  Warning: Some remedies still exist:');
      console.log(`   Count: ${afterRemediesCount.rows[0].count}\n`);
    }

    process.exit(0);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ Error cleaning remedies:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    client.release();
  }
}

clearRemediesOnly();

