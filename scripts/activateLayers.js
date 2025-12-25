#!/usr/bin/env node

/**
 * Activate Layers for Astrology Rules
 * 
 * Flexible script to activate and verify all layers (1-5) for any book.
 * 
 * Layers:
 * - Layer 1: BASE rules (planet_in_house)
 * - Layer 2: NAKSHATRA refinements (planet_in_nakshatra)
 * - Layer 3: DASHA activations (dasha_running)
 * - Layer 4: TRANSIT triggers (transit_planet_in_house)
 * - Layer 5: STRENGTH/YOGA modifiers (planet_strength, yoga_present)
 * 
 * Usage:
 *   node scripts/activateLayers.js [bookId] [--layers 1,2,5]
 *   node scripts/activateLayers.js lalkitab
 *   node scripts/activateLayers.js lalkitab --layers 1,5
 *   node scripts/activateLayers.js --all-books
 */

import { query, getClient } from '../config/db.js';
import { readJson } from './book/_shared.js';
import path from 'path';
import fs from 'fs';

// Layer definitions
const LAYERS = {
  1: {
    name: 'BASE (Planet in House)',
    ruleType: 'BASE',
    operator: 'planet_in_house',
    description: 'Planet position in houses'
  },
  2: {
    name: 'NAKSHATRA (Nakshatra Refinements)',
    ruleType: 'NAKSHATRA',
    operator: 'planet_in_nakshatra',
    description: 'Nakshatra-based refinements'
  },
  3: {
    name: 'DASHA (Dasha Activations)',
    ruleType: 'DASHA',
    operator: 'dasha_running',
    description: 'Dasha period activations'
  },
  4: {
    name: 'TRANSIT (Transit Triggers)',
    ruleType: 'TRANSIT',
    operator: 'transit_planet_in_house',
    description: 'Transit-based triggers'
  },
  5: {
    name: 'STRENGTH/YOGA (Modifiers)',
    ruleType: ['STRENGTH', 'YOGA'],
    operator: ['planet_strength', 'yoga_present'],
    description: 'Planet strength and yoga combinations'
  }
};

/**
 * Verify Layer 1: BASE rules
 */
async function verifyLayer1(client, bookId) {
  const layer = LAYERS[1];
  
  const res = await client.query(`
    SELECT COUNT(*) as total,
           COUNT(CASE WHEN condition_tree::jsonb ? $2 THEN 1 END) as has_operator,
           COUNT(CASE WHEN engine_status = 'READY' THEN 1 END) as ready,
           COUNT(CASE WHEN is_active = TRUE THEN 1 END) as active
    FROM rules
    WHERE source_book = $1 AND rule_type = $3
  `, [bookId, layer.operator, layer.ruleType]);
  
  const stats = res.rows[0];
  const isComplete = stats.has_operator == stats.total && 
                     stats.ready == stats.total && 
                     stats.active == stats.total;
  
  return {
    layer: 1,
    name: layer.name,
    total: parseInt(stats.total),
    hasOperator: parseInt(stats.has_operator),
    ready: parseInt(stats.ready),
    active: parseInt(stats.active),
    isComplete
  };
}

/**
 * Verify Layer 5: STRENGTH rules
 */
async function verifyLayer5Strength(client, bookId) {
  const res = await client.query(`
    SELECT COUNT(*) as total,
           COUNT(CASE WHEN condition_tree::jsonb ? 'planet_strength' THEN 1 END) as has_strength,
           COUNT(CASE WHEN condition_tree::jsonb ? 'generic_condition' THEN 1 END) as has_generic,
           COUNT(CASE WHEN engine_status = 'READY' THEN 1 END) as ready,
           COUNT(CASE WHEN is_active = TRUE THEN 1 END) as active
    FROM rules
    WHERE source_book = $1 AND rule_type = 'STRENGTH'
  `, [bookId]);
  
  const stats = res.rows[0];
  const isComplete = stats.has_strength == stats.total && 
                     stats.ready == stats.total && 
                     stats.active == stats.total;
  
  return {
    layer: 5,
    subLayer: 'STRENGTH',
    name: 'STRENGTH (Planet Strength)',
    total: parseInt(stats.total),
    hasOperator: parseInt(stats.has_strength),
    hasGeneric: parseInt(stats.has_generic),
    ready: parseInt(stats.ready),
    active: parseInt(stats.active),
    isComplete
  };
}

/**
 * Verify Layer 5: YOGA rules
 */
