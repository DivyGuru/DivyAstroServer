/**
 * Database Ingestion Script for Curated Astrology Rules
 * 
 * Ingests curated rules from astrobooks_processed/<bookId>/datasets/ into database.
 * 
 * Usage: node scripts/ingest/ingestBookRules.js <bookId>
 * 
 * CRITICAL PRINCIPLES:
 * - Database is single source of truth
 * - No astrology logic reimplementation
 * - Preserve all knowledge (even non-executable rules)
 * - Idempotent ingestion (safe re-runs)
 * - Zero data loss
 */

import { mustGetBookId, getPathsForBook, readJson } from '../book/_shared.js';
import { query, getClient } from '../../config/db.js';
import path from 'path';
import fs from 'fs';

// Supported operators (from _shared.js)
const SUPPORTED_OPERATORS = [
  'planet_in_house',
  'transit_planet_in_house',
  'dasha_running',
  'planet_strength',
  'transit_planet_strength',
  'house_lord_in_house',
  'transit_house_lord_in_house',
  'planet_in_nakshatra',
  'transit_planet_in_nakshatra',
  'planet_in_nakshatra_group',
  'transit_planet_in_nakshatra_group',
  'dasha_lord_in_nakshatra',
  'dasha_lord_in_nakshatra_group',
  'overall_benefic_score',
  'overall_malefic_score',
  'generic_condition',
];

/**
 * Recursively extracts all operator keys from a condition_tree
 */
function extractOperators(node, operators = new Set()) {
  if (!node || typeof node !== 'object') return operators;
  
  if (Array.isArray(node.all)) {
    node.all.forEach(child => extractOperators(child, operators));
    return operators;
  }
  if (Array.isArray(node.any)) {
    node.any.forEach(child => extractOperators(child, operators));
    return operators;
  }
  
  const keys = Object.keys(node);
  if (keys.length === 1) {
    const key = keys[0];
    if (SUPPORTED_OPERATORS.includes(key)) {
      operators.add(key);
    } else {
      operators.add(key); // Track unsupported operators
    }
  }
  
  return operators;
}

/**
 * Determines engine_status based on condition_tree
 */
function determineEngineStatus(conditionTree, ruleType) {
  const operators = extractOperators(conditionTree);
  
  // Check for unsupported operators
  const unsupported = Array.from(operators).filter(op => !SUPPORTED_OPERATORS.includes(op));
  
  // Check for generic_condition (placeholder)
  if (operators.has('generic_condition')) {
    return 'PENDING_OPERATOR';
  }
  
  // All operators are supported
  if (unsupported.length === 0) {
    return 'READY';
  }
  
  return 'PENDING_OPERATOR';
}

/**
 * Extracts missing operators from condition_tree
 */
function extractMissingOperators(conditionTree) {
  const operators = extractOperators(conditionTree);
  const missing = Array.from(operators).filter(op => !SUPPORTED_OPERATORS.includes(op));
  
  // Also check for generic_condition notes
  if (operators.has('generic_condition')) {
    // Try to extract what's needed from the note
    const note = conditionTree.generic_condition?.note || '';
    if (note.includes('strength state')) {
      missing.push('planet_strength_state');
    }
    if (note.includes('yoga')) {
      missing.push('yoga_present');
    }
  }
  
  return missing;
}

/**
 * Gets or creates a rule_group for the book
 */
async function getOrCreateRuleGroup(bookId, client) {
  const code = `book_${bookId}`;
  
  // Try to find existing group
  const existing = await client.query(
    'SELECT id FROM rule_groups WHERE code = $1',
    [code]
  );
  
  if (existing.rowCount > 0) {
    return existing.rows[0].id;
  }
  
  // Create new group
  const result = await client.query(`
    INSERT INTO rule_groups (code, name, category, description)
    VALUES ($1, $2, $3, $4)
    RETURNING id
  `, [
    code,
    `Book: ${bookId}`,
    'prediction',
    `Rules extracted from ${bookId} book`
  ]);
  
  return result.rows[0].id;
}

/**
 * Ingests Phase 1 BASE rules (Planet × House)
 */
