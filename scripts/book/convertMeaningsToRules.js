#!/usr/bin/env node

/**
 * PART B: Convert Meanings to Rules
 * 
 * Converts understood meanings into engine-safe rules.
 * 
 * STRICT RULES:
 * - Do NOT modify english_rewrite
 * - Do NOT invent meanings
 * - Convert ONLY meanings with confidence=high
 * - Respect layer classification strictly
 * - Validate engine expressibility
 * - Mark PENDING_OPERATOR where needed
 * - Skip anything unclear
 * 
 * Usage: node scripts/book/convertMeaningsToRules.js <bookId>
 */

import { mustGetBookId, getPathsForBook, readJson, writeJson, nowIso, validateConditionTree } from './_shared.js';
import path from 'path';

// Supported operators for engine expressibility
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
 * Determine theme from life areas
 */
function getThemeFromLifeAreas(lifeAreas) {
  const themeMap = {
    'career': 'career',
    'reputation': 'career',
    'finances': 'money',
    'resources': 'money',
    'gains': 'money',
    'relationships': 'relationships',
    'marriage': 'relationships',
    'family': 'family',
    'home': 'family',
    'health': 'health',
    'education': 'general',
    'spirituality': 'general',
    'self_identity': 'general',
    'personality': 'general'
  };
  
  for (const area of lifeAreas || []) {
    if (themeMap[area]) {
      return themeMap[area];
    }
  }
  
  return 'general';
}

/**
 * Determine trend from effect nature
 */
function getTrendFromEffectNature(effectNature) {
  if (effectNature === 'supportive') return 'up';
  if (effectNature === 'challenging') return 'down';
  return 'mixed';
}

/**
 * Create condition tree based on layer
 */
function createConditionTree(layer, entities) {
  const { planets, houses, nakshatras, strength_states, yoga_names, dasha_info, transit_info } = entities;
  
  switch (layer) {
    case 'BASE':
      if (planets && planets.length > 0 && houses && houses.length > 0) {
        return {
          planet_in_house: {
            planet_in: planets,
            house_in: houses,
            match_mode: 'any',
            min_planets: 1
          }
        };
      }
      return null;
      
    case 'NAKSHATRA':
      if (planets && planets.length > 0 && houses && houses.length > 0 && nakshatras && nakshatras.length > 0) {
        return {
          all: [
            {
              planet_in_house: {
                planet_in: planets,
                house_in: houses,
                match_mode: 'any',
                min_planets: 1
              }
            },
            {
              planet_in_nakshatra: {
                planet_in: planets,
                nakshatra_in: nakshatras,
                match_mode: 'any',
                min_planets: 1
              }
            }
          ]
        };
      }
      return null;
      
    case 'DASHA':
      if (planets && planets.length > 0 && houses && houses.length > 0 && dasha_info) {
        return {
          all: [
            {
              planet_in_house: {
                planet_in: planets,
                house_in: houses,
                match_mode: 'any',
                min_planets: 1
              }
            },
            {
              dasha_running: {
                dasha_planet: dasha_info.dasha_planet,
                dasha_level: dasha_info.dasha_level || 'mahadasha'
              }
            }
          ]
        };
      }
      return null;
      
    case 'TRANSIT':
      if (transit_info && transit_info.transit_planet && houses && houses.length > 0) {
        return {
          transit_planet_in_house: {
            transit_planet_in: [transit_info.transit_planet],
            house_in: houses,
            match_mode: 'any',
            min_planets: 1
          }
        };
      }
      return null;
      
    case 'STRENGTH':
      if (planets && planets.length > 0 && strength_states && strength_states.length > 0) {
        // Engine may not support planet_strength yet - use generic_condition
        return {
          generic_condition: {
            note: `planet_strength operator needed for ${planets.join(', ')} in ${strength_states.join(', ')} state`
          }
        };
      }
      return null;
      
    case 'YOGA':
      if (yoga_names && yoga_names.length > 0) {
        // Engine may not support yoga_present yet - use generic_condition
        return {
          generic_condition: {
            note: `yoga_present operator needed for ${yoga_names.join(', ')}`
          }
        };
      }
      return null;
      
    default:
      return null;
  }
}

/**
 * Check if condition tree is expressible
 */
function isExpressible(conditionTree) {
  if (!conditionTree) return false;
  
  // Check for generic_condition (not expressible yet)
  if (conditionTree.generic_condition) {
    return false;
  }
  
  // Recursively check operators
  const operators = extractOperators(conditionTree);
  const operatorsArray = Array.from(operators);
  const unsupported = operatorsArray.filter(op => !SUPPORTED_OPERATORS.includes(op));
  
  return unsupported.length === 0;
}

/**
 * Extract operators from condition tree
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
    if (SUPPORTED_OPERATORS.includes(key) || key === 'generic_condition') {
      operators.add(key);
    }
  }
  
  return operators;
}

/**
 * Convert meaning to rule
 */