async function verifyLayer5Yoga(client, bookId) {
  const res = await client.query(`
    SELECT id, rule_id, condition_tree, engine_status, base_rule_ids
    FROM rules
    WHERE source_book = $1 AND rule_type = 'YOGA' AND is_active = TRUE
  `, [bookId]);
  
  let updated = 0;
  for (const rule of res.rows) {
    if (rule.engine_status !== 'PENDING_OPERATOR') {
      await client.query(
        `UPDATE rules SET engine_status = 'PENDING_OPERATOR' WHERE id = $1`,
        [rule.id]
      );
      updated++;
    }
  }
  
  const isComplete = false; // YOGA needs engine support
  
  return {
    layer: 5,
    subLayer: 'YOGA',
    name: 'YOGA (Yoga Combinations)',
    total: res.rowCount,
    ready: 0,
    pending: res.rowCount,
    updated,
    isComplete,
    note: 'Requires engine support for yoga_present operator'
  };
}

/**
 * Verify Layer 2: NAKSHATRA rules
 */
async function verifyLayer2(client, bookId) {
  const res = await client.query(`
    SELECT COUNT(*) as total,
           COUNT(CASE WHEN condition_tree::jsonb ? 'planet_in_nakshatra' THEN 1 END) as has_operator,
           COUNT(CASE WHEN engine_status = 'READY' THEN 1 END) as ready
    FROM rules
    WHERE source_book = $1 AND rule_type = 'NAKSHATRA' AND is_active = TRUE
  `, [bookId]);
  
  const stats = res.rows[0];
  
  return {
    layer: 2,
    name: LAYERS[2].name,
    total: parseInt(stats.total),
    hasOperator: parseInt(stats.has_operator),
    ready: parseInt(stats.ready),
    isComplete: stats.total > 0 && stats.has_operator == stats.total
  };
}

/**
 * Verify Layer 3: DASHA rules
 */
async function verifyLayer3(client, bookId) {
  const res = await client.query(`
    SELECT COUNT(*) as total,
           COUNT(CASE WHEN condition_tree::jsonb ? 'dasha_running' THEN 1 END) as has_operator,
           COUNT(CASE WHEN engine_status = 'READY' THEN 1 END) as ready
    FROM rules
    WHERE source_book = $1 AND rule_type = 'DASHA' AND is_active = TRUE
  `, [bookId]);
  
  const stats = res.rows[0];
  
  return {
    layer: 3,
    name: LAYERS[3].name,
    total: parseInt(stats.total),
    hasOperator: parseInt(stats.has_operator),
    ready: parseInt(stats.ready),
    isComplete: stats.total > 0 && stats.has_operator == stats.total
  };
}

/**
 * Verify Layer 4: TRANSIT rules
 */
async function verifyLayer4(client, bookId) {
  const res = await client.query(`
    SELECT COUNT(*) as total,
           COUNT(CASE WHEN condition_tree::jsonb ? 'transit_planet_in_house' THEN 1 END) as has_operator,
           COUNT(CASE WHEN engine_status = 'READY' THEN 1 END) as ready
    FROM rules
    WHERE source_book = $1 AND rule_type = 'TRANSIT' AND is_active = TRUE
  `, [bookId]);
  
  const stats = res.rows[0];
  
  return {
    layer: 4,
    name: LAYERS[4].name,
    total: parseInt(stats.total),
    hasOperator: parseInt(stats.has_operator),
    ready: parseInt(stats.ready),
    isComplete: stats.total > 0 && stats.has_operator == stats.total
  };
}

/**
 * Main function
 */
