#!/usr/bin/env node

/**
 * STRICT FINAL INGESTION
 * 
 * RULES:
 * - ONE source object = ONE DB row
 * - NO deduplication
 * - NO merging
 * - NO checking for existing records
 * - ALWAYS INSERT
 * 
 * Usage: node scripts/ingest/ingestStrictFinal.js lalkitab
 */

import { getClient } from '../../config/db.js';
import { mustGetBookId, getPathsForBook, readJson } from '../book/_shared.js';
import { hasHindiText, rewriteToPredictionEnglish } from './translateToEnglish.js';
import path from 'path';
import fs from 'fs';

/**
 * Convert planet names to IDs
 */
function convertPlanetNamesToIds(planetNames) {
  if (!planetNames || !Array.isArray(planetNames)) {
    return null;
  }
  
  const planetMap = {
    'SUN': 0, 'MOON': 1, 'MARS': 2, 'MERCURY': 3,
    'JUPITER': 4, 'VENUS': 5, 'SATURN': 6, 'RAHU': 7, 'KETU': 8
  };
  
  return planetNames
    .map(p => planetMap[p?.toUpperCase()])
    .filter(id => id !== undefined);
}

/**
 * Classify rule nature and execution status
 */
function classifyRule(rule) {
  const { planet, house, rule_type } = rule;
  
  const hasPlanet = planet && planet.length > 0;
  const hasHouse = house && house.length > 0;
  const hasBoth = hasPlanet && hasHouse;
  
  let ruleNature = 'ADVISORY';
  let executionStatus = 'PENDING';
  
  if (hasBoth) {
    ruleNature = 'EXECUTABLE';
    executionStatus = 'READY';
  } else if (hasPlanet || hasHouse) {
    ruleNature = 'ADVISORY';
    executionStatus = 'PENDING';
  } else {
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
    confidence_level: rule.confidence_level || 'MEDIUM'
  };
}

/**
 * Convert universal rule to DB format
 */
function convertRule(rule, bookId, index) {
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
    conditionTree = {
      planet_in_house: {
        planet_in: rule.planet,
        house_in: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        match_mode: 'any'
      }
    };
  }
  
  // Create unique rule_id (using index to ensure uniqueness)
  const ruleId = `${bookId}__universal_rule_${index}_${rule.source?.chunk_id || 'unknown'}`;
  
  // Translate to prediction-grade English using AI understanding
  const rawText = rule.effect_text || rule.condition_text || '';
  let englishText;
  
  try {
    englishText = rewriteToPredictionEnglish(rawText, { rule_type: rule.rule_type });
  } catch (err) {
    throw new Error(`Rule ${index} translation failed: ${err.message}`);
  }
  
  if (!englishText || hasHindiText(englishText)) {
    throw new Error(`Rule ${index} contains Hindi text that could not be translated: ${rawText.substring(0, 100)}`);
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
    outcome_text: englishText,
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
      extraction_mode: 'UNIVERSAL_DEEP',
      source_index: index
    }
  };
  
  return {
    rule_id: ruleId,
    source_unit_id: rule.source?.chunk_id || null,
    source_book: bookId,
    extraction_phase: 'UNIVERSAL',
    rule_type: 'BASE',
    point_code: null,
    variant_code: `${bookId}__universal_${index}`,
    // Universal rules should be applicable to all scopes
    applicable_scopes: ['yearly', 'monthly', 'weekly', 'daily', 'life_theme'],
    condition_tree: conditionTree,
    effect_json: effectJson,
    base_weight: 1.0,
    base_rule_ids: null,
    canonical_meaning: englishText,
    engine_status: classification.execution_status === 'READY' ? 'READY' : 'PENDING_OPERATOR',
    is_active: true,
    rule_nature: classification.rule_nature,
    execution_status: classification.execution_status,
    raw_rule_type: rule.rule_type || 'unknown',
    confidence_level: classification.confidence_level
  };
}

/**
 * Extract themes from remedy description
 * Maps remedy text to prediction_theme enum values
 */
