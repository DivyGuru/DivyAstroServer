#!/usr/bin/env node

/**
 * UNIVERSAL KNOWLEDGE-AWARE INGESTION
 * 
 * CORE PHILOSOPHY:
 * - Extraction जो दे → DB वही ले
 * - Executability बाद की चीज़ है, ingestion का gate नहीं
 * - NEVER reject based on executability
 * 
 * Usage: node scripts/ingest/ingestUniversalRules.js <bookId>
 */

import { getClient } from '../../config/db.js';
import { mustGetBookId, getPathsForBook, readJson } from '../book/_shared.js';
import path from 'path';
import fs from 'fs';

/**
 * Classify rule nature and execution status
 * 
 * Mapping logic:
 * - Planet + House clear → EXECUTABLE, READY
 * - Situational / Behavioral / Soft timing → ADVISORY, PENDING
 * - Philosophical / Observation / Symbolic → OBSERVATIONAL, RAW
 */
function classifyRule(rule) {
  const { planet, house, rule_type, confidence_level } = rule;
  
  const hasPlanet = planet && planet.length > 0;
  const hasHouse = house && house.length > 0;
  const hasBoth = hasPlanet && hasHouse;
  
  // Determine rule nature
  let ruleNature = 'ADVISORY';
  let executionStatus = 'PENDING';
  
  if (hasBoth) {
    // Clear planet + house → executable
    ruleNature = 'EXECUTABLE';
    executionStatus = 'READY';
  } else if (hasPlanet || hasHouse) {
    // Partial mapping → advisory
    ruleNature = 'ADVISORY';
    executionStatus = 'PENDING';
  } else {
    // No explicit mapping → observational
    if (rule_type === 'philosophical' || rule_type === 'observation' || rule_type === 'symbolic') {
      ruleNature = 'OBSERVATIONAL';
      executionStatus = 'RAW';
    } else {
      ruleNature = 'ADVISORY';
      executionStatus = 'PENDING';
    }
  }
  
  return {
    rule_nature: ruleNature,
    execution_status: executionStatus,
    confidence_level: confidence_level || 'MEDIUM'
  };
}

/**
 * Check if rule has astrological signal
 */
function hasAstrologicalSignal(rule) {
  const { planet, house, rule_type, remedy_category } = rule;
  
  // Has planet or house
  if ((planet && planet.length > 0) || (house && house.length > 0)) {
    return true;
  }
  
  // Has rule type (behavioral, situational, etc.)
  if (rule_type && rule_type !== 'unknown') {
    return true;
  }
  
  // Has remedy category
  if (remedy_category && remedy_category !== 'unknown') {
    return true;
  }
  
  // Has effect text or remedy text
  if ((rule.effect_text && rule.effect_text.length > 10) || 
      (rule.remedy_text && rule.remedy_text.length > 10)) {
    return true;
  }
  
  return false;
}

/**
 * Convert universal rule to DB format
 */
