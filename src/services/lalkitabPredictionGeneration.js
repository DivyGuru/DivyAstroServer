/**
 * Lal Kitab Prediction Generation Service
 * 
 * Generates Lal Kitab Prediction data based on planet positions.
 * Similar to sample PDF structure: Planet in house predictions with remedies.
 * 
 * API CONTRACT:
 * {
 *   meta: {
 *     window_id: string,
 *     generated_at: string ISO timestamp
 *   },
 *   predictions: [
 *     {
 *       planet: string,
 *       house: number,
 *       narrative: string,
 *       remedies: [
 *         {
 *           number: number,
 *           description: string
 *         }
 *       ]
 *     }
 *   ]
 * }
 */

import { query } from '../../config/db.js';
import { normalizeAstroState, evalNode } from '../engine/ruleEvaluator.js';

/**
 * Get planet name in proper format
 */
function getPlanetName(planet) {
  if (!planet) return null;
  
  const planetMap = {
    'SUN': 'Sun',
    'MOON': 'Moon',
    'MARS': 'Mars',
    'MERCURY': 'Mercury',
    'JUPITER': 'Jupiter',
    'VENUS': 'Venus',
    'SATURN': 'Saturn',
    'RAHU': 'Rahu',
    'KETU': 'Ketu'
  };
  
  const upperPlanet = String(planet).toUpperCase();
  return planetMap[upperPlanet] || planet;
}

/**
 * Extract remedies from effect_json or canonical_meaning
 */
function extractRemedies(rule) {
  const remedies = [];
  
  // Check effect_json for remedies
  if (rule.effect_json && rule.effect_json.remedies) {
    const remedyList = Array.isArray(rule.effect_json.remedies) 
      ? rule.effect_json.remedies 
      : [rule.effect_json.remedies];
    
    remedyList.forEach((remedy, index) => {
      if (typeof remedy === 'string') {
        remedies.push({
          number: index + 1,
          description: remedy
        });
      } else if (remedy && remedy.description) {
        remedies.push({
          number: remedy.number || index + 1,
          description: remedy.description
        });
      }
    });
  }
  
  // Check canonical_meaning for remedy patterns
  if (rule.canonical_meaning && remedies.length === 0) {
    // Try to extract remedies from text (format: "(1) ...", "(2) ...")
    const remedyPattern = /\((\d+)\)\s*([^\n(]+)/g;
    let match;
    while ((match = remedyPattern.exec(rule.canonical_meaning)) !== null) {
      remedies.push({
        number: parseInt(match[1]),
        description: match[2].trim()
      });
    }
  }
  
  return remedies;
}

/**
 * Generate Lal Kitab Prediction data
 */
export async function generateLalkitabPrediction(windowId) {
  // Input validation
  if (!windowId || Number.isNaN(Number(windowId))) {
    throw new Error('WINDOW_ID missing or invalid');
  }

  const windowIdNum = Number(windowId);

  // Load window
  const windowRes = await query(
    'SELECT id, scope, start_at, end_at, user_id, chart_id FROM prediction_windows WHERE id = $1',
    [windowIdNum]
  );
  
  if (windowRes.rowCount === 0) {
    throw new Error(`Window not found: ${windowId}`);
  }
  
  const window = windowRes.rows[0];
  
  // Load astro snapshot
  const astroRes = await query(
    'SELECT * FROM astro_state_snapshots WHERE window_id = $1',
    [windowIdNum]
  );
  
  if (astroRes.rowCount === 0) {
    throw new Error(`Astro snapshot not found for window_id=${windowId}`);
  }
  
  const astroSnapshot = astroRes.rows[0];
  
  // Normalize astro state
  const astroNormalized = normalizeAstroState(astroSnapshot);
  
  // Get planet positions
  const planetPositions = [];
  for (const [planetName, planetData] of Object.entries(astroNormalized.planetsByName)) {
    if (planetData && planetData.house) {
      planetPositions.push({
        planet: planetName.toUpperCase(),
        house: planetData.house
      });
    }
  }
  
  // Query Lal Kitab BASE rules
  // Note: Check if rules table has source_book column (might be in astro_rules table)
  let rulesRes;
  try {
    // Try querying from rules table first
    rulesRes = await query(
      `SELECT 
        id,
        rule_id,
        rule_type,
        condition_tree,
        effect_json,
        canonical_meaning,
        source_book,
        source_unit_id
      FROM rules
      WHERE is_active = TRUE
        AND source_book = 'lalkitab'
        AND rule_type = 'BASE'
        AND (engine_status = 'READY' OR engine_status IS NULL)
      ORDER BY id ASC`
    );
  } catch (err) {
    // If source_book column doesn't exist, try alternative query
    console.log(`[LalkitabPrediction] Rules table query failed, trying alternative: ${err.message}`);
    // Try querying by rule_id pattern
    rulesRes = await query(
      `SELECT 
        id,
        rule_id,
        rule_type,
        condition_tree,
        effect_json,
        canonical_meaning,
        source_book,
        source_unit_id
      FROM rules
      WHERE is_active = TRUE
        AND (rule_id LIKE 'lalkitab%' OR rule_id LIKE 'lal_kitab%')
        AND (rule_type = 'BASE' OR rule_type IS NULL)
        AND (engine_status = 'READY' OR engine_status IS NULL)
      ORDER BY id ASC
      LIMIT 100`
    );
  }
  
  const lalkitabRules = rulesRes.rows;
  
  console.log(`[LalkitabPrediction] Window ${windowId}: Found ${lalkitabRules.length} Lal Kitab rules`);
  
  // Match rules with planet positions
  const predictions = [];
  
  // Planet order for display (as per traditional order)
  const planetOrder = ['SUN', 'MOON', 'MARS', 'MERCURY', 'JUPITER', 'VENUS', 'SATURN', 'RAHU', 'KETU'];
  
  for (const planetPos of planetPositions) {
    const planetName = planetPos.planet.toUpperCase();
    
    // Skip if not in traditional order (we'll process in order)
    if (!planetOrder.includes(planetName)) {
      continue;
    }
    
    // Find matching lalkitab rule for this planet × house combination
    let matchingRule = null;
    
    for (const rule of lalkitabRules) {
      // Evaluate condition_tree using rule evaluator
      try {
        const matches = evalNode(rule.condition_tree, astroNormalized);
        if (matches) {
          matchingRule = rule;
          break;
        }
      } catch (err) {
        // Skip rule if evaluation fails
        console.error(`Error evaluating rule ${rule.rule_id}:`, err);
        continue;
      }
    }
    
    if (matchingRule) {
      // Extract narrative
      const narrative = matchingRule.canonical_meaning || 
        matchingRule.effect_json?.narrative || 
        matchingRule.effect_json?.description ||
        matchingRule.effect_json?.outcome_text ||
        null;
      
      // Extract remedies
      const remedies = extractRemedies(matchingRule);
      
      predictions.push({
        planet: planetName,
        house: planetPos.house,
        narrative: narrative,
        remedies: remedies.length > 0 ? remedies : null
      });
    }
  }
  
  // Sort by planet order
  predictions.sort((a, b) => {
    const indexA = planetOrder.indexOf(a.planet);
    const indexB = planetOrder.indexOf(b.planet);
    return indexA - indexB;
  });
  
  return {
    meta: {
      window_id: String(windowId),
      generated_at: new Date().toISOString()
    },
    predictions: predictions
  };
}

