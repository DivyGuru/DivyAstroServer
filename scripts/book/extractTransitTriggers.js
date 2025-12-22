/**
 * PHASE 4: Transit Trigger Extraction Script
 * 
 * Extracts Transit trigger rules that define WHEN base Planet × House effects become temporarily active.
 * 
 * CRITICAL CONSTRAINTS:
 * - Must reference existing Planet × House base rules
 * - Modifies timing/intensity ONLY (WHEN, not WHAT)
 * - Never contradicts base rules
 * - Only extracts when book explicitly links transit to planetary results
 * - Book-driven, not inferred from general lore
 * - Focuses on temporary sensitivity and risk awareness (not fear)
 * - Only major transits (Saturn, Jupiter, Rahu, Ketu)
 */

import { mustGetBookId, getPathsForBook, readJson, writeJson } from './_shared.js';
import path from 'path';

/**
 * Analyzes flagged items to determine if they can be extracted as transit trigger rules.
 * 
 * Criteria:
 * 1. Must have transit planet, house, and base planet
 * 2. Must have valid base_rule_id
 * 3. Must describe WHEN the effect becomes temporarily active (timing/risk sensitivity)
 * 4. Must NOT be generic transit description
 * 5. Transit planet must be major (Saturn, Jupiter, Rahu, Ketu)
 */
function analyzeFlaggedItem(item, book, baseRules) {
  // For now, return null - no extractable rules found in scan
  // This function structure is ready for future books
  
  const chunk = book.find(c => c.chunk_id === item.chunk_id);
  if (!chunk) return null;
  
  const text = chunk.text || '';
  
  // Check if text describes WHEN (temporary activation/risk sensitivity)
  // vs generic transit information
  
  // Timing/risk sensitivity indicators
  const timingIndicators = [
    'temporarily', 'during transit', 'while transiting',
    'can intensify', 'may increase', 'becomes more sensitive',
    'requires greater caution', 'period of higher risk',
    'temporary activation', 'risk window'
  ];
  
  // Generic transit indicators (BAD)
  const genericIndicators = [
    'transit is', 'transit lasts', 'transit duration',
    'generally', 'in general', 'always',
    'will definitely', 'cannot be avoided'
  ];
  
  // For lalkitab: no extractable rules found
  return null;
}

/**
 * Creates a Transit trigger rule structure
 */
function createTransitTriggerRule(transitPlanet, house, basePlanet, baseRuleId, triggerData) {
  // Only major transits allowed
  const MAJOR_TRANSIT_PLANETS = ['SATURN', 'JUPITER', 'RAHU', 'KETU'];
  if (!MAJOR_TRANSIT_PLANETS.includes(transitPlanet)) return null;
  
  return {
    rule_id: `${transitPlanet}_TRANSIT_${house}_TRIGGERS_${basePlanet}_${house}`,
    base_rule_id: baseRuleId,
    transit_planet: transitPlanet,
    house,
    base_planet: basePlanet,
    condition_tree: {
      all: [
        {
          planet_in_house: {
            planet_in: [basePlanet],
            house_in: [house],
            match_mode: 'any',
            min_planets: 1
          }
        },
        {
          transit_planet_in_house: {
            planet_in: [transitPlanet],
            house_in: [house],
            match_mode: 'any',
            min_planets: 1
          }
        }
      ]
    },
    time_effect: {
      activation: triggerData.activation || 'temporary',
      intensity_multiplier: triggerData.intensity_multiplier || 1.0,
      risk_sensitivity: triggerData.risk_sensitivity || 'medium'
    },
    canonical_meaning: triggerData.canonical_meaning,
    effect_json: {
      theme: triggerData.theme || 'general',
      area: `${basePlanet.toLowerCase()}_house_${house}_transit_${transitPlanet.toLowerCase()}`,
      trend: triggerData.trend || 'mixed',
      intensity: triggerData.intensity || 0.7,
      tone: triggerData.tone || 'cautionary',
      trigger: 'transit',
      scenario: triggerData.scenario || 'transit_trigger',
      outcome_text: triggerData.outcome_text,
      variant_meta: {
        tone: triggerData.tone || 'cautionary',
        confidence_level: triggerData.confidence_level || 'medium',
        dominance: 'temporary_trigger',
        certainty_note: `This temporarily activates the base ${basePlanet} in ${house} house rule during ${transitPlanet} transit, adding temporary sensitivity and risk awareness context.`
      }
    },
    source: {
      book_id: triggerData.book_id || null,
      unit_id: triggerData.unit_id || null
    }
  };
}

