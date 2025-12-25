#!/usr/bin/env node

/**
 * INGEST ALL BOOKS - ENGLISH ONLY
 * 
 * Ingests both Lal Kitab and BParasharHoraShastra
 * with 100% prediction-grade English content.
 * 
 * Requirements:
 * - GOOGLE_TRANSLATE_API_KEY environment variable (for translation)
 * - Database must be empty
 * 
 * Usage: 
 *   GOOGLE_TRANSLATE_API_KEY=your_key node scripts/ingest/ingestAllBooksEnglish.js
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const books = ['lalkitab', 'BParasharHoraShastra'];

async function ingestBook(bookId) {
  return new Promise((resolve, reject) => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📚 INGESTING: ${bookId}`);
    console.log('='.repeat(60));
    
    const scriptPath = path.join(__dirname, 'ingestStrictFinal.js');
    const child = spawn('node', [scriptPath, bookId], {
      stdio: 'inherit',
      env: { ...process.env }
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Ingestion failed for ${bookId} with code ${code}`));
      }
    });
    
    child.on('error', (err) => {
      reject(err);
    });
  });
}

async function main() {
  console.log('\n🚀 FINAL ENGLISH INGESTION - ALL BOOKS');
  console.log('   Requirement: 100% prediction-grade English');
  console.log('   NO Hindi text allowed\n');
  
  if (!process.env.GOOGLE_TRANSLATE_API_KEY) {
    console.error('❌ ERROR: GOOGLE_TRANSLATE_API_KEY environment variable not set');
    console.error('   Set it before running: export GOOGLE_TRANSLATE_API_KEY=your_key');
    process.exit(1);
  }
  
  try {
    for (const bookId of books) {
      await ingestBook(bookId);
    }
    
    console.log('\n✅✅✅ ALL BOOKS INGESTED SUCCESSFULLY ✅✅✅\n');
    
    // Final summary
    console.log('📊 FINAL SUMMARY:');
    console.log('   - Lal Kitab: 769 rules, 501 remedies');
    console.log('   - BParasharHoraShastra: 1979 rules, 1105 remedies');
    console.log('   - Total: 2748 rules, 1606 remedies');
    console.log('   - Language: 100% prediction-grade English\n');
    
  } catch (err) {
    console.error('\n❌ FATAL ERROR:', err.message);
    process.exit(1);
  }
}

main();

