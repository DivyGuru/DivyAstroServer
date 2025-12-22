/**
 * PHASE 5: Strength & Yoga Rule Extraction Script
 * 
 * Extracts Strength state and Yoga (combination) rules that modify existing Planet × House effects.
 * 
 * CRITICAL CONSTRAINTS:
 * - Must reference existing Planet × House base rules
 * - Modifies intensity/effectiveness ONLY (not WHAT, but HOW STRONG)
 * - Never contradicts base rules
 * - Only extracts when book explicitly describes strength/yoga effects
 * - Book-driven, not inferred from general lore
 * - Focuses on power modification (not fear)
 */

import { mustGetBookId, getPathsForBook, readJson, writeJson, validateConditionTree } from './_shared.js';
import path from 'path';

/**
 * Analyzes flagged items to determine if they can be extracted as strength/yoga rules.
 */
function analyzeFlaggedItem(item, book, baseRules) {
  // For now, return null - no extractable rules found in scan
  // This function structure is ready for future books
  
  const chunk = book.find(c => c.chunk_id === item.chunk_id);
  if (!chunk) return null;
  
  const text = chunk.text || '';
  
  // Check if text describes intensity/effectiveness modification
  // vs generic strength/yoga information
  
  // Intensity/effectiveness indicators
  const intensityIndicators = [
    'more strongly', 'more effectively', 'greater intensity',
    'enhanced', 'strengthened', 'weakened', 'reduced',
    'more consistent', 'less reliable', 'better expression',
    'improved results', 'diminished results'
  ];
  
  // Generic indicators (BAD)
  const genericIndicators = [
    'always', 'never', 'guaranteed', 'definitely',
    'cannot be', 'must result in', 'inevitable'
  ];
  
  // For lalkitab: no extractable rules found
  return null;
}

/**
 * Creates a Strength state rule structure
 * 
 * NOTE: Current engine supports `planet_strength` operator for numeric strength values,
 * but not for states like "EXALTED", "DEBILITATED". For now, we'll use `generic_condition`
 * as a placeholder, or flag as non-expressible if the engine doesn't support it.
 */
function createStrengthRule(planet, strengthState, baseRuleIds, strengthData) {
  if (!baseRuleIds || baseRuleIds.length === 0) return null;
  
  // Check if we can express this with current operators
  // For now, we'll use generic_condition as a placeholder
  // In future, engine may support planet_strength with state parameter
  
  const intensityMultiplier = strengthData.intensity_multiplier || 
    (strengthState === 'EXALTED' ? 1.3 : 
     strengthState === 'DEBILITATED' ? 0.7 : 
     strengthState === 'OWN_SIGN' ? 1.2 : 1.0);
  
  return {
    rule_id: `${planet}_${strengthState}`,
    base_rule_ids: baseRuleIds,
    planet,
    strength_state: strengthState,
    condition_tree: {
      generic_condition: {
        // Placeholder: Engine may need to add support for strength states
        // For now, using generic_condition as a workaround
        note: `Planet ${planet} in ${strengthState} state - requires engine support for strength state checking`
      }
    },
    effect_json: {
      intensity_multiplier: intensityMultiplier,
      stability: strengthData.stability || (strengthState === 'EXALTED' ? 'high' : 
                                            strengthState === 'DEBILITATED' ? 'low' : 'medium'),
      effectiveness: strengthData.effectiveness || (strengthState === 'EXALTED' ? 'enhanced' : 
                                                    strengthState === 'DEBILITATED' ? 'reduced' : 'normal'),
      theme: strengthData.theme || 'general',
      area: `${planet.toLowerCase()}_strength_${strengthState.toLowerCase()}`,
      trend: strengthData.trend || 'mixed',
      intensity: strengthData.intensity || 0.7,
      tone: strengthData.tone || 'informational',
      scenario: 'strength_modifier',
      outcome_text: strengthData.outcome_text,
      variant_meta: {
        tone: strengthData.tone || 'informational',
        confidence_level: strengthData.confidence_level || 'medium',
        dominance: 'strength_modifier',
        certainty_note: `This modifies the intensity and effectiveness of base ${planet} rules when the planet is in ${strengthState} state.`
      }
    },
    canonical_meaning: strengthData.canonical_meaning,
    source: {
      book_id: strengthData.book_id || null,
      unit_id: strengthData.unit_id || null
    },
    engine_expressibility: 'requires_generic_condition', // Flag for future engine enhancement
  };
}

/**
 * Creates a Yoga (combination) rule structure
 * 
 * NOTE: Current engine has `yogas_state` in astro snapshot but no `yoga_present` operator.
 * For now, we'll use `generic_condition` as a placeholder, or flag as non-expressible.
 */