async function ingestBaseRules(bookId, paths, client) {
  const rulesPath = paths.rulesPath;
  if (!fs.existsSync(rulesPath)) {
    console.log(`   ⚠️  No rules.v1.json found, skipping BASE rules`);
    return { ingested: 0, skipped: 0 };
  }
  
  const data = await readJson(rulesPath);
  const rules = data.rules || [];
  
  // Get or create rule group for this book
  const ruleGroupId = await getOrCreateRuleGroup(bookId, client);
  
  let ingested = 0;
  let skipped = 0;
  
  for (const rule of rules) {
    try {
      const engineStatus = determineEngineStatus(rule.condition_tree, 'BASE');
      const missingOps = extractMissingOperators(rule.condition_tree);
      
      // Check if rule already exists (by rule_id or variant_code)
      const existing = await client.query(
        'SELECT id FROM rules WHERE rule_id = $1 OR variant_code = $1',
        [rule.id]
      );
      
      if (existing.rowCount > 0) {
        const ruleDbId = existing.rows[0].id;
        // Update existing rule
        await client.query(`
          UPDATE rules
          SET condition_tree = $1,
              effect_json = $2,
              canonical_meaning = $3,
              engine_status = $4,
              source_unit_id = $5,
              rule_type = $6,
              base_rule_ids = $7,
              extraction_phase = $8,
              source_book = $9
          WHERE id = $10
        `, [
          JSON.stringify(rule.condition_tree),
          JSON.stringify(rule.effect_json),
          rule.effect_json?.outcome_text || null,
          engineStatus,
          rule.source_unit_id || null,
          'BASE',
          JSON.stringify([]),
          'PHASE1',
          bookId,
          ruleDbId
        ]);
        
        // Update engine requirements
        await client.query(
          'DELETE FROM rule_engine_requirements WHERE rule_id = $1',
          [ruleDbId]
        );
        for (const op of missingOps) {
          await client.query(`
            INSERT INTO rule_engine_requirements (rule_id, missing_operator, notes)
            VALUES ($1, $2, $3)
            ON CONFLICT (rule_id, missing_operator) DO NOTHING
          `, [ruleDbId, op, `Required for ${rule.id}`]);
        }
        
        ingested++;
      } else {
        // Insert new rule
        const result = await client.query(`
          INSERT INTO rules (
            rule_group_id, name, description, applicable_scopes, condition_tree, effect_json,
            rule_id, rule_type, base_rule_ids, canonical_meaning, engine_status,
            source_book, source_unit_id, extraction_phase, variant_code
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
          RETURNING id
        `, [
          ruleGroupId,
          rule.id, // Use rule_id as name
          rule.effect_json?.outcome_text || null,
          rule.applicable_scopes || ['life_theme'],
          JSON.stringify(rule.condition_tree),
          JSON.stringify(rule.effect_json),
          rule.id,
          'BASE',
          JSON.stringify([]),
          rule.effect_json?.outcome_text || null,
          engineStatus,
          bookId,
          rule.source_unit_id || null,
          'PHASE1',
          rule.variant_code || rule.id
        ]);
        
        const ruleDbId = result.rows[0].id;
        
        // Insert provenance
        await client.query(`
          INSERT INTO rule_provenance (rule_id, book_name, extraction_phase, confidence_level)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (rule_id, book_name, extraction_phase) DO NOTHING
        `, [
          ruleDbId,
          bookId,
          'PHASE1',
          rule.effect_json?.variant_meta?.confidence_level || 'medium'
        ]);
        
        // Insert engine requirements
        for (const op of missingOps) {
          await client.query(`
            INSERT INTO rule_engine_requirements (rule_id, missing_operator, notes)
            VALUES ($1, $2, $3)
            ON CONFLICT (rule_id, missing_operator) DO NOTHING
          `, [ruleDbId, op, `Required for ${rule.id}`]);
        }
        
        ingested++;
      }
    } catch (err) {
      console.error(`   ❌ Error ingesting rule ${rule.id}:`, err.message);
      skipped++;
    }
  }
  
  return { ingested, skipped };
}

/**
 * Ingests Phase 5 STRENGTH and YOGA rules
 */