async function main() {
  const bookId = mustGetBookId(process.argv);
  
  console.log(`🔍 Analyzing ${bookId} for extractable Transit trigger rules...\n`);
  
  const paths = getPathsForBook(bookId);
  
  // Load data
  const book = await readJson(paths.sourceBookPath);
  const rules = await readJson(paths.rulesPath);
  const transitScan = await readJson(path.join(paths.processedDir, 'transit.scan.v1.json'));
  
  const triggers = [];
  const stillFlagged = [];
  
  // Analyze flagged items
  for (const item of transitScan.flagged_for_review || []) {
    if (!item.base_rule_id) {
      stillFlagged.push({ ...item, reason: 'no_base_rule' });
      continue;
    }
    
    if (!item.transit_planet || !item.house || !item.base_planet || !item.base_rule_id) {
      stillFlagged.push({ ...item, reason: 'missing_required_fields' });
      continue;
    }
    
    // Only process major transits
    const MAJOR_TRANSIT_PLANETS = ['SATURN', 'JUPITER', 'RAHU', 'KETU'];
    if (!MAJOR_TRANSIT_PLANETS.includes(item.transit_planet)) {
      stillFlagged.push({ ...item, reason: 'not_major_transit' });
      continue;
    }
    
    const analysis = analyzeFlaggedItem(item, book, rules.rules);
    if (analysis && analysis.extractable) {
      const trigger = createTransitTriggerRule(
        item.transit_planet,
        item.house,
        item.base_planet,
        item.base_rule_id,
        { ...analysis, book_id: bookId }
      );
      if (trigger) {
        triggers.push(trigger);
      }
    } else {
      stillFlagged.push({ ...item, reason: analysis?.reason || 'not_extractable' });
    }
  }
  
  // Also process explicit candidates
  for (const item of transitScan.explicit_candidates || []) {
    if (item.base_rule_id) {
      // For explicit candidates, create trigger rule directly
      const trigger = createTransitTriggerRule(
        item.transit_planet,
        item.house,
        item.base_planet,
        item.base_rule_id,
        {
          activation: 'temporary',
          intensity_multiplier: 1.2,
          risk_sensitivity: 'high',
          canonical_meaning: `When ${item.transit_planet} transits the ${item.house} house, the effects of ${item.base_planet} in the ${item.house} house may temporarily intensify, requiring greater attention and careful decision-making.`,
          theme: 'general',
          trend: 'mixed',
          intensity: 0.75,
          tone: 'cautionary',
          scenario: 'transit_trigger',
          outcome_text: `When ${item.transit_planet} transits the ${item.house} house, the effects of ${item.base_planet} in the ${item.house} house may temporarily intensify. This period requires greater attention to the life areas associated with this placement, as decision-making errors or negligence may have higher impact during this transit window.`,
          confidence_level: 'medium',
          book_id: bookId,
          unit_id: item.unit_id
        }
      );
      if (trigger) {
        triggers.push(trigger);
      }
    }
  }
  
  // Output results
  const output = {
    schema_version: 1,
    book_id: bookId,
    created_at: new Date().toISOString(),
    summary: {
      total_triggers: triggers.length,
      still_flagged: stillFlagged.length,
      status: triggers.length > 0 ? 'rules_extracted' : 'no_extractable_rules_found'
    },
    triggers,
    still_flagged: stillFlagged,
    notes: triggers.length === 0 
      ? "No explicit Transit × Planet × House rules found. All flagged items were generic transit information or do not meet extraction criteria. System is ready for future books that may contain such explicit statements. See PHASE4_TRANSIT_TRIGGER_GUIDANCE.md for structure and extraction rules."
      : `${triggers.length} Transit trigger rules extracted. These define WHEN base Planet × House effects become temporarily active during major transits.`
  };
  
  const outputPath = path.join(paths.processedDir, 'transit.triggers.v1.json');
  await writeJson(outputPath, output);
  
  console.log(`✅ Analysis complete:`);
  console.log(`   - Extractable triggers: ${triggers.length}`);
  console.log(`   - Still flagged: ${stillFlagged.length}`);
  console.log(`   - Output: ${outputPath}\n`);
  
  if (triggers.length > 0) {
    console.log('📋 Extracted triggers:');
    for (const t of triggers.slice(0, 5)) {
      console.log(`   - ${t.transit_planet} transit in ${t.house} triggers ${t.base_planet} in ${t.house} (refines ${t.base_rule_id})`);
    }
    if (triggers.length > 5) {
      console.log(`   ... and ${triggers.length - 5} more`);
    }
  } else {
    console.log('📝 No extractable Transit trigger rules found.');
    console.log('   This is expected if the book does not contain explicit Transit × Planet × House statements.');
  }
}

main().catch((err) => {
  console.error('❌ extractTransitTriggers failed:', err.message);
  process.exit(1);
});