function extractThemesFromDescription(description) {
  if (!description || typeof description !== 'string') {
    return null;
  }
  
  const text = description.toLowerCase();
  const themes = [];
  
  // Money/Finance keywords
  if (text.includes('money') || text.includes('wealth') || text.includes('finance') || 
      text.includes('धन') || text.includes('पैसा') || text.includes('आर्थिक') ||
      text.includes('donation') || text.includes('charity') || text.includes('दान')) {
    themes.push('money');
  }
  
  // Career keywords
  if (text.includes('career') || text.includes('job') || text.includes('work') ||
      text.includes('करियर') || text.includes('नौकरी') || text.includes('काम') ||
      text.includes('business') || text.includes('व्यापार')) {
    themes.push('career');
  }
  
  // Relationship keywords
  if (text.includes('relationship') || text.includes('marriage') || text.includes('love') ||
      text.includes('संबंध') || text.includes('विवाह') || text.includes('प्रेम') ||
      text.includes('partner') || text.includes('साथी')) {
    themes.push('relationship');
  }
  
  // Health keywords
  if (text.includes('health') || text.includes('disease') || text.includes('illness') ||
      text.includes('स्वास्थ्य') || text.includes('रोग') || text.includes('बीमारी') ||
      text.includes('body') || text.includes('शरीर')) {
    themes.push('health');
  }
  
  // Family keywords
  if (text.includes('family') || text.includes('children') || text.includes('parents') ||
      text.includes('परिवार') || text.includes('बच्चे') || text.includes('माता-पिता') ||
      text.includes('home') || text.includes('घर')) {
    themes.push('family');
  }
  
  // Spirituality keywords
  if (text.includes('spiritual') || text.includes('meditation') || text.includes('prayer') ||
      text.includes('आध्यात्मिक') || text.includes('ध्यान') || text.includes('प्रार्थना') ||
      text.includes('mantra') || text.includes('मंत्र') || text.includes('puja') || text.includes('पूजा')) {
    themes.push('spirituality');
  }
  
  // Education keywords
  if (text.includes('education') || text.includes('learning') || text.includes('study') ||
      text.includes('शिक्षा') || text.includes('पढ़ाई') || text.includes('ज्ञान')) {
    themes.push('education');
  }
  
  // Travel keywords
  if (text.includes('travel') || text.includes('journey') || text.includes('trip') ||
      text.includes('यात्रा') || text.includes('सफर')) {
    themes.push('travel');
  }
  
  // If no specific theme found, default to 'general'
  if (themes.length === 0) {
    themes.push('general');
  }
  
  // Return unique themes
  return [...new Set(themes)];
}

/**
 * Map remedy category to DB type
 * 
 * FIXED: Only map to 'meditation' if source text actually contains meditation terms.
 * Only map 'symbolic' to 'puja' if it actually mentions worship/prayer.
 * Previously, all 'behavior' category remedies were incorrectly mapped to 'meditation',
 * and all 'symbolic' category remedies were incorrectly mapped to 'puja'.
 */
function mapRemedyType(category, remedyText = '') {
  // If behavior category, check if it's actually meditation
  if (category === 'behavior') {
    const text = (remedyText || '').toLowerCase();
    // Check for meditation-specific terms
    if (text.includes('ध्यान') || 
        text.includes('meditation') || 
        text.includes('meditate') ||
        text.includes('dhyan') ||
        text.includes('समाधि')) {
      return 'meditation';
    }
    // Otherwise, treat as generic behavior advice (map to donation)
    return 'donation';
  }
  
  const typeMap = {
    'donation': 'donation',
    'feeding': 'feeding_beings',
    // FIXED: Only map 'symbolic' to 'puja' if it actually mentions worship/prayer
    // Otherwise, symbolic acts (gemstones, yantras) are more like donation
    'symbolic': remedyText && (
      remedyText.toLowerCase().includes('puja') ||
      remedyText.toLowerCase().includes('worship') ||
      remedyText.toLowerCase().includes('पूजा') ||
      remedyText.toLowerCase().includes('prayer')
    ) ? 'puja' : 'donation',
    'worship': 'puja',
    'mantra': 'mantra',
    'fast': 'fast',
    'unknown': 'donation' // Default to donation
  };
  
  return typeMap[category] || 'donation';
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
    `Rules from ${bookId} (Universal Knowledge - Strict)`
  ]);
  
  return result.rows[0].id;
}

