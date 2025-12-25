#!/usr/bin/env node

/**
 * Activate Layer 5: Convert STRENGTH rules from generic_condition to planet_strength
 * 
 * Flexible script to activate STRENGTH rules for any book.
 * Data comes from DB, not files.
 * 
 * Usage:
 *   node scripts/activateLayer5Strength.js [bookId]
 *   node scripts/activateLayer5Strength.js lalkitab
 *   node scripts/activateLayer5Strength.js --all-books
 */

import { query, getClient } from '../config/db.js';

async function activateLayer5Strength(bookId) {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    
    if (bookId === '--all-books') {
      await activateAllBooks(client);
    } else {
      await activateSingleBook(client, bookId);
    }
    
    await client.query('COMMIT');
    console.log('\n✅ Layer 5 (STRENGTH) activation complete!\n');
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

async function activateSingleBook(client, bookId) {
  console.log(`\n🔄 Activating Layer 5: STRENGTH Rules for ${bookId}...\n`);
  
  // Check if book has STRENGTH rules
  const bookExistsRes = await client.query(`
    SELECT COUNT(*) as total
    FROM rules 
    WHERE source_book = $1 AND is_active = TRUE AND rule_type = 'STRENGTH'
  `, [bookId]);
  
  if (bookExistsRes.rows[0].total == 0) {
    console.log(`❌ No STRENGTH rules found for book: ${bookId}`);
    return;
  }
  
  // Get all STRENGTH rules from DB
  const strengthRulesRes = await client.query(`
    SELECT id, rule_id, condition_tree, source_unit_id
    FROM rules
    WHERE source_book = $1
      AND is_active = TRUE
      AND rule_type = 'STRENGTH'
  `, [bookId]);
  
  console.log(`Found ${strengthRulesRes.rowCount} STRENGTH rules in database`);
  
  // Check current state
  const currentRes = await client.query(`
    SELECT COUNT(*) as total,
           COUNT(CASE WHEN condition_tree::jsonb ? 'generic_condition' THEN 1 END) as generic_count,
           COUNT(CASE WHEN condition_tree::jsonb ? 'planet_strength' THEN 1 END) as strength_count
    FROM rules
    WHERE source_book = $1
      AND is_active = TRUE
      AND rule_type = 'STRENGTH'
  `, [bookId]);
  
  const stats = currentRes.rows[0];
  console.log('=== CURRENT STATE ===');
  console.log(`Total STRENGTH rules: ${stats.total}`);
  console.log(`Using generic_condition: ${stats.generic_count}`);
  console.log(`Using planet_strength: ${stats.strength_count}`);
  
  let updated = 0;
  let skipped = 0;
  
  // Map strength states to engine format
  const strengthStateMap = {
    'EXALTED': 'EXALTED',
    'DEBILITATED': 'DEBILITATED',
    'OWN_SIGN': 'OWN_SIGN',
    'RETROGRADE': 'RETROGRADE',
    'MOOLTRIKONA': 'MOOLTRIKONA',
    'FRIENDLY': 'FRIENDLY',
    'ENEMY': 'ENEMY'
  };
  
  // Extract planet and strength_state from rule_id or condition_tree
  for (const dbRule of strengthRulesRes.rows) {
    try {
      const ruleId = dbRule.rule_id;
      const currentTree = dbRule.condition_tree;
      
      // Check if already using planet_strength
      if (currentTree && currentTree.planet_strength) {
        console.log(`   ✓ Already using planet_strength: ${ruleId}`);
        continue;
      }
      
      // Try to extract planet and strength_state from rule_id
      // Format: PLANET_STATE (e.g., SUN_EXALTED, JUPITER_DEBILITATED)
      let planet = null;
      let strengthState = null;
      
      // Parse rule_id pattern: PLANET_STATE
      const parts = ruleId.split('_');
      if (parts.length >= 2) {
        const possiblePlanets = ['SUN', 'MOON', 'MARS', 'MERCURY', 'JUPITER', 'VENUS', 'SATURN', 'RAHU', 'KETU'];
        const planetIndex = parts.findIndex(p => possiblePlanets.includes(p));
        
        if (planetIndex !== -1) {
          planet = parts[planetIndex];
          strengthState = parts.slice(planetIndex + 1).join('_');
        }
      }
      
      // If not found in rule_id, try to extract from generic_condition note
      if (!planet || !strengthState) {
        if (currentTree && currentTree.generic_condition && currentTree.generic_condition.note) {
          const note = currentTree.generic_condition.note;
          // Pattern: "Planet PLANET in STATE state"
          const planetMatch = note.match(/Planet\s+(\w+)\s+in\s+(\w+)/i);
          if (planetMatch) {
            planet = planetMatch[1].toUpperCase();
            strengthState = planetMatch[2].toUpperCase();
          }
        }
      }
      
      if (!planet || !strengthState) {
        console.log(`   ⚠️  Skipping ${ruleId}: cannot extract planet/strength_state`);
        skipped++;
        continue;
      }
      
      // Build new condition tree
      const newConditionTree = {
        planet_strength: {
          planet: planet,
          strength_state: strengthStateMap[strengthState] || strengthState,
          min: null,
          max: null
        }
      };
      
      // Update rule
      await client.query(
        `UPDATE rules
         SET condition_tree = $1::jsonb,
             engine_status = 'READY'
         WHERE id = $2`,
        [JSON.stringify(newConditionTree), dbRule.id]
      );
      
      console.log(`   ✅ Updated ${ruleId}: ${planet} ${strengthState}`);
      updated++;
      
    } catch (err) {
      console.error(`   ❌ Error updating ${dbRule.rule_id}:`, err.message);
      skipped++;
    }
  }
  
  // Verify update
  const verifyRes = await client.query(`
    SELECT COUNT(*) as total,
           COUNT(CASE WHEN condition_tree::jsonb ? 'generic_condition' THEN 1 END) as generic_count,
           COUNT(CASE WHEN condition_tree::jsonb ? 'planet_strength' THEN 1 END) as strength_count,
           COUNT(CASE WHEN engine_status = 'READY' THEN 1 END) as ready_count
    FROM rules
    WHERE source_book = $1
      AND is_active = TRUE
      AND rule_type = 'STRENGTH'
  `, [bookId]);
  
  const verifyStats = verifyRes.rows[0];
  console.log('\n=== VERIFICATION ===');
  console.log(`Total STRENGTH rules: ${verifyStats.total}`);
  console.log(`Using generic_condition: ${verifyStats.generic_count}`);
  console.log(`Using planet_strength: ${verifyStats.strength_count}`);
  console.log(`Engine status READY: ${verifyStats.ready_count}`);
  
  console.log(`\n✅ Updated: ${updated} rules`);
  console.log(`⚠️  Skipped: ${skipped} rules`);
}

async function activateAllBooks(client) {
  console.log(`\n🔄 Activating Layer 5: STRENGTH Rules for ALL books...\n`);
  
  // Get all books with STRENGTH rules
  const booksRes = await client.query(`
    SELECT DISTINCT source_book
    FROM rules
    WHERE is_active = TRUE
      AND rule_type = 'STRENGTH'
      AND source_book IS NOT NULL
    ORDER BY source_book
  `);
  
  const books = booksRes.rows.map(r => r.source_book);
  
  for (const bookId of books) {
    await activateSingleBook(client, bookId);
    console.log('\n' + '='.repeat(60) + '\n');
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const bookId = args[0] || 'lalkitab';

activateLayer5Strength(bookId);