async function activateLayers(bookId = 'lalkitab', layersToCheck = [1, 5]) {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    
    console.log(`\n🔄 Activating Layers for: ${bookId}\n`);
    console.log(`Layers to check: ${layersToCheck.join(', ')}\n`);
    
    const results = [];
    
    // Layer 1: BASE
    if (layersToCheck.includes(1)) {
      console.log(`=== ${LAYERS[1].name} ===`);
      const result = await verifyLayer1(client, bookId);
      results.push(result);
      console.log(`Total: ${result.total}`);
      console.log(`Using ${LAYERS[1].operator}: ${result.hasOperator}`);
      console.log(`READY: ${result.ready}`);
      console.log(`Active: ${result.active}`);
      console.log(result.isComplete ? '✅ COMPLETE\n' : '⚠️  Needs attention\n');
    }
    
    // Layer 2: NAKSHATRA
    if (layersToCheck.includes(2)) {
      console.log(`=== ${LAYERS[2].name} ===`);
      const result = await verifyLayer2(client, bookId);
      results.push(result);
      console.log(`Total: ${result.total}`);
      console.log(`Using ${LAYERS[2].operator}: ${result.hasOperator}`);
      console.log(`READY: ${result.ready}`);
      console.log(result.isComplete ? '✅ COMPLETE\n' : '⚠️  No data or incomplete\n');
    }
    
    // Layer 3: DASHA
    if (layersToCheck.includes(3)) {
      console.log(`=== ${LAYERS[3].name} ===`);
      const result = await verifyLayer3(client, bookId);
      results.push(result);
      console.log(`Total: ${result.total}`);
      console.log(`Using ${LAYERS[3].operator}: ${result.hasOperator}`);
      console.log(`READY: ${result.ready}`);
      console.log(result.isComplete ? '✅ COMPLETE\n' : '⚠️  No data or incomplete\n');
    }
    
    // Layer 4: TRANSIT
    if (layersToCheck.includes(4)) {
      console.log(`=== ${LAYERS[4].name} ===`);
      const result = await verifyLayer4(client, bookId);
      results.push(result);
      console.log(`Total: ${result.total}`);
      console.log(`Using ${LAYERS[4].operator}: ${result.hasOperator}`);
      console.log(`READY: ${result.ready}`);
      console.log(result.isComplete ? '✅ COMPLETE\n' : '⚠️  No data or incomplete\n');
    }
    
    // Layer 5: STRENGTH/YOGA
    if (layersToCheck.includes(5)) {
      console.log(`=== ${LAYERS[5].name} ===`);
      
      // STRENGTH
      const strengthResult = await verifyLayer5Strength(client, bookId);
      results.push(strengthResult);
      console.log(`\nSTRENGTH:`);
      console.log(`  Total: ${strengthResult.total}`);
      console.log(`  Using planet_strength: ${strengthResult.hasOperator}`);
      console.log(`  READY: ${strengthResult.ready}`);
      console.log(strengthResult.isComplete ? '  ✅ COMPLETE' : '  ⚠️  Needs attention');
      
      // YOGA
      const yogaResult = await verifyLayer5Yoga(client, bookId);
      results.push(yogaResult);
      console.log(`\nYOGA:`);
      console.log(`  Total: ${yogaResult.total}`);
      console.log(`  READY: ${yogaResult.ready}`);
      console.log(`  PENDING_OPERATOR: ${yogaResult.pending}`);
      if (yogaResult.updated > 0) {
        console.log(`  ✅ Updated ${yogaResult.updated} rules`);
      }
      if (yogaResult.note) {
        console.log(`  Note: ${yogaResult.note}`);
      }
      console.log('');
    }
    
    // Final Summary
    console.log('=== FINAL SUMMARY ===\n');
    
    const summaryRes = await client.query(`
      SELECT 
        rule_type,
        COUNT(*) as total,
        COUNT(CASE WHEN engine_status = 'READY' THEN 1 END) as ready,
        COUNT(CASE WHEN engine_status = 'PENDING_OPERATOR' THEN 1 END) as pending
      FROM rules
      WHERE source_book = $1 AND is_active = TRUE
      GROUP BY rule_type
      ORDER BY rule_type
    `, [bookId]);
    
    summaryRes.rows.forEach(row => {
      console.log(`${row.rule_type}:`);
      console.log(`  Total: ${row.total}`);
      console.log(`  READY: ${row.ready}`);
      console.log(`  PENDING_OPERATOR: ${row.pending}`);
    });
    
    const completeLayers = results.filter(r => r.isComplete).map(r => r.layer).filter((v, i, a) => a.indexOf(v) === i);
    const incompleteLayers = results.filter(r => !r.isComplete).map(r => r.layer).filter((v, i, a) => a.indexOf(v) === i);
    
    console.log(`\n✅ Complete layers: ${completeLayers.length > 0 ? completeLayers.join(', ') : 'None'}`);
    console.log(`⚠️  Incomplete layers: ${incompleteLayers.length > 0 ? incompleteLayers.join(', ') : 'None'}`);
    
    await client.query('COMMIT');
    console.log('\n✅ Layer activation check complete!\n');
    process.exit(0);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('\n❌ Error:', err.message);
    console.error('Stack:', err.stack);
    process.exit(1);
  } finally {
    client.release();
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
let bookId = 'lalkitab';
let layersToCheck = [1, 5];

if (args.length > 0) {
  if (args[0] !== '--all-books' && !args[0].startsWith('--')) {
    bookId = args[0];
  }
  
  const layersIndex = args.findIndex(arg => arg === '--layers');
  if (layersIndex !== -1 && args[layersIndex + 1]) {
    layersToCheck = args[layersIndex + 1].split(',').map(n => parseInt(n)).filter(n => !isNaN(n));
  }
}

activateLayers(bookId, layersToCheck);