/**
 * STEP 1: Ingest Rules (STRICT - NO DEDUPLICATION)
 */
async function ingestRulesStrict(bookId, paths, client) {
  const rulesPath = path.join(paths.processedDir, 'rules.universal.v1.json');
  
  if (!fs.existsSync(rulesPath)) {
    throw new Error(`Rules file not found: ${rulesPath}`);
  }
  
  const data = await readJson(rulesPath);
  const rules = data.rules || [];
  
  console.log(`\n📋 STEP 1: Ingesting Rules`);
  console.log(`   Source file: ${rulesPath}`);
  console.log(`   Total rules in source: ${rules.length}\n`);
  
  const ruleGroupId = await getOrCreateRuleGroup(bookId, client);
  
  let ingested = 0;
  let skipped = 0;
  const byNature = {
    EXECUTABLE: 0,
    ADVISORY: 0,
    OBSERVATIONAL: 0
  };
  const byStatus = {
    READY: 0,
    PENDING: 0,
    RAW: 0
  };
  
  // STRICT: Insert EVERY rule, NO checking for existing
  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i];
    
    try {
      // FIXED: Skip rules without planet/house - they cannot create condition_tree
      if ((!rule.planet || rule.planet.length === 0) && (!rule.house || rule.house.length === 0)) {
        skipped++;
        continue; // Skip - cannot create condition_tree without planet/house
      }
      
      const dbRule = convertRule(rule, bookId, i);
      
      // FIXED: Double-check - reject if condition_tree is still null after conversion
      if (!dbRule.condition_tree) {
        skipped++;
        continue; // Skip - condition_tree is null, rule cannot be evaluated
      }
      
      // ALWAYS INSERT - NO CHECKING
      await client.query(`
        INSERT INTO rules (
          rule_group_id, name, description, applicable_scopes, condition_tree, effect_json,
          rule_id, rule_type, base_rule_ids, canonical_meaning, engine_status,
          source_book, source_unit_id, extraction_phase, variant_code,
          rule_nature, execution_status, raw_rule_type, confidence_level
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
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
      byStatus[dbRule.execution_status] = (byStatus[dbRule.execution_status] || 0) + 1;
    } catch (err) {
      console.error(`   ❌ Error ingesting rule ${i}:`, err.message);
      skipped++;
    }
  }
  
  return { ingested, skipped, byNature, byStatus };
}

/**
 * STEP 2: Ingest Remedies (STRICT - ONE OBJECT = ONE ROW)
 */
async function ingestRemediesStrict(bookId, paths, client) {
  const remediesPath = path.join(paths.processedDir, 'remedies.universal.v1.json');
  
  if (!fs.existsSync(remediesPath)) {
    throw new Error(`Remedies file not found: ${remediesPath}`);
  }
  
  const data = await readJson(remediesPath);
  const remedies = data.remedies || [];
  
  console.log(`\n💊 STEP 2: Ingesting Remedies`);
  console.log(`   Source file: ${remediesPath}`);
  console.log(`   Total remedies in source: ${remedies.length}\n`);
  
  let ingested = 0;
  let skipped = 0;
  const byCategory = {};
  
  // STRICT: Insert EVERY remedy, NO checking, NO merging
  for (let i = 0; i < remedies.length; i++) {
    const remedy = remedies[i];
    
    try {
      // Translate remedy text to English using AI understanding
      const rawRemedyText = remedy.remedy_text || remedy.condition_text || '';
      let englishRemedyText;
      
      try {
        englishRemedyText = rewriteToPredictionEnglish(rawRemedyText, { category: remedy.remedy_category });
      } catch (err) {
        throw new Error(`Remedy ${i} translation failed: ${err.message}`);
      }
      
      if (!englishRemedyText || hasHindiText(englishRemedyText)) {
        throw new Error(`Remedy ${i} contains Hindi text that could not be translated: ${rawRemedyText.substring(0, 100)}`);
      }
      
      const remedyName = englishRemedyText.substring(0, 200) || `Remedy ${i} from ${bookId}`;
      // Pass remedy text to mapRemedyType for proper type detection (meditation, symbolic→puja check)
      const remedyType = mapRemedyType(remedy.remedy_category, englishRemedyText);
      const remedyDescription = englishRemedyText;
      const targetPlanets = convertPlanetNamesToIds(remedy.planet || []);
      // Extract themes from description
      const targetThemes = extractThemesFromDescription(remedyDescription);
      
      // ALWAYS INSERT - NO CHECKING FOR EXISTING
      await client.query(`
        INSERT INTO remedies (
          name, type, description, target_planets, target_themes,
          min_duration_days, recommended_frequency, safety_notes, is_active
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        remedyName,
        remedyType,
        remedyDescription,
        targetPlanets,
        targetThemes, // Extract themes from description
        null,
        null,
        `Universal knowledge extraction from ${bookId}. Index: ${i}. Confidence: ${remedy.confidence_level || 'MEDIUM'}. Category: ${remedy.remedy_category || 'unknown'}. Source: ${remedy.source?.chunk_id || 'unknown'}`,
        true
      ]);
      
      ingested++;
      byCategory[remedy.remedy_category || 'unknown'] = (byCategory[remedy.remedy_category || 'unknown'] || 0) + 1;
    } catch (err) {
      console.error(`   ❌ Error ingesting remedy ${i}:`, err.message);
      skipped++;
    }
  }
  
  return { ingested, skipped, byCategory };
}

