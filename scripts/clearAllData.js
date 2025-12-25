#!/usr/bin/env node

/**
 * Clear All Database Data
 * 
 * This script empties all tables while keeping the schema intact.
 * WARNING: This will delete ALL data from the database!
 * 
 * Usage:
 *   node scripts/clearAllData.js
 *   node scripts/clearAllData.js --confirm
 */

import { query, getClient } from '../config/db.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function clearAllData() {
  // Check for confirmation flag
  const args = process.argv.slice(2);
  if (!args.includes('--confirm')) {
    console.error('\n⚠️  WARNING: This will delete ALL data from the database!');
    console.error('   To proceed, run: node scripts/clearAllData.js --confirm\n');
    process.exit(1);
  }

  const client = await getClient();
  
  try {
    console.log('\n🔄 Starting database cleanup...\n');
    
    await client.query('BEGIN');
    
    // Disable triggers temporarily
    await client.query("SET session_replication_role = 'replica'");
    
    // Get all existing tables
    const tablesResult = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `);
    
    const tables = tablesResult.rows.map(row => row.tablename);
    console.log(`   Found ${tables.length} tables to clean...\n`);
    
    // Truncate all tables (CASCADE handles foreign keys)
    for (const tableName of tables) {
      try {
        await client.query(`TRUNCATE TABLE ${tableName} CASCADE`);
        console.log(`   ✓ ${tableName}`);
      } catch (error) {
        console.warn(`   ⚠ ${tableName}: ${error.message}`);
      }
    }
    
    // Reset all sequences
    console.log('\n   Resetting sequences...');
    const sequencesResult = await client.query(`
      SELECT sequence_name 
      FROM information_schema.sequences 
      WHERE sequence_schema = 'public'
    `);
    
    for (const seq of sequencesResult.rows) {
      try {
        await client.query(`ALTER SEQUENCE ${seq.sequence_name} RESTART WITH 1`);
      } catch (error) {
        console.warn(`   ⚠ ${seq.sequence_name}: ${error.message}`);
      }
    }
    
    await client.query('COMMIT');
    
    console.log('✅ Database cleaned successfully!');
    console.log('   All tables have been emptied.');
    console.log('   All sequences have been reset.\n');
    
    // Verify cleanup
    const result = await query(`
      SELECT 
        schemaname,
        relname as tablename,
        n_live_tup as row_count
      FROM pg_stat_user_tables
      WHERE schemaname = 'public'
      ORDER BY relname
    `);
    
    const tablesWithData = result.rows.filter(row => row.row_count > 0);
    
    if (tablesWithData.length === 0) {
      console.log('✅ Verification: All tables are empty.\n');
    } else {
      console.log('⚠️  Warning: Some tables still have data:');
      tablesWithData.forEach(row => {
        console.log(`   - ${row.tablename}: ${row.row_count} rows`);
      });
      console.log();
    }
    
    process.exit(0);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ Error cleaning database:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    client.release();
  }
}

clearAllData();

