#!/usr/bin/env node

/**
 * REMEDY-ONLY EXTRACTION PASS
 * 
 * IGNORE all rules, predictions, yogas, strength analysis.
 * Focus ONLY on remedies, actions, behavioral advice, symbolic acts.
 * 
 * MAXIMUM remedy extraction - target 100+
 * Low confidence is NOT a reason to skip.
 * 
 * Usage: node scripts/book/extractRemediesOnly.js lalkitab
 */

import { mustGetBookId, getPathsForBook, readJson, writeJson, nowIso } from './_shared.js';
import path from 'path';

/**
 * Hindi remedy keywords - comprehensive list
 */
const REMEDY_KEYWORDS = {
  donation: [
    'दान', 'देने', 'देना चाहिए', 'दान करें', 'दान करना', 'दान करो',
    'दे दो', 'दे देना', 'दान कर', 'दान करे', 'दान करेंगे',
    'सोना दान', 'चांदी दान', 'गाय दान', 'भूमि दान', 'वस्त्र दान'
  ],
  feeding: [
    'खिलाना', 'खाना देना', 'खिलाएं', 'खिलाओ', 'खिलाने',
    'पशु', 'पक्षी', 'गाय', 'कुत्ता', 'कौआ', 'चींटी',
    'गरीब', 'बच्चे', 'भूखे', 'भोजन देना', 'रोटी देना',
    'चावल देना', 'दूध देना', 'पानी देना'
  ],
  behavior: [
    'करना चाहिए', 'नहीं करना', 'छोड़ देना', 'त्याग देना',
    'बदलना', 'सुधारना', 'सही करना', 'ऐसा करने से',
    'ऐसा न करें', 'इससे बचें', 'इससे दूर रहें'
  ],
  symbolic: [
    'फेंक देना', 'दफन करना', 'दबा देना', 'रखना', 'पहनना',
    'धारण करना', 'रत्न', 'यंत्र', 'ताबीज', 'मूर्ति',
    'तुलसी', 'पीपल', 'नीम', 'गंगाजल', 'रुद्राक्ष'
  ],
  worship: [
    'पूजा', 'आरती', 'अर्चना', 'प्रार्थना', 'भजन',
    'कीर्तन', 'सत्संग', 'मंदिर', 'देवता', 'देवी'
  ],
  mantra: [
    'मंत्र', 'जप', 'जाप', 'स्मरण', 'नाम जप',
    'मंत्र जप', 'मंत्रोच्चार', 'रुद्राक्ष जप'
  ],
  fast: [
    'व्रत', 'उपवास', 'निराहार', 'एक समय भोजन',
    'व्रत रखना', 'उपवास करना', 'व्रत करें'
  ]
};

/**
 * Detect remedy category from text
 */
function detectRemedyCategory(text) {
  const lowerText = text.toLowerCase();
  const categories = [];
  
  for (const [category, keywords] of Object.entries(REMEDY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        categories.push(category);
        break; // Found one keyword for this category, move to next
      }
    }
  }
  
  // If no specific category found, check for general remedy indicators
  if (categories.length === 0) {
    const generalIndicators = [
      'नुकसान कम', 'फायदा', 'लाभ', 'सुधार', 'ठीक होना',
      'समस्या दूर', 'कष्ट कम', 'दुख कम', 'शांति', 'सुख'
    ];
    
    for (const indicator of generalIndicators) {
      if (lowerText.includes(indicator)) {
        categories.push('unknown');
        break;
      }
    }
  }
  
  return categories.length > 0 ? categories[0] : 'unknown';
}

/**
 * Extract remedy text from source
 */
