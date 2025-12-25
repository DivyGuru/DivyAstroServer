#!/usr/bin/env node

/**
 * PHASE D — LAYER CLASSIFICATION
 * 
 * Classifies each understood meaning into ONE PRIMARY layer:
 * BASE / NAKSHATRA / DASHA / TRANSIT / STRENGTH / YOGA
 * 
 * Rules:
 * - BASE is default fallback (Planet × House)
 * - DASHA only if explicitly time-activated
 * - STRENGTH/YOGA only MODIFY intensity (not outcomes)
 * - TRANSIT = temporary sensitivity only
 * - NAKSHATRA = explicit Planet × House × Nakshatra refinement
 * 
 * Usage: node scripts/book/classifyLayers.js <bookId>
 */

import { mustGetBookId, getPathsForBook, readJson, writeJson, nowIso } from './_shared.js';
import path from 'path';

/**
 * Classify meaning into PRIMARY layer based on scan data and understanding
 */
function classifyIntoLayer(meaning, scanUnit) {
  const possibleLayers = scanUnit?.detection?.possible_layers || {};
  const entities = scanUnit?.detection?.entities || {};
  const understanding = meaning.understood_meaning || {};
  
  // Priority order (most specific first):
  // 1. YOGA - explicit combinations
  // 2. STRENGTH - modifies intensity only
  // 3. TRANSIT - temporary sensitivity
  // 4. DASHA - time activation
  // 5. NAKSHATRA - refinement layer
  // 6. BASE - default fallback
  
  // Check understanding metadata for time_scale hints
  const timeScale = understanding.understanding_metadata?.time_scale || 'conditional';
  
  // YOGA: Explicit yoga mention + multiple planets
  if (possibleLayers.YOGA && entities.planets?.length >= 2) {
    return {
      primary_layer: 'YOGA',
      secondary_layers: [],
      reasoning: 'Explicit yoga combination detected with multiple planets',
      is_modifier: true, // YOGA modifies intensity/confidence, not outcomes
    };
  }
  
  // STRENGTH: Explicit strength state mention
  if (possibleLayers.STRENGTH && entities.planets?.length > 0) {
    return {
      primary_layer: 'STRENGTH',
      secondary_layers: [],
      reasoning: 'Explicit strength state (exaltation/debilitation/own sign) detected',
      is_modifier: true, // STRENGTH modifies intensity only
    };
  }
  
  // TRANSIT: Temporary sensitivity (gochar/transit mention)
  // CONTENT-DEPTH-FIRST: Accept even if timing is implied, not only explicit
  if (possibleLayers.TRANSIT) {
    return {
      primary_layer: 'TRANSIT',
      secondary_layers: ['BASE'], // TRANSIT modifies BASE effects
      reasoning: timeScale === 'short' ? 
        'Temporary transit sensitivity detected with short-term time scale' :
        'Transit sensitivity detected (timing implied)',
      is_modifier: true,
    };
  }
  
  // DASHA: Time activation (explicit dasha mention or implied timing)
  // CONTENT-DEPTH-FIRST: Accept if timing is implied, not only explicit
  if (possibleLayers.DASHA) {
    return {
      primary_layer: 'DASHA',
      secondary_layers: ['BASE'], // DASHA activates BASE effects
      reasoning: timeScale === 'long' ? 
        'Explicit dasha activation detected with long-term time scale' :
        'Dasha activation detected (timing implied)',
      is_modifier: true,
    };
  }
  
  // NAKSHATRA: Explicit nakshatra refinement
  if (possibleLayers.NAKSHATRA && entities.nakshatras?.length > 0 && 
      entities.planets?.length > 0 && entities.houses?.length > 0) {
    return {
      primary_layer: 'NAKSHATRA',
      secondary_layers: ['BASE'], // NAKSHATRA refines BASE effects
      reasoning: 'Explicit nakshatra refinement detected with planet, house, and nakshatra',
      is_modifier: true,
    };
  }
  
  // BASE: Default fallback (Planet × House)
  if (possibleLayers.BASE && entities.planets?.length > 0 && entities.houses?.length > 0) {
    return {
      primary_layer: 'BASE',
      secondary_layers: [],
      reasoning: 'Planet × House base effect (default layer)',
      is_modifier: false,
    };
  }
  
  // Fallback: If nothing matches, classify as BASE if we have planets/houses
  if (entities.planets?.length > 0 && entities.houses?.length > 0) {
    return {
      primary_layer: 'BASE',
      secondary_layers: [],
      reasoning: 'Fallback to BASE layer (has planets and houses)',
      is_modifier: false,
    };
  }
  
  // Cannot classify
  return {
    primary_layer: null,
    secondary_layers: [],
    reasoning: 'Cannot determine layer - missing required entities',
    is_modifier: false,
  };
}

async function main() {
  const bookId = mustGetBookId(process.argv);
  const paths = getPathsForBook(bookId);
  
  console.log(`\n🔍 LAYER CLASSIFICATION: ${bookId}\n`);
  
  // Load scan and meanings
  const scan = await readJson(paths.scanPath);
  const meanings = await readJson(path.join(paths.processedDir, 'meanings.v1.json'));
  
  // Build scan unit map
  const scanUnitMap = new Map();
  for (const unit of scan.units || []) {
    scanUnitMap.set(unit.unit_id, unit);
  }
  
  // Classify each meaning
  const classifiedMeanings = [];
  const layerStats = {
    BASE: 0,
    NAKSHATRA: 0,
    DASHA: 0,
    TRANSIT: 0,
    STRENGTH: 0,
    YOGA: 0,
    UNCLASSIFIED: 0,
  };
  
  for (const meaning of meanings.meanings || []) {
    const unitId = meaning.source?.unit_id;
    const scanUnit = scanUnitMap.get(unitId);
    
    if (!scanUnit) {
      console.warn(`⚠️  No scan unit found for ${unitId}`);
      continue;
    }
    
    const classification = classifyIntoLayer(meaning, scanUnit);
    
    // Add classification to meaning
    const classified = {
      ...meaning,
      layer_classification: {
        primary_layer: classification.primary_layer,
        secondary_layers: classification.secondary_layers,
        reasoning: classification.reasoning,
        is_modifier: classification.is_modifier,
        entities: scanUnit.detection?.entities || {},
      },
    };
    
    classifiedMeanings.push(classified);
    
    // Update stats
    if (classification.primary_layer) {
      layerStats[classification.primary_layer]++;
    } else {
      layerStats.UNCLASSIFIED++;
    }
  }
  
  // Write classified meanings
  const classifiedPath = path.join(paths.processedDir, 'meanings.classified.v1.json');
  await writeJson(classifiedPath, {
    schema_version: 1,
    book_id: bookId,
    created_at: nowIso(),
    total_meanings: classifiedMeanings.length,
    layer_statistics: layerStats,
    meanings: classifiedMeanings,
    notes: 'Meanings classified into 5-layer system. Each meaning has one PRIMARY layer.',
  });
  
  console.log(`✅ Classification complete:`);
  console.log(`   - Total meanings: ${classifiedMeanings.length}`);
  console.log(`   - Layer distribution:`);
  Object.entries(layerStats).forEach(([layer, count]) => {
    if (count > 0) {
      console.log(`     ${layer}: ${count}`);
    }
  });
  console.log(`   - Output: ${classifiedPath}\n`);
  
  return {
    classifiedMeanings,
    layerStats,
  };
}

main().catch((err) => {
  console.error('❌ Layer classification failed:', err.message);
  process.exit(1);
});

