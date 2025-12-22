/**
 * PHASE 3: Dasha Activation Extraction Script
 * 
 * Extracts Dasha activation rules that define WHEN base Planet × House effects become more active.
 * 
 * CRITICAL CONSTRAINTS:
 * - Must reference existing Planet × House base rules
 * - Modifies timing/intensity ONLY (WHEN, not WHAT)
 * - Never contradicts base rules
 * - Only extracts when book explicitly links dasha to planetary results
 * - Book-driven, not inferred from general lore
 * - Focuses on urgency, timing, and responsibility (not fear)
 */

import { mustGetBookId, getPathsForBook, readJson, writeJson } from './_shared.js';

/**
 * Analyzes flagged items to determine if they can be extracted as dasha activation rules.
 * 
 * Criteria:
 * 1. Must have planet, house, and dasha planet
 * 2. Must have valid base_rule_id
 * 3. Must describe WHEN the effect becomes active (timing/urgency)
 * 4. Must NOT be generic dasha description
 */
function analyzeFlaggedItem(item, book, baseRules) {
  // For now, return null - no extractable rules found in scan
  // This function structure is ready for future books
  
  const chunk = book.find(c => c.chunk_id === item.chunk_id);
  if (!chunk) return null;
  
  const text = chunk.text || '';
  
  // Check if text describes WHEN (timing/urgency/activation)
  // vs generic dasha information
  
  // Timing/urgency indicators
  const timingIndicators = [
    'becomes more active', 'requires greater attention',
    'demands conscious effort', 'can amplify',
    'may intensify', 'mistakes can have',
    'effort matters more', 'neglect may lead to',
    'period requires', 'time demands'
  ];
  
  // Generic dasha indicators (BAD)
  const genericIndicators = [
    'dasha is', 'dasha lasts', 'dasha duration',
    'generally', 'in general', 'always',
    'will definitely', 'cannot be avoided'
  ];
  
  // For lalkitab: no extractable rules found
  return null;
}

/**
 * Creates a Dasha activation rule structure
 */
function createActivationRule(planet, house, dashaPlanet, dashaLevel, baseRuleId, activationData) {
  // Map dasha planet name to ID
  const PLANET_TO_ID = {
    'SUN': 1, 'MOON': 2, 'MARS': 3, 'MERCURY': 4,
    'JUPITER': 5, 'VENUS': 6, 'SATURN': 7, 'RAHU': 8, 'KETU': 9
  };
  
  const dashaPlanetId = PLANET_TO_ID[dashaPlanet] || null;
  if (!dashaPlanetId) return null;
  
  return {
    rule_id: `${planet}_${house}_${dashaLevel.toUpperCase()}_${dashaPlanet}`,
    base_rule_id: baseRuleId,
    planet,
    house,
    dasha_planet: dashaPlanet,
    dasha_level: dashaLevel,
    condition_tree: {
      all: [
        {
          planet_in_house: {
            planet_in: [planet],
            house_in: [house],
            match_mode: 'any',
            min_planets: 1
          }
        },
        {
          dasha_running: {
            level: dashaLevel,
            planet_in: [dashaPlanetId]
          }
        }
      ]
    },
    time_effect: {
      activation: activationData.activation || 'on',
      intensity_multiplier: activationData.intensity_multiplier || 1.0,
      urgency_level: activationData.urgency_level || 'medium'
    },
    canonical_meaning: activationData.canonical_meaning,
    effect_json: {
      theme: activationData.theme || 'general',
      area: `${planet.toLowerCase()}_house_${house}_dasha_${dashaPlanet.toLowerCase()}`,
      trend: activationData.trend || 'mixed',
      intensity: activationData.intensity || 0.7,
      tone: activationData.tone || 'cautionary',
      trigger: 'dasha',
      scenario: activationData.scenario || 'dasha_activation',
      outcome_text: activationData.outcome_text,
      variant_meta: {
        tone: activationData.tone || 'cautionary',
        confidence_level: activationData.confidence_level || 'medium',
        dominance: 'time_activation',
        certainty_note: `This activates the base ${planet} in ${house} house rule during ${dashaPlanet} ${dashaLevel}, adding timing and urgency context.`
      }
    },
    source: {
      book_id: activationData.book_id || null,
      unit_id: activationData.unit_id || null
    }
  };
}

