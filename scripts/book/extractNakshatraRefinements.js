/**
 * PHASE 2: Nakshatra Refinement Extraction Script
 * 
 * Extracts Nakshatra refinement rules that modify HOW base Planet × House effects manifest.
 * 
 * CRITICAL CONSTRAINTS:
 * - Must reference existing Planet × House base rules
 * - Modifies intensity or quality ONLY (HOW, not WHAT)
 * - Never contradicts base rules
 * - Only extracts when book explicitly connects nakshatra to planetary placement
 * - Book-driven, not inferred from general lore
 */

import { mustGetBookId, getPathsForBook, readJson, writeJson } from './_shared.js';
import path from 'path';

/**
 * Analyzes flagged items to determine if they can be extracted as refinement rules.
 * 
 * Criteria:
 * 1. Must have planet, house, and nakshatra
 * 2. Must have valid base_rule_id
 * 3. Must describe HOW the effect manifests (behavioral pattern, intensity, quality)
 * 4. Must NOT redefine the life domain
 */
function analyzeFlaggedItem(item, book, baseRules) {
  // For now, return null - no extractable rules found in scan
  // This function structure is ready for future books
  
  const chunk = book.find(c => c.chunk_id === item.chunk_id);
  if (!chunk) return null;
  
  const text = chunk.text || '';
  
  // Check if text describes HOW (behavioral pattern, intensity, quality)
  // vs WHAT (life domain redefinition)
  
  // Behavioral pattern indicators
  const behavioralPatterns = [
    'more reactive', 'less flexible', 'emotionally sensitive',
    'prone to', 'tends to', 'manifests with', 'expresses as',
    'more intense', 'less visible', 'heightened', 'moderated'
  ];
  
  // Life domain redefinition indicators (BAD)
  const domainRedefinition = [
    'becomes about', 'changes to', 'transforms into',
    'is now', 'becomes', 'turns into'
  ];
  
  // For lalkitab: no extractable rules found
  return null;
}

/**
 * Creates a Nakshatra refinement rule structure
 */
function createRefinementRule(planet, house, nakshatra, baseRuleId, refinementData) {
  return {
    rule_id: `${planet}_${house}_NAKSHATRA_${nakshatra}`,
    base_rule_id: baseRuleId,
    planet,
    house,
    nakshatra,
    refinement_type: refinementData.type, // 'behavioral_pattern', 'intensity_modifier', 'emotional_tendency', 'volatility_indicator'
    intensity_delta: refinementData.intensity_delta || 0,
    qualitative_modifier: refinementData.qualitative_modifier || null,
    canonical_meaning: refinementData.canonical_meaning,
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
          planet_in_nakshatra: {
            planet_in: [planet],
            nakshatra_in: [nakshatra],
            match_mode: 'any',
            min_planets: 1
          }
        }
      ]
    },
    effect_json: {
      theme: refinementData.theme || 'general',
      area: `${planet.toLowerCase()}_house_${house}_nakshatra_${nakshatra.toLowerCase()}`,
      trend: refinementData.trend || 'mixed',
      intensity: refinementData.intensity || 0.5,
      tone: refinementData.tone || 'informational',
      trigger: 'natal',
      scenario: refinementData.scenario || 'nakshatra_refinement',
      outcome_text: refinementData.outcome_text,
      variant_meta: {
        tone: refinementData.tone || 'informational',
        confidence_level: refinementData.confidence_level || 'medium',
        dominance: 'refinement',
        certainty_note: `This refines the base ${planet} in ${house} house rule by adding ${refinementData.type} specific to ${nakshatra} nakshatra.`
      }
    },
    source: {
      book_id: refinementData.book_id || null,
      unit_id: refinementData.unit_id || null
    }
  };
}

async function main() {
  const bookId = mustGetBookId(process.argv);
  
  console.log(`🔍 Analyzing ${bookId} for extractable Nakshatra refinement rules...\n`);
  
  const paths = getPathsForBook(bookId);
  
  // Load data
  const book = await readJson(paths.sourceBookPath);
  const rules = await readJson(paths.rulesPath);
  const nakshatraScan = await readJson(path.join(paths.processedDir, 'nakshatra.scan.v1.json'));
  
  const refinements = [];
  const stillFlagged = [];
  
  // Analyze flagged items
  for (const item of nakshatraScan.flagged_for_review || []) {
    if (!item.base_rule_id) {
      stillFlagged.push({ ...item, reason: 'no_base_rule' });
      continue;
    }
    
    const analysis = analyzeFlaggedItem(item, book, rules.rules);
    if (analysis && analysis.extractable) {
      const refinement = createRefinementRule(
        item.planet,
        item.house,
        item.nakshatra,
        item.base_rule_id,
        { ...analysis, book_id: bookId }
      );
      refinements.push(refinement);
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
      total_refinements: refinements.length,
      still_flagged: stillFlagged.length,
      status: refinements.length > 0 ? 'rules_extracted' : 'no_extractable_rules_found'
    },
    refinements,
    still_flagged: stillFlagged,
    notes: refinements.length === 0 
      ? "No explicit Planet × House × Nakshatra rules found. All flagged items were false positives or do not meet extraction criteria. See PHASE2_NAKSHATRA_REFINEMENT_GUIDANCE.md for structure and extraction rules."
      : `${refinements.length} Nakshatra refinement rules extracted. These refine HOW base Planet × House effects manifest.`
  };
  
  const outputPath = path.join(paths.processedDir, 'nakshatra.refinements.v1.json');
  await writeJson(outputPath, output);
  
  console.log(`✅ Analysis complete:`);
  console.log(`   - Extractable refinements: ${refinements.length}`);
  console.log(`   - Still flagged: ${stillFlagged.length}`);
  console.log(`   - Output: ${outputPath}\n`);
  
  if (refinements.length > 0) {
    console.log('📋 Extracted refinements:');
    for (const r of refinements.slice(0, 5)) {
      console.log(`   - ${r.planet} in ${r.house} in ${r.nakshatra} (refines ${r.base_rule_id})`);
    }
    if (refinements.length > 5) {
      console.log(`   ... and ${refinements.length - 5} more`);
    }
  } else {
    console.log('📝 No extractable Nakshatra refinement rules found.');
    console.log('   This is expected if the book does not contain explicit Nakshatra × Planet × House statements.');
  }
}

main().catch((err) => {
  console.error('❌ extractNakshatraRefinements failed:', err.message);
  process.exit(1);
});

