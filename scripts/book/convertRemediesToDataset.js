#!/usr/bin/env node

/**
 * Convert Remedies to Dataset
 * 
 * Converts understood remedies into engine-safe remedy dataset.
 * 
 * STRICT RULES:
 * - Do NOT modify description
 * - Convert ONLY remedies with confidence=high
 * - Validate English-only
 * - No fear language
 * - No guarantees
 * 
 * Usage: node scripts/book/convertRemediesToDataset.js <bookId>
 */

import { mustGetBookId, getPathsForBook, readJson, writeJson, nowIso, assertEnglishOnly } from './_shared.js';
import path from 'path';

/**
 * Validate remedy object
 */
function validateRemedy(remedy) {
  const errors = [];
  
  if (!remedy.remedy_data) {
    errors.push("remedy_data missing");
    return errors;
  }
  
  const data = remedy.remedy_data;
  
  // Required fields
  if (!data.remedy_type) {
    errors.push("remedy_type missing");
  }
  
  if (!data.title) {
    errors.push("title missing");
  }
  
  if (!data.description) {
    errors.push("description missing");
  }
  
  // Validate English-only
  try {
    assertEnglishOnly("description", data.description);
    assertEnglishOnly("title", data.title);
  } catch (err) {
    errors.push(`Non-English text: ${err.message}`);
  }
  
  // Check for fear language
  const fearPatterns = ['death', 'die', 'destroy', 'divorce', 'separation', 'disease', 'illness', 'accident', 'loss', 'otherwise'];
  const lowerText = (data.description || '').toLowerCase();
  if (fearPatterns.some(pattern => lowerText.includes(pattern))) {
    errors.push("Contains fear-based language");
  }
  
  // Check for absolute guarantees
  const guaranteePatterns = ['will', 'must', 'always', 'never', 'guaranteed', 'certain', 'surely'];
  if (guaranteePatterns.some(pattern => lowerText.includes(pattern))) {
    errors.push("Contains absolute guarantees");
  }
  
  // Validate remedy type
  const validTypes = ['mantra', 'meditation', 'donation', 'feeding_beings', 'fast', 'puja'];
  if (!validTypes.includes(data.remedy_type)) {
    errors.push(`Invalid remedy_type: ${data.remedy_type}`);
  }
  
  return errors;
}

/**
 * Convert remedy to dataset format
 */
function convertRemedyToDataset(remedy, bookId) {
  const { remedy_id, remedy_data, confidence, source } = remedy;
  
  // CONTENT-DEPTH-FIRST: Accept ALL usable remedies (high, medium, low)
  // Express uncertainty via language, not rejection
  // Only skip if truly meaningless
  if (!confidence || confidence === 'rejected') {
    return null;
  }
  
  // All confidence levels (high, medium, low) are acceptable
  // Language will be adjusted based on confidence in description
  
  // STRICT: Must have understanding metadata
  if (!remedy_data.understanding_metadata) {
    return null;
  }
  
  const understanding = remedy_data.understanding_metadata;
  
  // STRICT: Reject if purpose unclear or context missing
  if (!understanding.purpose_clear || !understanding.context_present) {
    return null;
  }
  
  // Validate
  const errors = validateRemedy(remedy);
  if (errors.length > 0) {
    return null;
  }
  
  return {
    id: remedy_id,
    name: remedy_data.title,
    type: remedy_data.remedy_type,
    description: remedy_data.description, // STRICT: Use as-is, do NOT modify
    target_planets: remedy_data.target_planets || [],
    target_themes: remedy_data.target_themes || ['general'],
    min_duration_days: remedy_data.min_duration_days || null,
    recommended_frequency: remedy_data.recommended_frequency || null,
    safety_notes: remedy_data.safety_notes || "This is a traditional practice. Please consult with a qualified practitioner if you have any concerns.",
    is_active: true,
    // Understanding metadata (CRITICAL for DB storage)
    understanding_metadata: {
      target_domains: understanding.target_domains || [],
      effect_type: understanding.effect_type || 'supportive',
      applicability: understanding.applicability || 'conditional',
      intensity: understanding.intensity || 'light',
      confidence: understanding.confidence || 'high',
      purpose_clear: understanding.purpose_clear,
      context_present: understanding.context_present
    },
    source: {
      book_id: bookId,
      unit_id: source.unit_id,
      meaning_id: source.meaning_id,
      extraction_phase: 'PHASE1' // Content-first understanding phase
    }
  };
}

/**
 * Main conversion function
 */
async function convertRemediesToDataset(bookId) {
  console.log(`\n🔄 Convert Remedies to Dataset for ${bookId}\n`);
  
  const paths = getPathsForBook(bookId);
  
  // Load remedies
  const remediesPath = path.join(paths.processedDir, 'remedies.v1.json');
  let remedies;
  try {
    remedies = await readJson(remediesPath);
  } catch (err) {
    console.log(`⚠️  No remedies file found: ${remediesPath}`);
    console.log(`   Creating empty dataset.\n`);
    remedies = { remedies: [] };
  }
  
  console.log(`Loaded ${remedies.total_remedies || 0} remedies\n`);
  
  const datasetRemedies = [];
  const skipped = [];
  
  for (const remedy of remedies.remedies || []) {
    try {
      const datasetRemedy = convertRemedyToDataset(remedy, bookId);
      
      if (datasetRemedy) {
        datasetRemedies.push(datasetRemedy);
      } else {
        skipped.push({
          remedy_id: remedy.remedy_id,
          reason: remedy.confidence !== 'high' ? 
            'confidence not high' : 
            'validation failed'
        });
      }
    } catch (err) {
      skipped.push({
        remedy_id: remedy.remedy_id,
        reason: `Error: ${err.message}`
      });
    }
  }
  
  // Write dataset
  const datasetPath = path.join(paths.datasetsDir, 'remedies.v1.json');
  const dataset = {
    schema_version: 1,
    book_id: bookId,
    created_at: nowIso(),
    source_remedies_file: path.relative(paths.root, remediesPath),
    total_remedies: remedies.total_remedies || 0,
    total_converted: datasetRemedies.length,
    total_skipped: skipped.length,
    remedies: datasetRemedies
  };
  
  await writeJson(datasetPath, dataset);
  
  // Write skipped log
  const skippedPath = path.join(paths.processedDir, 'remedy_conversion_skipped.v1.json');
  await writeJson(skippedPath, {
    schema_version: 1,
    book_id: bookId,
    created_at: nowIso(),
    skipped: skipped
  });
  
  console.log(`✅ Conversion complete:`);
  console.log(`   - Remedies converted: ${datasetRemedies.length}`);
  console.log(`   - Skipped: ${skipped.length}`);
  console.log(`   - Output: ${datasetPath}\n`);
  
  // Summary by type
  const byType = {};
  for (const remedy of datasetRemedies) {
    const type = remedy.type || 'UNKNOWN';
    byType[type] = (byType[type] || 0) + 1;
  }
  
  console.log('📊 Remedies by type:');
  for (const [type, count] of Object.entries(byType)) {
    console.log(`   - ${type}: ${count}`);
  }
  
  return {
    converted: datasetRemedies.length,
    skipped: skipped.length
  };
}

const bookId = mustGetBookId(process.argv);
convertRemediesToDataset(bookId).catch(err => {
  console.error('❌ Conversion failed:', err.message);
  process.exit(1);
});