function extractRemedyText(text, category) {
  // Try to find the actual remedy instruction
  // Look for patterns like "X करें", "X देना", "X खिलाना", etc.
  
  const patterns = {
    donation: /(?:दान|देने|देना)[^\।]*/gi,
    feeding: /(?:खिलाना|खाना देना|दूध|रोटी)[^\।]*/gi,
    behavior: /(?:करना|न करना|छोड़|त्याग)[^\।]*/gi,
    symbolic: /(?:फेंक|दफन|रखना|पहनना|धारण)[^\।]*/gi,
    worship: /(?:पूजा|आरती|अर्चना)[^\।]*/gi,
    mantra: /(?:मंत्र|जप|जाप|स्मरण)[^\।]*/gi,
    fast: /(?:व्रत|उपवास|निराहार)[^\।]*/gi,
    unknown: /(?:करने से|नुकसान कम|फायदा|लाभ)[^\।]*/gi
  };
  
  const pattern = patterns[category] || patterns.unknown;
  const matches = text.match(pattern);
  
  if (matches && matches.length > 0) {
    return matches[0].trim();
  }
  
  // Fallback: return first sentence that contains remedy keywords
  const sentences = text.split(/[।\.]/);
  for (const sentence of sentences) {
    if (sentence.length > 10 && sentence.length < 200) {
      return sentence.trim();
    }
  }
  
  // Last resort: return truncated text
  return text.substring(0, 200).trim();
}

/**
 * Extract planets and houses from text (if mentioned)
 */
function extractPlanetsAndHouses(text) {
  const planets = [];
  const houses = [];
  
  const planetMap = {
    'सूर्य': 'SUN', 'सूरज': 'SUN',
    'चंद्र': 'MOON', 'चन्द्र': 'MOON', 'चंद्रमा': 'MOON',
    'मंगल': 'MARS',
    'बुध': 'MERCURY',
    'गुरु': 'JUPITER', 'बृहस्पति': 'JUPITER',
    'शुक्र': 'VENUS',
    'शनि': 'SATURN',
    'राहु': 'RAHU',
    'केतु': 'KETU'
  };
  
  const houseMap = {
    'पहला': 1, 'प्रथम': 1, 'पहले': 1,
    'दूसरा': 2, 'द्वितीय': 2, 'दूसरे': 2,
    'तीसरा': 3, 'तृतीय': 3, 'तीसरे': 3,
    'चौथा': 4, 'चतुर्थ': 4, 'चौथे': 4,
    'पांचवां': 5, 'पंचम': 5, 'पांचवें': 5,
    'छठा': 6, 'षष्ठ': 6, 'छठे': 6,
    'सातवां': 7, 'सप्तम': 7, 'सातवें': 7,
    'आठवां': 8, 'अष्टम': 8, 'आठवें': 8,
    'नवां': 9, 'नवम': 9, 'नवें': 9,
    'दसवां': 10, 'दशम': 10, 'दसवें': 10,
    'ग्यारहवां': 11, 'एकादश': 11, 'ग्यारहवें': 11,
    'बारहवां': 12, 'द्वादश': 12, 'बारहवें': 12
  };
  
  for (const [hindi, planet] of Object.entries(planetMap)) {
    if (text.includes(hindi)) {
      planets.push(planet);
    }
  }
  
  for (const [hindi, house] of Object.entries(houseMap)) {
    if (text.includes(hindi)) {
      houses.push(house.toString());
    }
  }
  
  return { planets, houses };
}

/**
 * Determine confidence level
 * CONTENT-DEPTH-FIRST: Default to MEDIUM, only use LOW if truly vague
 */
function determineConfidence(text, category, planets, houses) {
  // High confidence: clear remedy with planet/house context
  if (planets.length > 0 && houses.length > 0 && category !== 'unknown') {
    return 'HIGH';
  }
  
  // Medium confidence: clear remedy OR planet/house context
  if (category !== 'unknown' || planets.length > 0 || houses.length > 0) {
    return 'MEDIUM';
  }
  
  // Low confidence: vague but still extractable
  return 'LOW';
}

/**
 * Check if text contains remedy indicators
 */
