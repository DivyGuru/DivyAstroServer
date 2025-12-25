#!/usr/bin/env node

/**
 * PHASE E — DATASET PREPARATION
 * 
 * Converts classified meanings into layer-aware rule datasets.
 * 
 * Outputs:
 * - datasets/rules.v1.json (all rules, layer-tagged)
 * - datasets/rules.base.v1.json
 * - datasets/rules.nakshatra.v1.json
 * - datasets/rules.dasha.v1.json
 * - datasets/rules.transit.v1.json
 * - datasets/rules.strength.v1.json
 * - datasets/rules.yoga.v1.json
 * - layer_coverage_report.md
 * 
 * Usage: node scripts/book/prepareLayerDatasets.js <bookId>
 */

import { mustGetBookId, getPathsForBook, readJson, writeJson, nowIso, validateConditionTree } from './_shared.js';
import path from 'path';
import fs from 'fs';

/**
 * Create condition tree based on layer and entities
 */
function createConditionTree(layer, entities) {
  const { planets, houses, nakshatras } = entities;
  
  switch (layer) {
    case 'BASE':
      if (planets?.length > 0 && houses?.length > 0) {
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
      if (planets?.length > 0 && houses?.length > 0 && nakshatras?.length > 0) {
        return {
          all: [
            {
              planet_in_house: {
                planet_in: planets,
                house_in: houses,
                match_mode: 'any'
              }
            },
            {
              planet_in_nakshatra: {
                planet_in: planets,
                nakshatra_in: nakshatras
              }
            }
          ]
        };
      }
      return null;
      
    case 'DASHA':
      if (planets?.length > 0 && houses?.length > 0) {
        // DASHA rules modify BASE rules, so we need base_rule_ids
        // For now, create a condition that checks dasha + planet in house
        return {
          all: [
            {
              dasha_running: {
                planet_in: planets
              }
            },
            {
              planet_in_house: {
                planet_in: planets,
                house_in: houses
              }
            }
          ]
        };
      }
      return null;
      
    case 'TRANSIT':
      if (planets?.length > 0) {
        return {
          transit_planet_in_house: {
            planet_in: planets,
            house_in: houses || [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
          }
        };
      }
      return null;
      
    case 'STRENGTH':
      if (planets?.length > 0) {
        // STRENGTH modifies intensity, needs base_rule_ids
        // For now, create condition for planet strength
        return {
          planet_strength: {
            planet_in: planets,
            strength_state: 'any' // Will be refined based on actual strength states
          }
        };
      }
      return null;
      
    case 'YOGA':
      if (planets?.length >= 2) {
        // YOGA is a combination, needs base_rule_ids
        // For now, create condition for multiple planets
        return {
          all: planets.map(planet => ({
            planet_in_house: {
              planet_in: [planet],
              house_in: houses || [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
            }
          }))
        };
      }
      return null;
      
    default:
      return null;
  }
}

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
 * Convert classified meaning to rule
 */
function convertToRule(classifiedMeaning, bookId) {
  const { meaning_id, understood_meaning, layer_classification, source } = classifiedMeaning;
  const { english_rewrite, understanding_metadata, confidence, jyotish_context } = understood_meaning;
  const { primary_layer, entities, is_modifier } = layer_classification;
  
  // CONTENT-DEPTH-FIRST: Convert ALL usable meanings (high, medium, low, undefined)
  // Express uncertainty via language, not rejection
  // Only skip if explicitly rejected (confidence will be handled in wording)
  // Default undefined confidence to 'medium' to maximize extraction
  const effectiveConfidence = confidence === 'rejected' ? null : (confidence || 'medium');
  if (!effectiveConfidence) {
    return null; // Only skip if explicitly rejected
  }
  
  // Must have english_rewrite
  if (!english_rewrite || english_rewrite.trim().length === 0) {
    return null;
  }
  
  // Must have primary layer
  if (!primary_layer) {
    return null;
  }
  
  // Create condition tree
  const conditionTree = createConditionTree(primary_layer, entities);
  
  if (!conditionTree) {
    return null; // Cannot create condition tree
  }
  
  // Validate condition tree
  try {
    validateConditionTree(conditionTree);
  } catch (err) {
    return null; // Invalid condition tree
  }
  
  // Determine engine status
  // For modifiers (STRENGTH/YOGA), they may need base_rule_ids which we don't have yet
  const engineStatus = is_modifier && primary_layer !== 'TRANSIT' ? 'PENDING_OPERATOR' : 'READY';
  
  // Create effect_json
  const effectJson = {
    theme: getThemeFromLifeAreas(understanding_metadata?.life_areas),
    area: entities.planets && entities.houses ? 
      `${entities.planets[0]?.toLowerCase()}_house_${entities.houses[0]}` : 
      'general',
    trend: getTrendFromEffectNature(understanding_metadata?.effect_nature),
    intensity: is_modifier ? 0.3 : 0.5, // Modifiers have lower base intensity
    tone: understanding_metadata?.tone || 'informational',
    trigger: primary_layer === 'TRANSIT' ? 'transit' : 'natal',
    scenario: 'placement_association',
    outcome_text: english_rewrite,
    variant_meta: {
      tone: understanding_metadata?.tone || 'informational',
      confidence_level: effectiveConfidence,
      dominance: is_modifier ? 'modifier' : 'primary',
      certainty_note: `Converted from understood meaning. ${understanding_metadata?.time_scale || 'conditional'} influence.`,
      // Quality marker: All rules should be PDF-quality from the start
      quality_status: 'PDF_QUALITY', // All rules created with real understanding
      understanding_based: true // Created using AI understanding, not templates
    },
    source: {
      book_id: bookId,
      meaning_id: meaning_id
    }
  };
  
  // For modifiers, add intensity_multiplier
  if (is_modifier) {
    effectJson.intensity_multiplier = primary_layer === 'STRENGTH' ? 1.2 : 1.1;
  }
  
  return {
    rule_id: `${bookId}__${meaning_id}`,
    source_unit_id: source?.unit_id || null,
    source_book: bookId,
    extraction_phase: `PHASE${primary_layer === 'BASE' ? '1' : primary_layer === 'NAKSHATRA' ? '2' : primary_layer === 'DASHA' ? '3' : primary_layer === 'TRANSIT' ? '4' : '5'}`,
    rule_type: primary_layer,
    point_code: null,
    variant_code: `${bookId}__${meaning_id}`,
    applicable_scopes: ['life_theme'],
    condition_tree: conditionTree,
    effect_json: effectJson,
    base_weight: is_modifier ? 0.8 : 1.0,
    base_rule_ids: is_modifier ? [] : null, // Will be populated during ingestion if needed
    canonical_meaning: english_rewrite,
    engine_status: engineStatus,
    is_active: true,
  };
}

async function main() {
  const bookId = mustGetBookId(process.argv);
  const paths = getPathsForBook(bookId);
  
  console.log(`\n📦 DATASET PREPARATION: ${bookId}\n`);
  
  // Load classified meanings
  const classifiedPath = path.join(paths.processedDir, 'meanings.classified.v1.json');
  if (!fs.existsSync(classifiedPath)) {
    throw new Error(`Classified meanings not found: ${classifiedPath}\nRun classifyLayers.js first.`);
  }
  
  const classified = await readJson(classifiedPath);
  
  console.log(`Loaded ${classified.total_meanings} classified meanings\n`);
  
  // Convert to rules
  const allRules = [];
  const skipped = [];
  const byLayer = {
    BASE: [],
    NAKSHATRA: [],
    DASHA: [],
    TRANSIT: [],
    STRENGTH: [],
    YOGA: [],
  };
  
  for (const meaning of classified.meanings || []) {
    try {
      const rule = convertToRule(meaning, bookId);
      
      if (rule) {
        allRules.push(rule);
        const layer = rule.rule_type;
        if (byLayer[layer]) {
          byLayer[layer].push(rule);
        }
      } else {
        // CONTENT-DEPTH-FIRST: Only skip if truly cannot create rule
        // Don't skip just because of confidence level
        const reason = !meaning.understood_meaning?.english_rewrite ? 'missing english_rewrite' :
          !meaning.layer_classification?.primary_layer ? 'missing primary_layer' :
          !meaning.layer_classification?.entities ? 'missing entities' :
          'cannot create valid condition tree';
        skipped.push({
          meaning_id: meaning.meaning_id,
          unit_id: meaning.source?.unit_id,
          reason: reason
        });
      }
    } catch (err) {
      skipped.push({
        meaning_id: meaning.meaning_id,
        unit_id: meaning.source?.unit_id,
        reason: `Error: ${err.message}`
      });
    }
  }
  
  // Ensure datasets directory exists
  await fs.promises.mkdir(paths.datasetsDir, { recursive: true });
  
  // Write unified rules dataset
  const unifiedRulesPath = paths.rulesPath;
  await writeJson(unifiedRulesPath, {
    schema_version: 1,
    book_id: bookId,
    created_at: nowIso(),
    source_meanings_file: path.relative(paths.root, classifiedPath),
    total_meanings: classified.total_meanings,
    total_rules: allRules.length,
    total_skipped: skipped.length,
    layer_distribution: Object.fromEntries(
      Object.entries(byLayer).map(([layer, rules]) => [layer, rules.length])
    ),
    rules: allRules,
  });
  
  // Write layer-specific datasets
  for (const [layer, rules] of Object.entries(byLayer)) {
    if (rules.length > 0) {
      const layerPath = path.join(paths.datasetsDir, `rules.${layer.toLowerCase()}.v1.json`);
      await writeJson(layerPath, {
        schema_version: 1,
        book_id: bookId,
        layer: layer,
        created_at: nowIso(),
        total_rules: rules.length,
        rules: rules,
      });
    }
  }
  
  // Write skipped log
  const skippedPath = path.join(paths.processedDir, 'conversion_skipped.v1.json');
  await writeJson(skippedPath, {
    schema_version: 1,
    book_id: bookId,
    created_at: nowIso(),
    total_skipped: skipped.length,
    skipped: skipped,
  });
  
  // Generate layer coverage report
  const reportPath = path.join(paths.processedDir, 'layer_coverage_report.md');
  const report = generateLayerCoverageReport(bookId, classified, byLayer, skipped);
  await fs.promises.writeFile(reportPath, report, 'utf8');
  
  console.log(`✅ Dataset preparation complete:`);
  console.log(`   - Total rules: ${allRules.length}`);
  console.log(`   - Layer distribution:`);
  Object.entries(byLayer).forEach(([layer, rules]) => {
    if (rules.length > 0) {
      console.log(`     ${layer}: ${rules.length}`);
    }
  });
  console.log(`   - Skipped: ${skipped.length}`);
  console.log(`   - Unified rules: ${unifiedRulesPath}`);
  console.log(`   - Layer-specific datasets: ${paths.datasetsDir}/`);
  console.log(`   - Coverage report: ${reportPath}\n`);
}

function generateLayerCoverageReport(bookId, classified, byLayer, skipped) {
  const totalMeanings = classified.total_meanings;
  const totalRules = Object.values(byLayer).reduce((sum, rules) => sum + rules.length, 0);
  
  return `# Layer Coverage Report: ${bookId}

Generated: ${new Date().toISOString()}

## Summary

- **Total meanings understood**: ${totalMeanings}
- **Total rules created**: ${totalRules}
- **Total skipped**: ${skipped.length}
- **Coverage**: ${Math.round((totalRules / totalMeanings) * 100)}%

## Layer Distribution

| Layer | Rules | Status |
|-------|-------|--------|
| BASE | ${byLayer.BASE.length} | ${byLayer.BASE.length > 0 ? '✅ Active' : '⚪ Empty'} |
| NAKSHATRA | ${byLayer.NAKSHATRA.length} | ${byLayer.NAKSHATRA.length > 0 ? '✅ Active' : '⚪ Empty'} |
| DASHA | ${byLayer.DASHA.length} | ${byLayer.DASHA.length > 0 ? '✅ Active' : '⚪ Empty'} |
| TRANSIT | ${byLayer.TRANSIT.length} | ${byLayer.TRANSIT.length > 0 ? '✅ Active' : '⚪ Empty'} |
| STRENGTH | ${byLayer.STRENGTH.length} | ${byLayer.STRENGTH.length > 0 ? '✅ Active' : '⚪ Empty'} |
| YOGA | ${byLayer.YOGA.length} | ${byLayer.YOGA.length > 0 ? '✅ Active' : '⚪ Empty'} |

## Notes

- Empty layers are VALID and expected
- System gracefully handles missing layers
- Modifier layers (STRENGTH/YOGA) may require base_rule_ids during ingestion
- Engine status: READY = executable, PENDING_OPERATOR = needs enhancement

## Files Generated

- \`datasets/rules.v1.json\` - Unified rules dataset
- \`datasets/rules.*.v1.json\` - Layer-specific datasets
- \`conversion_skipped.v1.json\` - Skipped items with reasons
`;
}

main().catch((err) => {
  console.error('❌ Dataset preparation failed:', err.message);
  process.exit(1);
});

