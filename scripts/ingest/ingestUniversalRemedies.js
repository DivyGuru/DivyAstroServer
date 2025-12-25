#!/usr/bin/env node

/**
 * UNIVERSAL REMEDIES INGESTION
 * 
 * Ingest remedies from universal extraction (remedies.universal.v1.json)
 * 
 * Usage: node scripts/ingest/ingestUniversalRemedies.js <bookId>
 */

import { getClient } from '../../config/db.js';
import { mustGetBookId, getPathsForBook, readJson } from '../book/_shared.js';
import path from 'path';
import fs from 'fs';

/**
 * Convert planet names to IDs
 */
function convertPlanetNamesToIds(planetNames) {
  if (!planetNames || !Array.isArray(planetNames)) {
    return null;
  }
  
  const planetMap = {
    'SUN': 0, 'MOON': 1, 'MARS': 2, 'MERCURY': 3,
    'JUPITER': 4, 'VENUS': 5, 'SATURN': 6, 'RAHU': 7, 'KETU': 8
  };
  
  return planetNames
    .map(p => planetMap[p?.toUpperCase()])
    .filter(id => id !== undefined);
}

/**
 * Map remedy category to DB type
 */
function mapRemedyType(category) {
  const typeMap = {
    'donation': 'donation',
    'feeding': 'feeding_beings',
    'behavior': 'meditation', // Behavioral advice as meditation
    'symbolic': 'puja', // Symbolic acts as puja
    'worship': 'puja',
    'mantra': 'mantra',
    'fast': 'fast',
    'unknown': 'donation' // Default to donation
  };
  
  return typeMap[category] || 'donation';
}

/**
 * Ingest universal remedies
 */
async function ingestUniversalRemedies(bookId, paths, client) {
  const remediesPath = path.join(paths.processedDir, 'remedies.universal.v1.json');
  
  if (!fs.existsSync(remediesPath)) {
    console.log(`   ⚠️  No universal remedies file found: ${remediesPath}`);
    return { ingested: 0, skipped: 0, byCategory: {} };
  }
  
  const data = await readJson(remediesPath);
  const remedies = data.remedies || [];
  
  console.log(`   📋 Loading ${remedies.length} universal remedies...`);
  
  let ingested = 0;
  let skipped = 0;
  const byCategory = {};
  
  for (const remedy of remedies) {
    try {
      // Convert to DB format
      const remedyName = remedy.remedy_text?.substring(0, 200) || `Remedy from ${bookId}`;
      const remedyType = mapRemedyType(remedy.remedy_category);
      const remedyDescription = remedy.remedy_text || remedy.condition_text?.substring(0, 500) || '';
      const targetPlanets = convertPlanetNamesToIds(remedy.planet || []);
      
      // Create unique identifier
      const remedyId = `${bookId}__universal_remedy_${remedy.source?.chunk_id || Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Check if exists (by checking description similarity or source)
      const existsRes = await client.query(`
        SELECT id FROM remedies 
        WHERE description LIKE $1 
        LIMIT 1
      `, [`%${remedyDescription.substring(0, 50)}%`]);
      
      if (existsRes.rows.length > 0) {
        // Update existing
        await client.query(`
          UPDATE remedies
          SET name = $1,
              type = $2,
              description = $3,
              target_planets = $4,
              is_active = $5
          WHERE id = $6
        `, [
          remedyName,
          remedyType,
          remedyDescription,
          targetPlanets,
          true,
          existsRes.rows[0].id
        ]);
        
        ingested++;
        byCategory[remedy.remedy_category] = (byCategory[remedy.remedy_category] || 0) + 1;
      } else {
        // Insert new
        await client.query(`
          INSERT INTO remedies (
            name, type, description, target_planets, target_themes,
            min_duration_days, recommended_frequency, safety_notes, is_active
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING id
        `, [
          remedyName,
          remedyType,
          remedyDescription,
          targetPlanets,
          null, // target_themes
          null, // min_duration_days
          null, // recommended_frequency
          `Universal knowledge extraction from ${bookId}. Confidence: ${remedy.confidence_level || 'MEDIUM'}. Source: ${remedy.source?.chunk_id || 'unknown'}`,
          true
        ]);
        
        ingested++;
        byCategory[remedy.remedy_category] = (byCategory[remedy.remedy_category] || 0) + 1;
      }
    } catch (err) {
      console.error(`   ❌ Error ingesting remedy:`, err.message);
      skipped++;
    }
  }
  
  return { ingested, skipped, byCategory };
}

/**
 * Main function
 */
async function main() {
  const bookId = mustGetBookId(process.argv);
  
  console.log(`\n📥 UNIVERSAL REMEDIES INGESTION: ${bookId}\n`);
  
  const paths = getPathsForBook(bookId);
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    
    // Ingest universal remedies
    console.log('📋 Ingesting universal remedies...');
    const results = await ingestUniversalRemedies(bookId, paths, client);
    
    console.log(`\n✅ Ingestion complete:`);
    console.log(`   - Ingested: ${results.ingested}`);
    console.log(`   - Skipped: ${results.skipped}`);
    console.log(`\n📊 By category:`);
    for (const [category, count] of Object.entries(results.byCategory)) {
      if (count > 0) {
        console.log(`   ${category}: ${count}`);
      }
    }
    
    await client.query('COMMIT');
    
    // Verify
    const verifyRes = await client.query(`
      SELECT COUNT(*) as total
      FROM remedies
      WHERE is_active = TRUE
    `);
    
    console.log(`\n✅ Verification:`);
    console.log(`   Total remedies in DB: ${verifyRes.rows[0].total}`);
    
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});

