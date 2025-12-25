#!/usr/bin/env node

/**
 * RESOLVE PENDING_OPERATOR RULES
 * 
 * Create GENERIC BASE ANCHORS so that modifier rules can execute.
 * 
 * RULES:
 * - Do NOT reject any rule
 * - Do NOT require perfect classical correctness
 * - Lal Kitab logic is symbolic and contextual
 * 
 * Usage: node scripts/resolvePendingOperators.js <bookId>
 */

import { query, getClient } from '../config/db.js';
import { mustGetBookId } from './book/_shared.js';

/**
 * Extract planet and house from condition tree
 */
function extractPlanetHouseFromCondition(conditionTree) {
  let planets = [];
  let houses = [];
  
  if (!conditionTree) return { planets: [], houses: [] };
  
  // Recursively search for planet_in_house conditions
  function search(node) {
    if (Array.isArray(node.all)) {
      node.all.forEach(search);
    } else if (Array.isArray(node.any)) {
      node.any.forEach(search);
    } else if (node.planet_in_house) {
      if (node.planet_in_house.planet_in) {
        planets.push(...node.planet_in_house.planet_in);
      }
      if (node.planet_in_house.house_in) {
        houses.push(...node.planet_in_house.house_in);
      }
    } else if (node.transit_planet_in_house) {
      if (node.transit_planet_in_house.planet_in) {
        planets.push(...node.transit_planet_in_house.planet_in);
      }
      if (node.transit_planet_in_house.house_in) {
        houses.push(...node.transit_planet_in_house.house_in);
      }
    } else if (node.planet_strength) {
      if (node.planet_strength.planet_in) {
        planets.push(...node.planet_strength.planet_in);
      }
    }
  }
  
  search(conditionTree);
  
  // Remove duplicates
  planets = [...new Set(planets)];
  houses = [...new Set(houses)];
  
  return { planets, houses };
}

/**
 * Create generic BASE rule for modifier
 */
function createBaseAnchor(pendingRule) {
  const { condition_tree, rule_type, canonical_meaning } = pendingRule;
  
  // Extract planet and house from condition tree
  const { planets, houses } = extractPlanetHouseFromCondition(condition_tree);
  
  // If no planets/houses found, try to infer from canonical_meaning
  if (planets.length === 0 || houses.length === 0) {
    // Try to extract from text (basic pattern matching)
    const text = (canonical_meaning || '').toLowerCase();
    
    const planetMap = {
      'sun': 'SUN', 'surya': 'SUN',
      'moon': 'MOON', 'chandra': 'MOON',
      'mars': 'MARS', 'mangal': 'MARS',
      'mercury': 'MERCURY', 'budh': 'MERCURY',
      'jupiter': 'JUPITER', 'guru': 'JUPITER', 'brihaspati': 'JUPITER',
      'venus': 'VENUS', 'shukra': 'VENUS',
      'saturn': 'SATURN', 'shani': 'SATURN',
      'rahu': 'RAHU',
      'ketu': 'KETU'
    };
    
    for (const [key, planet] of Object.entries(planetMap)) {
      if (text.includes(key) && !planets.includes(planet)) {
        planets.push(planet);
      }
    }
    
    // Extract house numbers
    for (let i = 1; i <= 12; i++) {
      const patterns = [
        `${i}th house`, `house ${i}`, `house ${i}th`,
        `first house`, `second house`, `third house`, `fourth house`,
        `fifth house`, `sixth house`, `seventh house`, `eighth house`,
        `ninth house`, `tenth house`, `eleventh house`, `twelfth house`
      ];
      
      if (patterns.some(p => text.includes(p)) && !houses.includes(i)) {
        houses.push(i);
      }
    }
  }
  
  // If still no planets/houses, create a generic rule
  if (planets.length === 0) {
    planets = ['SUN', 'MOON', 'MARS', 'MERCURY', 'JUPITER', 'VENUS', 'SATURN', 'RAHU', 'KETU'];
  }
  if (houses.length === 0) {
    houses = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  }
  
  // Create neutral BASE rule
  const baseRule = {
    rule_id: `${pendingRule.source_book}__base_anchor_${pendingRule.rule_id}`,
    source_unit_id: pendingRule.source_unit_id,
    source_book: pendingRule.source_book,
    extraction_phase: 'PHASE1',
    rule_type: 'BASE',
    point_code: null,
    variant_code: `${pendingRule.source_book}__base_anchor_${pendingRule.rule_id}`,
    applicable_scopes: ['life_theme'],
    condition_tree: {
      planet_in_house: {
        planet_in: planets.slice(0, 3), // Limit to first 3 planets for specificity
        house_in: houses.slice(0, 3),  // Limit to first 3 houses for specificity
        match_mode: 'any',
        min_planets: 1
      }
    },
    effect_json: {
      theme: 'general',
      area: planets.length > 0 && houses.length > 0 ? 
        `${planets[0].toLowerCase()}_house_${houses[0]}` : 'general',
      trend: 'mixed',
      intensity: 0.4, // Neutral intensity
      tone: 'informational',
      trigger: 'natal',
      scenario: 'placement_association',
      outcome_text: `Planetary influences in these houses may affect various life areas. This is a structural anchor rule to support modifier rules.`,
      variant_meta: {
        tone: 'informational',
        confidence_level: 'MEDIUM',
        dominance: 'primary',
        certainty_note: 'System-generated BASE anchor to enable modifier rule execution. Created for structural completeness.',
        quality_status: 'SYSTEM_GENERATED',
        understanding_based: false,
        is_anchor: true
      },
      source: {
        book_id: pendingRule.source_book,
        anchor_for: pendingRule.rule_id
      }
    },
    base_weight: 0.7, // Lower weight for anchor rules
    base_rule_ids: null,
    canonical_meaning: `Generic BASE rule for ${planets.slice(0, 3).join(', ')} in houses ${houses.slice(0, 3).join(', ')}. Created as structural anchor.`,
    engine_status: 'READY',
    is_active: true
  };
  
  return baseRule;
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
    `Rules from ${bookId}`
  ]);
  
  return result.rows[0].id;
}