function convertMeaningToRule(meaning, bookId) {
  const { meaning_id, understood_meaning, classification } = meaning;
  const { english_rewrite, understanding_metadata, confidence, jyotish_context } = understood_meaning;
  const { layer, entities } = classification;
  
  // STRICT: Only convert high confidence
  if (confidence !== 'high') {
    return null;
  }
  
  // STRICT: Must have english_rewrite (do NOT modify)
  if (!english_rewrite || english_rewrite.trim().length === 0) {
    return null;
  }
  
  // STRICT: Must have layer classification
  if (!layer) {
    return null;
  }
  
  // Create condition tree based on layer
  const conditionTree = createConditionTree(layer, entities);
  
  if (!conditionTree) {
    return null; // Cannot create condition tree
  }
  
  // Check expressibility
  const expressible = isExpressible(conditionTree);
  const engineStatus = expressible ? 'READY' : 'PENDING_OPERATOR';
  
  // Create effect_json
  const effectJson = {
    theme: getThemeFromLifeAreas(understanding_metadata?.life_areas),
    area: entities.planets && entities.houses ? 
      `${entities.planets[0]?.toLowerCase()}_house_${entities.houses[0]}` : 
      'general',
    trend: getTrendFromEffectNature(understanding_metadata?.effect_nature),
    intensity: 0.5, // Default, can be refined later
    tone: understanding_metadata?.tone || 'informational',
    trigger: layer === 'TRANSIT' ? 'transit' : 'natal',
    scenario: 'placement_association',
    outcome_text: english_rewrite, // STRICT: Use as-is, do NOT modify
    variant_meta: {
      tone: understanding_metadata?.tone || 'informational',
      confidence_level: confidence,
      dominance: 'background',
      certainty_note: `Converted from understood meaning. ${understanding_metadata?.time_scale || 'conditional'} influence.`
    },
    source: {
      book_id: bookId,
      meaning_id: meaning_id
    }
  };
  
  // Validate condition tree structure
  try {
    validateConditionTree(conditionTree);
  } catch (err) {
    return null; // Invalid condition tree
  }
  
  return {
    id: `${bookId}__${meaning_id}`,
    source_unit_id: meaning.source?.unit_id || null,
    point_code: null,
    variant_code: `${bookId}__${meaning_id}`,
    applicable_scopes: ['life_theme'],
    condition_tree: conditionTree,
    effect_json: effectJson,
    base_weight: 1.0,
    is_active: true,
    rule_type: layer,
    engine_status: engineStatus
  };
}

/**
 * Main conversion function
 */
async function convertMeaningsToRules(bookId) {
  console.log(`\n🔄 PART B: Convert Meanings to Rules for ${bookId}\n`);
  
  const paths = getPathsForBook(bookId);
  
  // Load meanings
  const meaningsPath = path.join(paths.processedDir, 'meanings.v1.json');
  const meanings = await readJson(meaningsPath);
  
  console.log(`Loaded ${meanings.total_meanings} understood meanings\n`);
  
  const rules = [];
  const skipped = [];
  
  for (const meaning of meanings.meanings || []) {
    try {
      const rule = convertMeaningToRule(meaning, bookId);
      
      if (rule) {
        rules.push(rule);
      } else {
        skipped.push({
          meaning_id: meaning.meaning_id,
          reason: meaning.understood_meaning?.confidence !== 'high' ? 
            'confidence not high' : 
            'cannot create valid rule'
        });
      }
    } catch (err) {
      skipped.push({
        meaning_id: meaning.meaning_id,
        reason: `Error: ${err.message}`
      });
    }
  }
  
  // Write rules dataset
  const rulesData = {
    schema_version: 1,
    book_id: bookId,
    created_at: nowIso(),
    source_meanings_file: path.relative(paths.root, meaningsPath),
    total_meanings: meanings.total_meanings,
    total_rules: rules.length,
    total_skipped: skipped.length,
    rules: rules
  };
  
  await writeJson(paths.rulesPath, rulesData);
  
  // Write skipped log
  const skippedPath = path.join(paths.processedDir, 'conversion_skipped.v1.json');
  await writeJson(skippedPath, {
    schema_version: 1,
    book_id: bookId,
    created_at: nowIso(),
    skipped: skipped
  });
  
  console.log(`✅ Conversion complete:`);
  console.log(`   - Rules created: ${rules.length}`);
  console.log(`   - Skipped: ${skipped.length}`);
  console.log(`   - Output: ${paths.rulesPath}\n`);
  
  // Summary by layer
  const byLayer = {};
  for (const rule of rules) {
    const layer = rule.rule_type || 'UNKNOWN';
    byLayer[layer] = (byLayer[layer] || 0) + 1;
  }
  
  console.log('📊 Rules by layer:');
  for (const [layer, count] of Object.entries(byLayer)) {
    console.log(`   - ${layer}: ${count}`);
  }
  
  // Engine status summary
  const byStatus = {};
  for (const rule of rules) {
    const status = rule.engine_status || 'UNKNOWN';
    byStatus[status] = (byStatus[status] || 0) + 1;
  }
  
  console.log('\n📊 Rules by engine status:');
  for (const [status, count] of Object.entries(byStatus)) {
    console.log(`   - ${status}: ${count}`);
  }
  
  return {
    rules: rules.length,
    skipped: skipped.length
  };
}

const bookId = mustGetBookId(process.argv);
convertMeaningsToRules(bookId).catch(err => {
  console.error('❌ Conversion failed:', err.message);
  process.exit(1);
});