/**
 * Main function
 */
async function main() {
  const bookId = mustGetBookId(process.argv);
  
  console.log(`\n🚀 STRICT FINAL INGESTION: ${bookId}`);
  console.log(`   Philosophy: ONE source object = ONE DB row`);
  console.log(`   NO deduplication, NO merging, NO checking\n`);
  
  const paths = getPathsForBook(bookId);
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    
    // STEP 1: Ingest Rules
    const rulesResult = await ingestRulesStrict(bookId, paths, client);
    
    console.log(`\n✅ Rules Ingestion Complete:`);
    console.log(`   - Ingested: ${rulesResult.ingested}`);
    console.log(`   - Skipped: ${rulesResult.skipped}`);
    console.log(`\n📊 Rules by nature:`);
    for (const [nature, count] of Object.entries(rulesResult.byNature)) {
      if (count > 0) {
        console.log(`   ${nature}: ${count}`);
      }
    }
    console.log(`\n📊 Rules by execution status:`);
    for (const [status, count] of Object.entries(rulesResult.byStatus)) {
      if (count > 0) {
        console.log(`   ${status}: ${count}`);
      }
    }
    
    // STEP 2: Ingest Remedies
    const remediesResult = await ingestRemediesStrict(bookId, paths, client);
    
    console.log(`\n✅ Remedies Ingestion Complete:`);
    console.log(`   - Ingested: ${remediesResult.ingested}`);
    console.log(`   - Skipped: ${remediesResult.skipped}`);
    console.log(`\n📊 Remedies by category:`);
    for (const [category, count] of Object.entries(remediesResult.byCategory)) {
      if (count > 0) {
        console.log(`   ${category}: ${count}`);
      }
    }
    
    await client.query('COMMIT');
    
    // FINAL VALIDATION
    console.log(`\n🔍 FINAL VALIDATION:\n`);
    
    // Get expected counts from source files
    const rulesData = await readJson(path.join(paths.processedDir, 'rules.universal.v1.json'));
    const remediesData = await readJson(path.join(paths.processedDir, 'remedies.universal.v1.json'));
    const expectedRules = rulesData.rules?.length || 0;
    const expectedRemedies = remediesData.remedies?.length || 0;
    
    const rulesCount = await client.query(`
      SELECT COUNT(*) as total FROM rules WHERE source_book = $1
    `, [bookId]);
    
    const remediesCount = await client.query(`
      SELECT COUNT(*) as total FROM remedies WHERE is_active = TRUE AND safety_notes LIKE $1
    `, [`%${bookId}%`]);
    
    const rulesTotal = parseInt(rulesCount.rows[0].total);
    const remediesTotal = parseInt(remediesCount.rows[0].total);
    
    console.log(`   Expected rules: ${expectedRules}`);
    console.log(`   Actual rules: ${rulesTotal}`);
    console.log(`   ✅ Match: ${rulesTotal === expectedRules ? 'YES' : 'NO'}`);
    
    console.log(`\n   Expected remedies: ${expectedRemedies}`);
    console.log(`   Actual remedies: ${remediesTotal}`);
    console.log(`   ✅ Match: ${remediesTotal === expectedRemedies ? 'YES' : 'NO'}`);
    
    // Validate English-only content
    const hindiRulesCheck = await client.query(`
      SELECT COUNT(*) as count FROM rules 
      WHERE source_book = $1 
        AND (canonical_meaning ~ '[\\u0900-\\u097F]' OR description ~ '[\\u0900-\\u097F]')
    `, [bookId]);
    
    const hindiRemediesCheck = await client.query(`
      SELECT COUNT(*) as count FROM remedies 
      WHERE is_active = TRUE 
        AND safety_notes LIKE $1
        AND (description ~ '[\\u0900-\\u097F]' OR name ~ '[\\u0900-\\u097F]')
    `, [`%${bookId}%`]);
    
    const hindiRules = parseInt(hindiRulesCheck.rows[0].count);
    const hindiRemedies = parseInt(hindiRemediesCheck.rows[0].count);
    
    console.log(`\n   Hindi text in rules: ${hindiRules}`);
    console.log(`   Hindi text in remedies: ${hindiRemedies}`);
    console.log(`   ✅ English-only: ${hindiRules === 0 && hindiRemedies === 0 ? 'YES' : 'NO'}`);
    
    if (rulesTotal === expectedRules && remediesTotal === expectedRemedies && hindiRules === 0 && hindiRemedies === 0) {
      console.log(`\n✅✅✅ INGESTION SUCCESSFUL ✅✅✅`);
      console.log(`   - All counts match`);
      console.log(`   - 100% prediction-grade English`);
      console.log(`   - No Hindi text in database\n`);
      
      // Show samples
      const sampleRules = await client.query(`
        SELECT rule_id, canonical_meaning, source_book 
        FROM rules 
        WHERE source_book = $1 
        LIMIT 2
      `, [bookId]);
      
      const sampleRemedies = await client.query(`
        SELECT name, description 
        FROM remedies 
        WHERE is_active = TRUE AND safety_notes LIKE $1
        LIMIT 2
      `, [`%${bookId}%`]);
      
      console.log(`📝 SAMPLE RULES (English):`);
      sampleRules.rows.forEach((r, i) => {
        console.log(`\n   [${i + 1}] ${r.source_book} - ${r.rule_id}:`);
        console.log(`      ${r.canonical_meaning?.substring(0, 150)}...`);
      });
      
      console.log(`\n💊 SAMPLE REMEDIES (English):`);
      sampleRemedies.rows.forEach((r, i) => {
        console.log(`\n   [${i + 1}] ${r.name}:`);
        console.log(`      ${r.description?.substring(0, 150)}...`);
      });
      
      console.log(`\n`);
    } else {
      console.log(`\n⚠️  INGESTION INCOMPLETE - Validation failed!\n`);
      if (hindiRules > 0 || hindiRemedies > 0) {
        console.log(`   ❌ Hindi text found in database - ingestion invalid!\n`);
      }
    }
    
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