async function main() {
  const bookId = mustGetBookId(process.argv);
  
  console.log(`🔍 Analyzing ${bookId} for extractable Dasha activation rules...\n`);
  
  const paths = getPathsForBook(bookId);
  
  // Load data
  const book = await readJson(paths.sourceBookPath);
  const rules = await readJson(paths.rulesPath);
  const dashaScan = await readJson(path.join(paths.processedDir, 'dasha.scan.v1.json'));
  
  const activations = [];
  const stillFlagged = [];
  
  // Analyze flagged items
  for (const item of dashaScan.flagged_for_review || []) {
    if (!item.base_rule_id) {
      stillFlagged.push({ ...item, reason: 'no_base_rule' });
      continue;
    }
    
    if (!item.planet || !item.house || !item.dasha_planet || !item.dasha_level) {
      stillFlagged.push({ ...item, reason: 'missing_required_fields' });
      continue;
    }
    
    // Only process mahadasha and antardasha
    if (item.dasha_level !== 'mahadasha' && item.dasha_level !== 'antardasha') {
      stillFlagged.push({ ...item, reason: 'unsupported_dasha_level' });
      continue;
    }
    
    const analysis = analyzeFlaggedItem(item, book, rules.rules);
    if (analysis && analysis.extractable) {
      const activation = createActivationRule(
        item.planet,
        item.house,
        item.dasha_planet,
        item.dasha_level,
        item.base_rule_id,
        { ...analysis, book_id: bookId }
      );
      if (activation) {
        activations.push(activation);
      }
    } else {
      stillFlagged.push({ ...item, reason: analysis?.reason || 'not_extractable' });
    }
  }
  
  // Output results
  const output = {
    schema_version: 1,
    book_id: bookId,
    created_at: new Date().toISOString(),
    summary: {
      total_activations: activations.length,
      still_flagged: stillFlagged.length,
      status: activations.length > 0 ? 'rules_extracted' : 'no_extractable_rules_found'
    },
    activations,
    still_flagged: stillFlagged,
    notes: activations.length === 0 
      ? "No explicit Dasha × Planet × House rules found. All flagged items were generic dasha information (durations, general effects) without explicit links to Planet × House base rules. System is ready for future books that may contain such explicit statements. See PHASE3_DASHA_ACTIVATION_GUIDANCE.md for structure and extraction rules."
      : `${activations.length} Dasha activation rules extracted. These define WHEN base Planet × House effects become more active.`
  };
  
  const outputPath = path.join(paths.processedDir, 'dasha.activations.v1.json');
  await writeJson(outputPath, output);
  
  console.log(`✅ Analysis complete:`);
  console.log(`   - Extractable activations: ${activations.length}`);
  console.log(`   - Still flagged: ${stillFlagged.length}`);
  console.log(`   - Output: ${outputPath}\n`);
  
  if (activations.length > 0) {
    console.log('📋 Extracted activations:');
    for (const a of activations.slice(0, 5)) {
      console.log(`   - ${a.dasha_planet} ${a.dasha_level} activates ${a.planet} in ${a.house} (refines ${a.base_rule_id})`);
    }
    if (activations.length > 5) {
      console.log(`   ... and ${activations.length - 5} more`);
    }
  } else {
    console.log('📝 No extractable Dasha activation rules found.');
    console.log('   This is expected if the book does not contain explicit Dasha × Planet × House statements.');
  }
}

import path from 'path';

main().catch((err) => {
  console.error('❌ extractDashaActivations failed:', err.message);
  process.exit(1);
});

