#!/usr/bin/env node

/**
 * Check Book Rules in Database
 * 
 * Flexible script to check rules for any book in the database.
 * Data comes from DB, not hardcoded.
 * 
 * Usage:
 *   node scripts/checkBookDB.js [bookId]
 *   node scripts/checkBookDB.js lalkitab
 *   node scripts/checkBookDB.js --all-books
 */

import { query } from '../config/db.js';

async function checkBookDB(bookId = null) {
  try {
    if (bookId === '--all-books') {
      await checkAllBooks();
      return;
    }
    
    if (bookId) {
      await checkSingleBook(bookId);
    } else {
      // Default: show all books summary
      await checkAllBooksSummary();
    }
    
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Error:', err.message);
    console.error('Stack:', err.stack);
    process.exit(1);
  }
}

async function checkSingleBook(bookId) {
  console.log(`\n🔍 Checking ${bookId} rules in database...\n`);

  // 1. Check if source_book column exists
  const colsRes = await query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'rules' 
    AND column_name IN ('source_book', 'rule_type', 'engine_status', 'rule_id')
    ORDER BY column_name
  `);
  
  console.log('=== RULES TABLE COLUMNS ===');
  if (colsRes.rows.length === 0) {
    console.log('❌ source_book, rule_type, engine_status, rule_id columns NOT found');
    console.log('   Migration might not be applied.');
    return;
  } else {
    colsRes.rows.forEach(col => {
      console.log(`✅ ${col.column_name}: ${col.data_type}`);
    });
  }

  // 2. Check if book exists in DB
  const bookExistsRes = await query(`
    SELECT COUNT(*) as total
    FROM rules 
    WHERE source_book = $1 AND is_active = TRUE
  `, [bookId]);
  
  if (bookExistsRes.rows[0].total == 0) {
    console.log(`\n❌ No rules found for book: ${bookId}`);
    console.log(`   Run: npm run ingest -- ${bookId}`);
    return;
  }

  // 3. Get book rules stats
  const statsRes = await query(`
    SELECT 
      COUNT(*) as total,
      COUNT(CASE WHEN rule_type = 'BASE' THEN 1 END) as base_rules,
      COUNT(CASE WHEN rule_type = 'STRENGTH' THEN 1 END) as strength_rules,
      COUNT(CASE WHEN rule_type = 'YOGA' THEN 1 END) as yoga_rules,
      COUNT(CASE WHEN rule_type = 'NAKSHATRA' THEN 1 END) as nakshatra_rules,
      COUNT(CASE WHEN rule_type = 'DASHA' THEN 1 END) as dasha_rules,
      COUNT(CASE WHEN rule_type = 'TRANSIT' THEN 1 END) as transit_rules,
      COUNT(CASE WHEN engine_status = 'READY' THEN 1 END) as ready_rules,
      COUNT(CASE WHEN engine_status = 'PENDING_OPERATOR' THEN 1 END) as pending_rules
    FROM rules 
    WHERE source_book = $1 AND is_active = TRUE
  `, [bookId]);
  
  console.log(`\n=== ${bookId.toUpperCase()} RULES COUNT ===`);
  const stats = statsRes.rows[0];
  console.log(`Total: ${stats.total}`);
  console.log(`BASE: ${stats.base_rules}`);
  console.log(`STRENGTH: ${stats.strength_rules}`);
  console.log(`YOGA: ${stats.yoga_rules}`);
  console.log(`NAKSHATRA: ${stats.nakshatra_rules}`);
  console.log(`DASHA: ${stats.dasha_rules}`);
  console.log(`TRANSIT: ${stats.transit_rules}`);
  console.log(`READY: ${stats.ready_rules}`);
  console.log(`PENDING_OPERATOR: ${stats.pending_rules}`);

  // 4. Check applicable_scopes
  const scopesRes = await query(`
    SELECT applicable_scopes, COUNT(*) as count
    FROM rules 
    WHERE source_book = $1 AND is_active = TRUE
    GROUP BY applicable_scopes
    ORDER BY count DESC
  `, [bookId]);
  
  console.log(`\n=== APPLICABLE SCOPES ===`);
  if (scopesRes.rows.length === 0) {
    console.log('❌ No rules found with applicable_scopes');
  } else {
    scopesRes.rows.forEach(row => {
      console.log(`${JSON.stringify(row.applicable_scopes)}: ${row.count} rules`);
    });
  }

  // 5. Check sample rules
  const sampleRes = await query(`
    SELECT id, rule_id, rule_type, name, applicable_scopes, engine_status, 
           point_code, source_unit_id
    FROM rules 
    WHERE source_book = $1 AND is_active = TRUE
    LIMIT 10
  `, [bookId]);
  
  console.log(`\n=== SAMPLE RULES (first 10) ===`);
  if (sampleRes.rows.length === 0) {
    console.log('❌ No rules found in database');
  } else {
    sampleRes.rows.forEach((rule, idx) => {
      console.log(`\n${idx + 1}. Rule ID: ${rule.rule_id || rule.id}`);
      console.log(`   Type: ${rule.rule_type || 'N/A'}`);
      console.log(`   Name: ${rule.name || 'N/A'}`);
      console.log(`   Scopes: ${JSON.stringify(rule.applicable_scopes || [])}`);
      console.log(`   Status: ${rule.engine_status || 'N/A'}`);
      console.log(`   Point Code: ${rule.point_code || 'N/A'}`);
    });
  }

  // 6. Check ingestion log
  try {
    const logRes = await query(`
      SELECT * FROM rule_ingestion_log 
      WHERE book_id = $1
      ORDER BY ingestion_timestamp DESC 
      LIMIT 3
    `, [bookId]);
    
    console.log(`\n=== INGESTION LOG ===`);
    if (logRes.rows.length === 0) {
      console.log(`❌ No ingestion log found for ${bookId}`);
      console.log(`   This means ${bookId} might not have been ingested yet`);
    } else {
      logRes.rows.forEach((log, idx) => {
        console.log(`\n${idx + 1}. ${log.ingestion_timestamp}`);
        console.log(`   Status: ${log.status}`);
        console.log(`   Ingested: ${log.rules_ingested}`);
        console.log(`   Skipped: ${log.rules_skipped}`);
        console.log(`   Notes: ${log.notes || 'N/A'}`);
      });
    }
  } catch (err) {
    console.log(`\n=== INGESTION LOG ===`);
    console.log('❌ rule_ingestion_log table not found');
  }

  // 7. Check rules for yearly scope
  const yearlyRes = await query(`
    SELECT COUNT(*) as total
    FROM rules 
    WHERE is_active = TRUE 
      AND source_book = $1
      AND 'yearly' = ANY(applicable_scopes)
  `, [bookId]);
  console.log(`\n=== RULES FOR YEARLY SCOPE ===`);
  console.log(`Total: ${yearlyRes.rows[0].total}`);

  console.log('\n✅ Check complete!\n');
}

async function checkAllBooksSummary() {
  console.log('\n🔍 Checking all books in database...\n');

  // Get all books
  const booksRes = await query(`
    SELECT 
      source_book,
      COUNT(*) as total_rules,
      COUNT(CASE WHEN engine_status = 'READY' THEN 1 END) as ready_rules,
      COUNT(CASE WHEN engine_status = 'PENDING_OPERATOR' THEN 1 END) as pending_rules,
      COUNT(DISTINCT rule_type) as rule_types_count
    FROM rules
    WHERE is_active = TRUE
      AND source_book IS NOT NULL
    GROUP BY source_book
    ORDER BY total_rules DESC
  `);
  
  console.log('=== ALL BOOKS SUMMARY ===\n');
  if (booksRes.rows.length === 0) {
    console.log('❌ No books found in database');
    console.log('   Run: npm run ingest -- <bookId>');
  } else {
    booksRes.rows.forEach((book, idx) => {
      console.log(`${idx + 1}. ${book.source_book}:`);
      console.log(`   Total rules: ${book.total_rules}`);
      console.log(`   READY: ${book.ready_rules}`);
      console.log(`   PENDING: ${book.pending_rules}`);
      console.log(`   Rule types: ${book.rule_types_count}`);
      console.log('');
    });
    
    console.log(`\nTotal books: ${booksRes.rows.length}`);
    console.log(`\nTo check specific book: node scripts/checkBookDB.js <bookId>`);
  }
}

async function checkAllBooks() {
  const booksRes = await query(`
    SELECT DISTINCT source_book
    FROM rules
    WHERE is_active = TRUE
      AND source_book IS NOT NULL
    ORDER BY source_book
  `);
  
  const books = booksRes.rows.map(r => r.source_book);
  
  for (const bookId of books) {
    await checkSingleBook(bookId);
    console.log('\n' + '='.repeat(60) + '\n');
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const bookId = args[0] || null;

checkBookDB(bookId);
