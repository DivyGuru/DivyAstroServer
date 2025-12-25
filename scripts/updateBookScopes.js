#!/usr/bin/env node

/**
 * Update applicable_scopes for Book Rules
 * 
 * Flexible script to update scopes for any book in the database.
 * Data comes from DB, not hardcoded.
 * 
 * Usage:
 *   node scripts/updateBookScopes.js [bookId] [--scopes yearly,monthly,daily,hourly]
 *   node scripts/updateBookScopes.js lalkitab
 *   node scripts/updateBookScopes.js lalkitab --scopes yearly,monthly,daily,hourly
 *   node scripts/updateBookScopes.js --all-books --scopes yearly,monthly,daily,hourly
 */

import { query, getClient } from '../config/db.js';

async function updateBookScopes(bookId, newScopes) {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    
    if (bookId === '--all-books') {
      await updateAllBooksScopes(client, newScopes);
    } else {
      await updateSingleBookScopes(client, bookId, newScopes);
    }
    
    await client.query('COMMIT');
    console.log('\n✅ Update complete!\n');
    process.exit(0);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('\n❌ Error:', err.message);
    console.error('Stack:', err.stack);
    process.exit(1);
  } finally {
    client.release();
  }
}

async function updateSingleBookScopes(client, bookId, newScopes) {
  console.log(`\n🔄 Updating applicable_scopes for ${bookId} rules...\n`);
  
  // Check if book exists
  const bookExistsRes = await client.query(`
    SELECT COUNT(*) as total
    FROM rules 
    WHERE source_book = $1 AND is_active = TRUE
  `, [bookId]);
  
  if (bookExistsRes.rows[0].total == 0) {
    console.log(`❌ No rules found for book: ${bookId}`);
    console.log(`   Run: npm run ingest -- ${bookId}`);
    return;
  }
  
  // Convert scopes array to PostgreSQL array format
  const scopesArray = newScopes.map(s => `'${s}'`).join(', ');
  const scopesPgArray = `ARRAY[${scopesArray}]::prediction_scope[]`;
  
  // Check current state
  const checkRes = await client.query(`
    SELECT COUNT(*) as total,
           COUNT(CASE WHEN applicable_scopes = $2 THEN 1 END) as already_updated
    FROM rules 
    WHERE source_book = $1 AND is_active = TRUE
  `, [bookId, newScopes]);
  
  const stats = checkRes.rows[0];
  console.log('=== CURRENT STATE ===');
  console.log(`Total ${bookId} rules: ${stats.total}`);
  console.log(`Already updated: ${stats.already_updated}`);
  console.log(`New scopes: ${JSON.stringify(newScopes)}`);
  
  // Update applicable_scopes
  const updateRes = await client.query(`
    UPDATE rules
    SET applicable_scopes = $2::prediction_scope[]
    WHERE source_book = $1 
      AND is_active = TRUE
      AND applicable_scopes != $2::prediction_scope[]
    RETURNING id, rule_id, rule_type
  `, [bookId, newScopes]);
  
  console.log(`\n✅ Updated ${updateRes.rowCount} rules`);
  
  if (updateRes.rowCount > 0) {
    console.log('\n=== SAMPLE UPDATED RULES (first 10) ===');
    updateRes.rows.slice(0, 10).forEach((rule, idx) => {
      console.log(`${idx + 1}. ${rule.rule_id} (${rule.rule_type})`);
    });
  }
  
  // Verify update
  const verifyRes = await client.query(`
    SELECT COUNT(*) as total,
           COUNT(CASE WHEN applicable_scopes = $2 THEN 1 END) as updated_count
    FROM rules 
    WHERE source_book = $1 AND is_active = TRUE
  `, [bookId, newScopes]);
  
  const verifyStats = verifyRes.rows[0];
  console.log('\n=== VERIFICATION ===');
  console.log(`Total ${bookId} rules: ${verifyStats.total}`);
  console.log(`With new scopes: ${verifyStats.updated_count}`);
  
  // Check scope queries
  for (const scope of newScopes) {
    const scopeRes = await client.query(`
      SELECT COUNT(*) as total
      FROM rules 
      WHERE is_active = TRUE 
        AND source_book = $1
        AND $2 = ANY(applicable_scopes)
    `, [bookId, scope]);
    
    console.log(`✅ Rules queryable by '${scope}' scope: ${scopeRes.rows[0].total}`);
  }
}

async function updateAllBooksScopes(client, newScopes) {
  console.log(`\n🔄 Updating applicable_scopes for ALL books...\n`);
  
  // Get all books
  const booksRes = await client.query(`
    SELECT DISTINCT source_book
    FROM rules
    WHERE is_active = TRUE
      AND source_book IS NOT NULL
    ORDER BY source_book
  `);
  
  const books = booksRes.rows.map(r => r.source_book);
  
  for (const bookId of books) {
    await updateSingleBookScopes(client, bookId, newScopes);
    console.log('\n' + '='.repeat(60) + '\n');
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
let bookId = 'lalkitab';
let newScopes = ['yearly', 'monthly', 'daily', 'hourly'];

if (args.length > 0) {
  if (args[0] !== '--all-books' && !args[0].startsWith('--')) {
    bookId = args[0];
  } else if (args[0] === '--all-books') {
    bookId = '--all-books';
  }
  
  const scopesIndex = args.findIndex(arg => arg === '--scopes');
  if (scopesIndex !== -1 && args[scopesIndex + 1]) {
    newScopes = args[scopesIndex + 1].split(',').map(s => s.trim()).filter(Boolean);
  }
}

updateBookScopes(bookId, newScopes);