async function ingestStrengthYogaRules(bookId, paths, client) {
  const strengthYogaPath = path.join(paths.processedDir, 'strength_yoga.rules.v1.json');
  if (!fs.existsSync(strengthYogaPath)) {
    console.log(`   ⚠️  No strength_yoga.rules.v1.json found, skipping STRENGTH/YOGA rules`);
    return { ingested: 0, skipped: 0 };
  }
  
  const data = await readJson(strengthYogaPath);
  const strengthRules = data.strength_rules || [];
  const yogaRules = data.yoga_rules || [];
  
  // Get or create rule group for this book
  const ruleGroupId = await getOrCreateRuleGroup(bookId, client);
  
  let ingested = 0;
  let skipped = 0;
  
  // Ingest strength rules
  for (const rule of strengthRules) {
    try {
      const engineStatus = determineEngineStatus(rule.condition_tree, 'STRENGTH');
      const missingOps = extractMissingOperators(rule.condition_tree);
      
      // Check if rule already exists
      const existing = await client.query(
        'SELECT id FROM rules WHERE rule_id = $1',
        [rule.rule_id]
      );
      
      if (existing.rowCount > 0) {
        const ruleDbId = existing.rows[0].id;
        await client.query(`
          UPDATE rules
          SET condition_tree = $1,
              effect_json = $2,
              canonical_meaning = $3,
              engine_status = $4,
              base_rule_ids = $5,
              planet = $6,
              strength_state = $7,
              extraction_phase = $8,
              source_book = $9
          WHERE id = $10
        `, [
          JSON.stringify(rule.condition_tree),
          JSON.stringify(rule.effect_json),
          rule.canonical_meaning || null,
          engineStatus,
          JSON.stringify(rule.base_rule_ids || []),
          rule.planet || null,
          rule.strength_state || null,
          'PHASE5',
          bookId,
          ruleDbId
        ]);
        
        // Update engine requirements
        await client.query(
          'DELETE FROM rule_engine_requirements WHERE rule_id = $1',
          [ruleDbId]
        );
        for (const op of missingOps) {
          await client.query(`
            INSERT INTO rule_engine_requirements (rule_id, missing_operator, notes)
            VALUES ($1, $2, $3)
            ON CONFLICT (rule_id, missing_operator) DO NOTHING
          `, [ruleDbId, op, `Required for ${rule.rule_id}`]);
        }
        
        ingested++;
      } else {
        const result = await client.query(`
          INSERT INTO rules (
            rule_group_id, name, description, applicable_scopes, condition_tree, effect_json,
            rule_id, rule_type, base_rule_ids, canonical_meaning, engine_status,
            source_book, source_unit_id, extraction_phase, planet, strength_state, variant_code
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
          RETURNING id
        `, [
          ruleGroupId,
          rule.rule_id,
          rule.canonical_meaning || null,
          ['life_theme'],
          JSON.stringify(rule.condition_tree),
          JSON.stringify(rule.effect_json),
          rule.rule_id,
          'STRENGTH',
          JSON.stringify(rule.base_rule_ids || []),
          rule.canonical_meaning || null,
          engineStatus,
          bookId,
          rule.source?.unit_id || null,
          'PHASE5',
          rule.planet || null,
          rule.strength_state || null,
          rule.rule_id
        ]);
        
        const ruleDbId = result.rows[0].id;
        
        await client.query(`
          INSERT INTO rule_provenance (rule_id, book_name, extraction_phase, confidence_level)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (rule_id, book_name, extraction_phase) DO NOTHING
        `, [
          ruleDbId,
          bookId,
          'PHASE5',
          rule.effect_json?.variant_meta?.confidence_level || 'medium'
        ]);
        
        for (const op of missingOps) {
          await client.query(`
            INSERT INTO rule_engine_requirements (rule_id, missing_operator, notes)
            VALUES ($1, $2, $3)
            ON CONFLICT (rule_id, missing_operator) DO NOTHING
          `, [ruleDbId, op, `Required for ${rule.rule_id}`]);
        }
        
        ingested++;
      }
    } catch (err) {
      console.error(`   ❌ Error ingesting strength rule ${rule.rule_id}:`, err.message);
      skipped++;
    }
  }
  
  // Ingest yoga rules
  for (const rule of yogaRules) {
    try {
      const engineStatus = determineEngineStatus(rule.condition_tree, 'YOGA');
      const missingOps = extractMissingOperators(rule.condition_tree);
      
      const existing = await client.query(
        'SELECT id FROM rules WHERE rule_id = $1',
        [rule.rule_id]
      );
      
      if (existing.rowCount > 0) {
        const ruleDbId = existing.rows[0].id;
        await client.query(`
          UPDATE rules
          SET condition_tree = $1,
              effect_json = $2,
              canonical_meaning = $3,
              engine_status = $4,
              base_rule_ids = $5,
              yoga_name = $6,
              planets = $7,
              extraction_phase = $8,
              source_book = $9
          WHERE id = $10
        `, [
          JSON.stringify(rule.condition_tree),
          JSON.stringify(rule.effect_json),
          rule.canonical_meaning || null,
          engineStatus,
          JSON.stringify(rule.base_rule_ids || []),
          rule.yoga_name || null,
          rule.planets || [],
          'PHASE5',
          bookId,
          ruleDbId
        ]);
        
        // Update engine requirements
        await client.query(
          'DELETE FROM rule_engine_requirements WHERE rule_id = $1',
          [ruleDbId]
        );
        for (const op of missingOps) {
          await client.query(`
            INSERT INTO rule_engine_requirements (rule_id, missing_operator, notes)
            VALUES ($1, $2, $3)
            ON CONFLICT (rule_id, missing_operator) DO NOTHING
          `, [ruleDbId, op, `Required for ${rule.rule_id}`]);
        }
        
        ingested++;
      } else {
        const result = await client.query(`
          INSERT INTO rules (
            rule_group_id, name, description, applicable_scopes, condition_tree, effect_json,
            rule_id, rule_type, base_rule_ids, canonical_meaning, engine_status,
            source_book, source_unit_id, extraction_phase, yoga_name, planets, variant_code
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
          RETURNING id
        `, [
          ruleGroupId,
          rule.rule_id,
          rule.canonical_meaning || null,
          ['life_theme'],
          JSON.stringify(rule.condition_tree),
          JSON.stringify(rule.effect_json),
          rule.rule_id,
          'YOGA',
          JSON.stringify(rule.base_rule_ids || []),
          rule.canonical_meaning || null,
          engineStatus,
          bookId,
          rule.source?.unit_id || null,
          'PHASE5',
          rule.yoga_name || null,
          rule.planets || [],
          rule.rule_id
        ]);
        
        const ruleDbId = result.rows[0].id;
        
        await client.query(`
          INSERT INTO rule_provenance (rule_id, book_name, extraction_phase, confidence_level)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (rule_id, book_name, extraction_phase) DO NOTHING
        `, [
          ruleDbId,
          bookId,
          'PHASE5',
          rule.effect_json?.variant_meta?.confidence_level || 'medium'
        ]);
        
        for (const op of missingOps) {
          await client.query(`
            INSERT INTO rule_engine_requirements (rule_id, missing_operator, notes)
            VALUES ($1, $2, $3)
            ON CONFLICT (rule_id, missing_operator) DO NOTHING
          `, [ruleDbId, op, `Required for ${rule.rule_id}`]);
        }
        
        ingested++;
      }
    } catch (err) {
      console.error(`   ❌ Error ingesting yoga rule ${rule.rule_id}:`, err.message);
      skipped++;
    }
  }
  
  return { ingested, skipped };
}