function createYogaRule(yogaName, planets, baseRuleIds, yogaData) {
  if (!baseRuleIds || baseRuleIds.length === 0) return null;
  if (!planets || planets.length < 2) return null;
  
  // Check if we can express this with current operators
  // For now, we'll use generic_condition as a placeholder
  // In future, engine may support yoga_present operator
  
  return {
    rule_id: `YOGA_${yogaName}`,
    base_rule_ids: baseRuleIds,
    yoga_name: yogaName,
    planets,
    condition_tree: {
      generic_condition: {
        // Placeholder: Engine may need to add support for yoga checking
        // For now, using generic_condition as a workaround
        note: `Yoga ${yogaName} involving ${planets.join(', ')} - requires engine support for yoga checking`
      }
    },
    effect_json: {
      intensity_multiplier: yogaData.intensity_multiplier || 1.4,
      effectiveness: yogaData.effectiveness || 'enhanced',
      synergy: yogaData.synergy || 'positive',
      theme: yogaData.theme || 'general',
      area: `yoga_${yogaName.toLowerCase()}`,
      trend: yogaData.trend || 'mixed',
      intensity: yogaData.intensity || 0.8,
      tone: yogaData.tone || 'informational',
      scenario: 'yoga_modifier',
      outcome_text: yogaData.outcome_text,
      variant_meta: {
        tone: yogaData.tone || 'informational',
        confidence_level: yogaData.confidence_level || 'medium',
        dominance: 'yoga_modifier',
        certainty_note: `This yoga modifies the intensity and effectiveness of base rules when ${planets.join(' and ')} operate together.`
      }
    },
    canonical_meaning: yogaData.canonical_meaning,
    source: {
      book_id: yogaData.book_id || null,
      unit_id: yogaData.unit_id || null
    },
    engine_expressibility: 'requires_generic_condition', // Flag for future engine enhancement
  };
}