function convertUniversalRule(rule, bookId) {
  const classification = classifyRule(rule);
  
  // Create condition tree if planet/house available
  let conditionTree = null;
  if (rule.planet && rule.planet.length > 0 && rule.house && rule.house.length > 0) {
    conditionTree = {
      planet_in_house: {
        planet_in: rule.planet,
        house_in: rule.house.map(h => parseInt(h) || h),
        match_mode: 'any',
        min_planets: 1
      }
    };
  } else if (rule.planet && rule.planet.length > 0) {
    // Only planets, no houses
    conditionTree = {
      planet_in_house: {
        planet_in: rule.planet,
        house_in: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        match_mode: 'any'
      }
    };
  }
  
  // Create effect_json
  const effectJson = {
    theme: 'general',
    area: rule.planet && rule.house && rule.planet.length > 0 && rule.house.length > 0 ?
      `${rule.planet[0].toLowerCase()}_house_${rule.house[0]}` : 'general',
    trend: 'mixed',
    intensity: 0.5,
    tone: 'informational',
    trigger: 'natal',
    scenario: 'placement_association',
    outcome_text: rule.effect_text || rule.remedy_text || rule.condition_text.substring(0, 200),
    variant_meta: {
      tone: 'informational',
      confidence_level: classification.confidence_level,
      dominance: 'primary',
      certainty_note: `Universal knowledge extraction. Rule type: ${rule.rule_type || 'unknown'}`,
      quality_status: 'UNIVERSAL_KNOWLEDGE',
      understanding_based: true
    },
    source: {
      book_id: bookId,
      extraction_mode: 'UNIVERSAL_DEEP'
    }
  };
  
  // Determine rule_type for DB (map from raw_rule_type)
  let dbRuleType = 'BASE';
  if (rule.rule_type === 'warning' || rule.rule_type === 'behavioral') {
    dbRuleType = 'BASE'; // Treat as base rules
  }
  
  return {
    rule_id: `${bookId}__universal_${rule.source?.chunk_id || Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    source_unit_id: rule.source?.chunk_id || null,
    source_book: bookId,
    extraction_phase: 'UNIVERSAL',
    rule_type: dbRuleType,
    point_code: null,
    variant_code: `${bookId}__universal_${rule.source?.chunk_id || 'unknown'}`,
    applicable_scopes: ['life_theme'],
    condition_tree: conditionTree,
    effect_json: effectJson,
    base_weight: 1.0,
    base_rule_ids: null,
    canonical_meaning: rule.effect_text || rule.remedy_text || rule.condition_text.substring(0, 300),
    engine_status: classification.execution_status === 'READY' ? 'READY' : 'PENDING_OPERATOR',
    is_active: true,
    // New universal knowledge fields
    rule_nature: classification.rule_nature,
    execution_status: classification.execution_status,
    raw_rule_type: rule.rule_type || 'unknown',
    confidence_level: classification.confidence_level
  };
}

/**
 * Get or create rule group
 */
async function getOrCreateRuleGroup(bookId, client) {
  const code = `book_${bookId}`;
  
  const existing = await client.query(
    'SELECT id FROM rule_groups WHERE code = $1',
    [code]
  );
  
  if (existing.rowCount > 0) {
    return existing.rows[0].id;
  }
  
  const result = await client.query(`
    INSERT INTO rule_groups (code, name, category, description)
    VALUES ($1, $2, $3, $4)
    RETURNING id
  `, [
    code,
    `Book: ${bookId}`,
    'prediction',
    `Rules from ${bookId} (Universal Knowledge)`
  ]);
  
  return result.rows[0].id;
}

/**
 * Ingest universal rules
 */
async function ingestUniversalRules(bookId, paths, client) {
  const rulesPath = path.join(paths.processedDir, 'rules.universal.v1.json');
  
  if (!fs.existsSync(rulesPath)) {
    console.log(`   ⚠️  No universal rules file found: ${rulesPath}`);
    return { ingested: 0, skipped: 0, byNature: {} };
  }
  
  const data = await readJson(rulesPath);
  const rules = data.rules || [];
  
  console.log(`   📋 Loading ${rules.length} universal rules...`);
  
  const ruleGroupId = await getOrCreateRuleGroup(bookId, client);
  
  let ingested = 0;
  let skipped = 0;
  const byNature = {
    EXECUTABLE: 0,
    ADVISORY: 0,
    OBSERVATIONAL: 0
  };
  
  for (const rule of rules) {
    try {
      // CRITICAL: Only skip if NO astrological signal
      if (!hasAstrologicalSignal(rule)) {
        skipped++;
        continue;
      }
      
      // Convert to DB format
      const dbRule = convertUniversalRule(rule, bookId);
      
      // Check if exists (by variant_code)
      const existsRes = await client.query(`
        SELECT id FROM rules WHERE variant_code = $1
      `, [dbRule.variant_code]);
      
      if (existsRes.rows.length > 0) {
        // Update existing
        await client.query(`
          UPDATE rules SET
            rule_nature = $1,
            execution_status = $2,
            raw_rule_type = $3,
            confidence_level = $4,
            condition_tree = $5,
            effect_json = $6,
            canonical_meaning = $7,
            engine_status = $8
          WHERE variant_code = $9
        `, [
          dbRule.rule_nature,
          dbRule.execution_status,
          dbRule.raw_rule_type,
          dbRule.confidence_level,
          JSON.stringify(dbRule.condition_tree),
          JSON.stringify(dbRule.effect_json),
          dbRule.canonical_meaning,
          dbRule.engine_status,
          dbRule.variant_code
        ]);
        
        ingested++;
        byNature[dbRule.rule_nature] = (byNature[dbRule.rule_nature] || 0) + 1;
      } else {
        // Insert new
        await client.query(`
          INSERT INTO rules (
            rule_group_id, name, description, applicable_scopes, condition_tree, effect_json,
            rule_id, rule_type, base_rule_ids, canonical_meaning, engine_status,
            source_book, source_unit_id, extraction_phase, variant_code,
            rule_nature, execution_status, raw_rule_type, confidence_level
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
          RETURNING id
        `, [
          ruleGroupId,
          dbRule.rule_id,
          dbRule.canonical_meaning,
          dbRule.applicable_scopes,
          JSON.stringify(dbRule.condition_tree),
          JSON.stringify(dbRule.effect_json),
          dbRule.rule_id,
          dbRule.rule_type,
          JSON.stringify(dbRule.base_rule_ids || []),
          dbRule.canonical_meaning,
          dbRule.engine_status,
          dbRule.source_book,
          dbRule.source_unit_id,
          dbRule.extraction_phase,
          dbRule.variant_code,
          dbRule.rule_nature,
          dbRule.execution_status,
          dbRule.raw_rule_type,
          dbRule.confidence_level
        ]);
        
        ingested++;
        byNature[dbRule.rule_nature] = (byNature[dbRule.rule_nature] || 0) + 1;
      }
    } catch (err) {
      console.error(`   ❌ Error ingesting rule:`, err.message);
      skipped++;
    }
  }
  
  return { ingested, skipped, byNature };
}

/**
 * Main function
 */
async function main() {
  const bookId = mustGetBookId(process.argv);
  
  console.log(`\n📥 UNIVERSAL KNOWLEDGE-AWARE INGESTION: ${bookId}\n`);
  console.log('Philosophy: Extraction जो दे → DB वही ले\n');
  
  const paths = getPathsForBook(bookId);
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    
    // Ingest universal rules
    console.log('📋 Ingesting universal rules...');
    const results = await ingestUniversalRules(bookId, paths, client);
    
    console.log(`\n✅ Ingestion complete:`);
    console.log(`   - Ingested: ${results.ingested}`);
    console.log(`   - Skipped: ${results.skipped}`);
    console.log(`\n📊 By rule nature:`);
    for (const [nature, count] of Object.entries(results.byNature)) {
      if (count > 0) {
        console.log(`   ${nature}: ${count}`);
      }
    }
    
    await client.query('COMMIT');
    
    // Verify
    const verifyRes = await client.query(`
      SELECT COUNT(*) as total
      FROM rules
      WHERE source_book = $1 AND is_active = TRUE
    `, [bookId]);
    
    console.log(`\n✅ Verification:`);
    console.log(`   Total rules in DB: ${verifyRes.rows[0].total}`);
    
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});

