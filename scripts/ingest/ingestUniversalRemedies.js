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
 * Extract themes from remedy description
 * Maps remedy text to prediction_theme enum values
 */
function extractThemesFromDescription(description) {
  if (!description || typeof description !== 'string') {
    return null;
  }
  
  const text = description.toLowerCase();
  const themes = [];
  
  // Money/Finance keywords
  if (text.includes('money') || text.includes('wealth') || text.includes('finance') || 
      text.includes('धन') || text.includes('पैसा') || text.includes('आर्थिक') ||
      text.includes('donation') || text.includes('charity') || text.includes('दान')) {
    themes.push('money');
  }
  
  // Career keywords
  if (text.includes('career') || text.includes('job') || text.includes('work') ||
      text.includes('करियर') || text.includes('नौकरी') || text.includes('काम') ||
      text.includes('business') || text.includes('व्यापार')) {
    themes.push('career');
  }
  
  // Relationship keywords
  if (text.includes('relationship') || text.includes('marriage') || text.includes('love') ||
      text.includes('संबंध') || text.includes('विवाह') || text.includes('प्रेम') ||
      text.includes('partner') || text.includes('साथी')) {
    themes.push('relationship');
  }
  
  // Health keywords
  if (text.includes('health') || text.includes('disease') || text.includes('illness') ||
      text.includes('स्वास्थ्य') || text.includes('रोग') || text.includes('बीमारी') ||
      text.includes('body') || text.includes('शरीर')) {
    themes.push('health');
  }
  
  // Family keywords
  if (text.includes('family') || text.includes('children') || text.includes('parents') ||
      text.includes('परिवार') || text.includes('बच्चे') || text.includes('माता-पिता') ||
      text.includes('home') || text.includes('घर')) {
    themes.push('family');
  }
  
  // Spirituality keywords
  if (text.includes('spiritual') || text.includes('meditation') || text.includes('prayer') ||
      text.includes('आध्यात्मिक') || text.includes('ध्यान') || text.includes('प्रार्थना') ||
      text.includes('mantra') || text.includes('मंत्र') || text.includes('puja') || text.includes('पूजा')) {
    themes.push('spirituality');
  }
  
  // Education keywords
  if (text.includes('education') || text.includes('learning') || text.includes('study') ||
      text.includes('शिक्षा') || text.includes('पढ़ाई') || text.includes('ज्ञान')) {
    themes.push('education');
  }
  
  // Travel keywords
  if (text.includes('travel') || text.includes('journey') || text.includes('trip') ||
      text.includes('यात्रा') || text.includes('सफर')) {
    themes.push('travel');
  }
  
  // If no specific theme found, default to 'general'
  if (themes.length === 0) {
    themes.push('general');
  }
  
  // Return unique themes
  return [...new Set(themes)];
}

/**
 * Map remedy category to DB type
 * 
 * FIXED: Only map to 'meditation' if source text actually contains meditation terms.
 * Previously, all 'behavior' category remedies were incorrectly mapped to 'meditation'.
 */
function mapRemedyType(category, remedyText = '') {
  // If behavior category, check if it's actually meditation
  if (category === 'behavior') {
    const text = (remedyText || '').toLowerCase();
    // Check for meditation-specific terms
    if (text.includes('ध्यान') || 
        text.includes('meditation') || 
        text.includes('meditate') ||
        text.includes('dhyan') ||
        text.includes('समाधि')) {
      return 'meditation';
    }
    // Otherwise, treat as generic behavior advice (map to donation)
    return 'donation';
  }
  
  const typeMap = {
    'donation': 'donation',
    'feeding': 'feeding_beings',
    // FIXED: Only map 'symbolic' to 'puja' if it actually mentions worship/prayer
    // Otherwise, symbolic acts (gemstones, yantras) are more like donation
    'symbolic': remedyText && (
      remedyText.toLowerCase().includes('puja') ||
      remedyText.toLowerCase().includes('worship') ||
      remedyText.toLowerCase().includes('पूजा') ||
      remedyText.toLowerCase().includes('prayer')
    ) ? 'puja' : 'donation',
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
      const remedyDescription = remedy.remedy_text || remedy.condition_text?.substring(0, 500) || '';
      // Pass remedy text to mapRemedyType for proper type detection (meditation, symbolic→puja check)
      const remedyType = mapRemedyType(remedy.remedy_category, remedyDescription);
      const targetPlanets = convertPlanetNamesToIds(remedy.planet || []);
      // Extract themes from description
      const targetThemes = extractThemesFromDescription(remedyDescription);
      
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
              target_themes = $5,
              is_active = $6
          WHERE id = $7
        `, [
          remedyName,
          remedyType,
          remedyDescription,
          targetPlanets,
          targetThemes,
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
          targetThemes, // Extract themes from description
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