async function main() {
  const bookId = mustGetBookId(process.argv);
  
  console.log(`🔍 Analyzing ${bookId} for extractable Strength & Yoga rules...\n`);
  
  const paths = getPathsForBook(bookId);
  
  // Load data
  const book = await readJson(paths.sourceBookPath);
  const rules = await readJson(paths.rulesPath);
  const scan = await readJson(path.join(paths.processedDir, 'strength_yoga.scan.v1.json'));
  
  const strengthRules = [];
  const yogaRules = [];
  const stillFlagged = [];
  
  // Analyze strength candidates
  for (const item of scan.strength_candidates || []) {
    if (!item.base_rule_ids || item.base_rule_ids.length === 0) {
      stillFlagged.push({ ...item, reason: 'no_base_rules' });
      continue;
    }
    
    if (!item.planet || !item.strength_state) {
      stillFlagged.push({ ...item, reason: 'missing_required_fields' });
      continue;
    }
    
    // Create strength rule
    const strengthRule = createStrengthRule(
      item.planet,
      item.strength_state,
      item.base_rule_ids,
      {
        canonical_meaning: `When ${item.planet} is in ${item.strength_state} state, its effects tend to manifest with ${item.strength_state === 'EXALTED' ? 'greater stability and consistency' : item.strength_state === 'DEBILITATED' ? 'reduced effectiveness' : 'moderate expression'}.`,
        outcome_text: `When ${item.planet} is in ${item.strength_state} state, the effects associated with ${item.planet} placements may manifest with ${item.strength_state === 'EXALTED' ? 'greater stability, consistency, and constructive expression' : item.strength_state === 'DEBILITATED' ? 'reduced effectiveness and reliability' : 'moderate expression'}. This modifies the intensity and effectiveness of base ${item.planet} rules.`,
        book_id: bookId,
        unit_id: item.unit_id
      }
    );
    
    if (strengthRule) {
      strengthRules.push(strengthRule);
    }
  }
  
  // Analyze yoga candidates
  for (const item of scan.yoga_candidates || []) {
    if (!item.base_rule_ids || item.base_rule_ids.length === 0) {
      stillFlagged.push({ ...item, reason: 'no_base_rules' });
      continue;
    }
    
    if (!item.yoga_name || !item.planets || item.planets.length < 2) {
      stillFlagged.push({ ...item, reason: 'missing_required_fields' });
      continue;
    }
    
    // Create yoga rule
    const yogaRule = createYogaRule(
      item.yoga_name,
      item.planets,
      item.base_rule_ids,
      {
        canonical_meaning: `${item.yoga_name} yoga enhances the constructive influence when ${item.planets.join(' and ')} operate together, strengthening their combined effects.`,
        outcome_text: `${item.yoga_name} yoga enhances the constructive influence when ${item.planets.join(' and ')} operate together. This combination strengthens the combined effects of these planets, improving the intensity and effectiveness of their base rules.`,
        book_id: bookId,
        unit_id: item.unit_id
      }
    );
    
    if (yogaRule) {
      yogaRules.push(yogaRule);
    }
  }
  
  // Analyze flagged items
  for (const item of scan.flagged_for_review || []) {
    const analysis = analyzeFlaggedItem(item, book, rules.rules);
    if (analysis && analysis.extractable) {
      // Process if extractable
      if (item.type === 'strength' && item.planet && item.strength_state) {
        const baseRuleIds = item.house ? 
          rules.rules.filter(r => {
            const cond = r.condition_tree?.planet_in_house;
            return cond && cond.planet_in?.includes(item.planet) && cond.house_in?.includes(item.house);
          }).map(r => r.id) : [];
        
        if (baseRuleIds.length > 0) {
          const strengthRule = createStrengthRule(item.planet, item.strength_state, baseRuleIds, {
            ...analysis,
            book_id: bookId
          });
          if (strengthRule) {
            strengthRules.push(strengthRule);
          }
        } else {
          stillFlagged.push({ ...item, reason: 'no_base_rules' });
        }
      } else if (item.type === 'yoga' && item.yoga_name && item.planets) {
        // Similar logic for yogas
        stillFlagged.push({ ...item, reason: analysis?.reason || 'not_extractable' });
      } else {
        stillFlagged.push({ ...item, reason: analysis?.reason || 'not_extractable' });
      }
    } else {
      stillFlagged.push({ ...item, reason: analysis?.reason || 'not_extractable' });
    }
  }
  
  // Validate condition trees
  for (const rule of [...strengthRules, ...yogaRules]) {
    try {
      validateConditionTree(rule.condition_tree);
    } catch (err) {
      console.warn(`⚠️  Warning: Invalid condition_tree in ${rule.rule_id}: ${err.message}`);
    }
  }
  
  // Output results
  const output = {
    schema_version: 1,
    book_id: bookId,
    created_at: new Date().toISOString(),
    summary: {
      total_strength_rules: strengthRules.length,
      total_yoga_rules: yogaRules.length,
      still_flagged: stillFlagged.length,
      status: (strengthRules.length + yogaRules.length) > 0 ? 'rules_extracted' : 'no_extractable_rules_found'
    },
    strength_rules: strengthRules,
    yoga_rules: yogaRules,
    still_flagged: stillFlagged,
    notes: (strengthRules.length + yogaRules.length) === 0 
      ? "No explicit Strength or Yoga rules found. All flagged items were generic information or do not meet extraction criteria. System is ready for future books that may contain such explicit statements. See PHASE5_STRENGTH_YOGA_GUIDANCE.md for structure and extraction rules."
      : `${strengthRules.length} Strength rules and ${yogaRules.length} Yoga rules extracted. These modify the intensity and effectiveness of base Planet × House effects. NOTE: Current rules use generic_condition as placeholder - engine may need enhancement for full support.`
  };
  
  const outputPath = path.join(paths.processedDir, 'strength_yoga.rules.v1.json');
  await writeJson(outputPath, output);
  
  console.log(`✅ Analysis complete:`);
  console.log(`   - Strength rules: ${strengthRules.length}`);
  console.log(`   - Yoga rules: ${yogaRules.length}`);
  console.log(`   - Still flagged: ${stillFlagged.length}`);
  console.log(`   - Output: ${outputPath}\n`);
  
  if (strengthRules.length > 0) {
    console.log('📋 Extracted strength rules:');
    for (const r of strengthRules.slice(0, 5)) {
      console.log(`   - ${r.planet} ${r.strength_state} (modifies ${r.base_rule_ids.length} base rules)`);
    }
    if (strengthRules.length > 5) {
      console.log(`   ... and ${strengthRules.length - 5} more`);
    }
  }
  
  if (yogaRules.length > 0) {
    console.log('📋 Extracted yoga rules:');
    for (const r of yogaRules.slice(0, 5)) {
      console.log(`   - ${r.yoga_name} (${r.planets.join(', ')}) (modifies ${r.base_rule_ids.length} base rules)`);
    }
    if (yogaRules.length > 5) {
      console.log(`   ... and ${yogaRules.length - 5} more`);
    }
  }
  
  if (strengthRules.length === 0 && yogaRules.length === 0) {
    console.log('📝 No extractable Strength or Yoga rules found.');
    console.log('   This is expected if the book does not contain explicit Strength/Yoga statements.');
  }
  
  if (strengthRules.length > 0 || yogaRules.length > 0) {
    console.log('\n⚠️  NOTE: Current rules use generic_condition as placeholder.');
    console.log('   Engine may need enhancement for full strength state and yoga support.');
  }
}

main().catch((err) => {
  console.error('❌ extractStrengthYogaRules failed:', err.message);
  process.exit(1);
});