function hasRemedyIndicators(text) {
  const lowerText = text.toLowerCase();
  
  // Check all remedy keywords
  for (const keywords of Object.values(REMEDY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        return true;
      }
    }
  }
  
  // Check general remedy phrases
  const generalPhrases = [
    'करने से', 'नुकसान कम', 'फायदा', 'लाभ', 'सुधार',
    'ठीक होना', 'समस्या दूर', 'कष्ट कम', 'दुख कम'
  ];
  
  for (const phrase of generalPhrases) {
    if (lowerText.includes(phrase)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Main extraction function
 */
async function extractRemediesOnly(bookId) {
  console.log(`\n🔍 REMEDY-ONLY EXTRACTION: ${bookId}\n`);
  console.log('Focus: MAXIMUM remedy extraction (target 100+)\n');
  
  const paths = getPathsForBook(bookId);
  
  // Load source book
  const book = await readJson(paths.sourceBookPath);
  console.log(`Loaded ${book.length} chunks from source book\n`);
  
  const extractedRemedies = [];
  let processedChunks = 0;
  
  // Process each chunk
  for (const chunk of book) {
    const text = chunk.text || '';
    
    // Skip if too short or no remedy indicators
    if (text.length < 20 || !hasRemedyIndicators(text)) {
      continue;
    }
    
    processedChunks++;
    
    // Extract remedy information
    const category = detectRemedyCategory(text);
    const remedyText = extractRemedyText(text, category);
    const { planets, houses } = extractPlanetsAndHouses(text);
    const confidence = determineConfidence(text, category, planets, houses);
    
    // CONTENT-DEPTH-FIRST: Extract even if vague
    // Only skip if truly meaningless (no remedy text at all)
    if (!remedyText || remedyText.length < 5) {
      continue;
    }
    
    // Create remedy object
    const remedy = {
      source_book: bookId,
      content_type: 'REMEDY',
      planet: planets,
      house: houses,
      condition_text: text.substring(0, 300).trim(), // Original context
      remedy_text: remedyText,
      remedy_category: category,
      confidence_level: confidence,
      notes: category === 'unknown' ? 'Remedy category inferred from context' : null,
      source: {
        chunk_id: chunk.chunk_id,
        page_number: chunk.page_number,
        chunk_index: chunk.chunk_index
      }
    };
    
    extractedRemedies.push(remedy);
  }
  
  console.log(`\n✅ Extraction complete:`);
  console.log(`   - Processed chunks: ${processedChunks}`);
  console.log(`   - Remedies extracted: ${extractedRemedies.length}`);
  
  // Group by category
  const byCategory = {};
  for (const remedy of extractedRemedies) {
    const cat = remedy.remedy_category;
    byCategory[cat] = (byCategory[cat] || 0) + 1;
  }
  
  console.log(`\n📊 By category:`);
  for (const [cat, count] of Object.entries(byCategory)) {
    console.log(`   ${cat}: ${count}`);
  }
  
  // Group by confidence
  const byConfidence = {};
  for (const remedy of extractedRemedies) {
    const conf = remedy.confidence_level;
    byConfidence[conf] = (byConfidence[conf] || 0) + 1;
  }
  
  console.log(`\n📊 By confidence:`);
  for (const [conf, count] of Object.entries(byConfidence)) {
    console.log(`   ${conf}: ${count}`);
  }
  
  // Write output
  const outputPath = path.join(paths.processedDir, 'remedies.only.v1.json');
  await writeJson(outputPath, {
    schema_version: 1,
    book_id: bookId,
    created_at: nowIso(),
    extraction_mode: 'REMEDY_ONLY',
    total_remedies: extractedRemedies.length,
    by_category: byCategory,
    by_confidence: byConfidence,
    remedies: extractedRemedies
  });
  
  console.log(`\n✅ Output: ${outputPath}\n`);
  
  return extractedRemedies;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const bookId = mustGetBookId(process.argv);
  extractRemediesOnly(bookId).catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });
}

export { extractRemediesOnly };