/**
 * Main ingestion function
 */
async function main() {
  const bookId = mustGetBookId(process.argv);
  
  console.log(`\n📥 Ingesting curated rules for book: ${bookId}\n`);
  
  const paths = getPathsForBook(bookId);
  
  // Validate datasets exist
  const requiredFiles = [
    paths.rulesPath,
    path.join(paths.processedDir, 'strength_yoga.rules.v1.json')
  ];
  
  const missingFiles = requiredFiles.filter(f => !fs.existsSync(f));
  if (missingFiles.length === requiredFiles.length) {
    console.error(`❌ No dataset files found for ${bookId}`);
    console.error(`   Expected at least one of:`);
    requiredFiles.forEach(f => console.error(`   - ${f}`));
    process.exit(1);
  }
  
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    
    const results = {
      base: { ingested: 0, skipped: 0 },
      strengthYoga: { ingested: 0, skipped: 0 }
    };
    
    // Ingest BASE rules (Phase 1)
    console.log('📋 Ingesting BASE rules (Phase 1)...');
    results.base = await ingestBaseRules(bookId, paths, client);
    console.log(`   ✅ Ingested: ${results.base.ingested}, Skipped: ${results.base.skipped}`);
    
    // Ingest STRENGTH/YOGA rules (Phase 5)
    console.log('\n📋 Ingesting STRENGTH/YOGA rules (Phase 5)...');
    results.strengthYoga = await ingestStrengthYogaRules(bookId, paths, client);
    console.log(`   ✅ Ingested: ${results.strengthYoga.ingested}, Skipped: ${results.strengthYoga.skipped}`);
    
    // Log ingestion
    const totalIngested = results.base.ingested + results.strengthYoga.ingested;
    const totalSkipped = results.base.skipped + results.strengthYoga.skipped;
    const status = totalSkipped === 0 ? 'success' : (totalIngested > 0 ? 'partial' : 'failed');
    
    await client.query(`
      INSERT INTO rule_ingestion_log (
        book_id, rules_ingested, rules_skipped, status, notes
      )
      VALUES ($1, $2, $3, $4, $5)
    `, [
      bookId,
      totalIngested,
      totalSkipped,
      status,
      `BASE: ${results.base.ingested}/${results.base.ingested + results.base.skipped}, STRENGTH/YOGA: ${results.strengthYoga.ingested}/${results.strengthYoga.ingested + results.strengthYoga.skipped}`
    ]);
    
    await client.query('COMMIT');
    
    console.log(`\n✅ Ingestion complete:`);
    console.log(`   - Total ingested: ${totalIngested}`);
    console.log(`   - Total skipped: ${totalSkipped}`);
    console.log(`   - Status: ${status}\n`);
    
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(`\n❌ Ingestion failed:`, err.message);
    process.exit(1);
  } finally {
    client.release();
  }
}

main().catch((err) => {
  console.error('❌ ingestBookRules failed:', err.message);
  process.exit(1);
});

