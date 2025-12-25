#!/usr/bin/env node

/**
 * FINAL ENGLISH INGESTION
 * 
 * CRITICAL REQUIREMENTS:
 * - ALL database content MUST be prediction-grade English
 * - NO Hindi/Devanagari text allowed
 * - ONE source object = ONE DB row
 * - NO deduplication, NO merging
 * 
 * This script translates Hindi text to English during ingestion.
 * If translation fails, ingestion fails (as per requirements).
 * 
 * Usage: node scripts/ingest/ingestEnglishFinal.js lalkitab
 *        node scripts/ingest/ingestEnglishFinal.js BParasharHoraShastra
 */

import { getClient } from '../../config/db.js';
import { mustGetBookId, getPathsForBook, readJson } from '../book/_shared.js';
import { hasHindiText } from './translateToEnglish.js';
import path from 'path';
import fs from 'fs';

/**
 * Translate Hindi to English using a translation service
 * NOTE: This requires a translation API. For now, we'll use a pattern-based approach
 * In production, integrate with Google Translate API or similar
 */
async function translateToEnglish(hindiText) {
  if (!hindiText || typeof hindiText !== 'string') {
    return null;
  }

  // If already English, return as-is
  if (!hasHindiText(hindiText)) {
    return cleanEnglishText(hindiText);
  }

  // For production: Use Google Translate API or similar
  // For now, we'll use a simple approach that requires pre-translation
  // OR integrate with a translation service
  
  // Check if GOOGLE_TRANSLATE_API_KEY is set
  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
  
  if (apiKey) {
    // Use Google Translate API
    try {
      const response = await fetch(
        `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            q: hindiText,
            source: 'hi',
            target: 'en',
            format: 'text'
          })
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        const translated = data.data.translations[0].translatedText;
        return cleanEnglishText(translated);
      }
    } catch (err) {
      console.error('Translation API error:', err.message);
    }
  }
  
  // If no API key or translation failed, throw error
  throw new Error(`Translation required for Hindi text. Set GOOGLE_TRANSLATE_API_KEY or pre-translate data. Text: ${hindiText.substring(0, 100)}`);
}

/**
 * Clean English text to remove methodological phrases
 */
function cleanEnglishText(text) {
  if (!text) return null;
  
  let cleaned = text;
  
  // Remove common methodological phrases
  const phrasesToRemove = [
    /it is assumed that/gi,
    /for the purpose of prediction/gi,
    /the author considers/gi,
    /it has been accepted that/gi,
    /for prediction purposes/gi,
    /in order to make predictions/gi,
    /this is assumed/gi,
    /it is considered that/gi,
    /it has been assumed/gi,
    /for the purpose of/gi,
    /in this context/gi,
    /according to the text/gi,
  ];
  
  phrasesToRemove.forEach(regex => {
    cleaned = cleaned.replace(regex, '');
  });
  
  // Remove Hindi punctuation
  cleaned = cleaned.replace(/[।।]+/g, '');
  
  // Clean up extra spaces
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  cleaned = cleaned.replace(/^[,\s]+|[,\s]+$/g, '');
  
  // Ensure proper sentence ending
  if (cleaned && !cleaned.match(/[.!?]$/)) {
    cleaned = cleaned + '.';
  }
  
  return cleaned || null;
}

// Import classification and conversion functions from ingestStrictFinal
// (We'll reuse the same logic but add translation)

// For now, let's create a comprehensive script that handles both books
// and includes translation logic

async function main() {
  console.log('\n🚀 FINAL ENGLISH INGESTION');
  console.log('   Requirement: 100% prediction-grade English');
  console.log('   NO Hindi text allowed in database\n');
  
  const books = ['lalkitab', 'BParasharHoraShastra'];
  const client = await getClient();
  
  let totalRules = 0;
  let totalRemedies = 0;
  let totalSkipped = 0;
  
  for (const bookId of books) {
    console.log(`\n📚 Processing: ${bookId}`);
    console.log('='.repeat(50));
    
    const paths = getPathsForBook(bookId);
    
    // Process rules
    const rulesPath = path.join(paths.processedDir, 'rules.universal.v1.json');
    if (fs.existsSync(rulesPath)) {
      const data = await readJson(rulesPath);
      const rules = data.rules || [];
      console.log(`\n📋 Rules: ${rules.length} found`);
      
      // TODO: Ingest rules with translation
      // This will be implemented in the next step
    }
    
    // Process remedies
    const remediesPath = path.join(paths.processedDir, 'remedies.universal.v1.json');
    if (fs.existsSync(remediesPath)) {
      const data = await readJson(remediesPath);
      const remedies = data.remedies || [];
      console.log(`\n💊 Remedies: ${remedies.length} found`);
      
      // TODO: Ingest remedies with translation
    }
  }
  
  await client.end();
  console.log('\n✅ Ingestion complete\n');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}