/**
 * Main resolution function
 */
async function resolvePendingOperators(bookId) {
  console.log(`\n🔧 RESOLVING PENDING_OPERATOR RULES: ${bookId}\n`);
  
  // Get all PENDING_OPERATOR rules
  const pendingRes = await query(`
    SELECT id, rule_id, source_book, source_unit_id, rule_type, 
           condition_tree, canonical_meaning, effect_json
    FROM rules
    WHERE source_book = $1 
      AND engine_status = 'PENDING_OPERATOR'
      AND is_active = TRUE
    ORDER BY id
  `, [bookId]);
  
  const pendingRules = pendingRes.rows;
  console.log(`Found ${pendingRules.length} PENDING_OPERATOR rules\n`);
  
  if (pendingRules.length === 0) {
    console.log('✅ No pending operators to resolve!\n');
    return;
  }
  
  // Group by planet-house combinations to avoid duplicates
  const baseAnchors = new Map();
  const anchorForRules = [];
  
  for (const pendingRule of pendingRules) {
    const baseAnchor = createBaseAnchor(pendingRule);
    
    // Create unique key for planet-house combination
    const key = `${baseAnchor.condition_tree.planet_in_house.planet_in.sort().join(',')}_${baseAnchor.condition_tree.planet_in_house.house_in.sort().join(',')}`;
    
    if (!baseAnchors.has(key)) {
      baseAnchors.set(key, baseAnchor);
    }
    
    anchorForRules.push({
      anchor_key: key,
      pending_rule_id: pendingRule.rule_id,
      pending_rule_type: pendingRule.rule_type
    });
  }
  
  console.log(`Creating ${baseAnchors.size} BASE anchor rules\n`);
  
  // Ingest BASE anchors
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    
    // Get or create rule group
    const ruleGroupId = await getOrCreateRuleGroup(bookId, client);
    
    let ingested = 0;
    let skipped = 0;
    
    for (const [key, baseAnchor] of baseAnchors.entries()) {
      try {
        // Check if already exists
        const existsRes = await client.query(`
          SELECT id FROM rules WHERE rule_id = $1
        `, [baseAnchor.rule_id]);
        
        if (existsRes.rows.length > 0) {
          skipped++;
          continue;
        }
        
        // Insert BASE anchor
        await client.query(`
          INSERT INTO rules (
            rule_group_id, rule_id, source_unit_id, source_book, extraction_phase,
            rule_type, point_code, variant_code, applicable_scopes,
            condition_tree, effect_json, base_weight, base_rule_ids,
            canonical_meaning, engine_status, is_active, name, description
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        `, [
          ruleGroupId,
          baseAnchor.rule_id,
          baseAnchor.source_unit_id,
          baseAnchor.source_book,
          baseAnchor.extraction_phase,
          baseAnchor.rule_type,
          baseAnchor.point_code,
          baseAnchor.variant_code,
          baseAnchor.applicable_scopes,
          JSON.stringify(baseAnchor.condition_tree),
          JSON.stringify(baseAnchor.effect_json),
          baseAnchor.base_weight,
          baseAnchor.base_rule_ids,
          baseAnchor.canonical_meaning,
          baseAnchor.engine_status,
          baseAnchor.is_active,
          baseAnchor.rule_id, // name
          baseAnchor.canonical_meaning // description
        ]);
        
        ingested++;
      } catch (err) {
        console.error(`Error ingesting anchor ${baseAnchor.rule_id}:`, err.message);
        skipped++;
      }
    }
    
    // Update PENDING_OPERATOR rules to READY
    // Note: We're not actually updating them here because they may still need base_rule_ids
    // The engine will handle this during execution
    
    await client.query('COMMIT');
    
    console.log(`✅ BASE anchors created:`);
    console.log(`   - Ingested: ${ingested}`);
    console.log(`   - Skipped (already exists): ${skipped}`);
    
    // Verify remaining pending
    const remainingRes = await query(`
      SELECT COUNT(*) as total
      FROM rules
      WHERE source_book = $1 
        AND engine_status = 'PENDING_OPERATOR'
        AND is_active = TRUE
    `, [bookId]);
    
    console.log(`\n📊 Remaining PENDING_OPERATOR: ${remainingRes.rows[0].total}`);
    console.log(`   Note: Rules may still show PENDING_OPERATOR until base_rule_ids are linked.\n`);
    
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// Run if called directly
const bookId = mustGetBookId(process.argv);
resolvePendingOperators(bookId).catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});

