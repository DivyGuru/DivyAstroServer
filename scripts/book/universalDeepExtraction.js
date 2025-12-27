#!/usr/bin/env node

/**
 * UNIVERSAL ASTROLOGY BOOK INGESTION
 * 
 * CORE PHILOSOPHY (NON-NEGOTIABLE):
 * - Maximum extraction > strict correctness
 * - Knowledge preservation > executability
 * - Low confidence is NOT a reason to skip
 * - Nothing astrological should be discarded
 * 
 * Applies to ALL astrology books: Lal Kitab, Parashari, Jaimini, BPHS, etc.
 * 
 * Usage: node scripts/book/universalDeepExtraction.js <bookId>
 */

import { mustGetBookId, getPathsForBook, readJson, writeJson, nowIso } from './_shared.js';
import path from 'path';

/**
 * Hindi planet names
 */
const PLANET_MAP = {
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

/**
 * Hindi house names
 */
const HOUSE_MAP = {
  'पहला': 1, 'प्रथम': 1, 'पहले': 1, 'लग्न': 1,
  'दूसरा': 2, 'द्वितीय': 2, 'दूसरे': 2, 'धन': 2,
  'तीसरा': 3, 'तृतीय': 3, 'तीसरे': 3, 'सहज': 3,
  'चौथा': 4, 'चतुर्थ': 4, 'चौथे': 4, 'सुख': 4,
  'पांचवां': 5, 'पंचम': 5, 'पांचवें': 5, 'पुत्र': 5,
  'छठा': 6, 'षष्ठ': 6, 'छठे': 6, 'रिपु': 6,
  'सातवां': 7, 'सप्तम': 7, 'सातवें': 7, 'कलत्र': 7,
  'आठवां': 8, 'अष्टम': 8, 'आठवें': 8, 'आयु': 8,
  'नवां': 9, 'नवम': 9, 'नवें': 9, 'भाग्य': 9,
  'दसवां': 10, 'दशम': 10, 'दसवें': 10, 'कर्म': 10,
  'ग्यारहवां': 11, 'एकादश': 11, 'ग्यारहवें': 11, 'लाभ': 11,
  'बारहवां': 12, 'द्वादश': 12, 'बारहवें': 12, 'व्यय': 12
};

/**
 * Remedy keywords
 */
const REMEDY_KEYWORDS = {
  donation: ['दान', 'देने', 'देना चाहिए', 'दान करें', 'दान करना', 'दान करो', 'दे दो', 'दे देना'],
  feeding: ['खिलाना', 'खाना देना', 'खिलाएं', 'पशु', 'पक्षी', 'गाय', 'कुत्ता', 'कौआ', 'गरीब', 'बच्चे'],
  behavior: ['करना चाहिए', 'नहीं करना', 'छोड़ देना', 'त्याग देना', 'बदलना', 'सुधारना'],
  symbolic: ['फेंक देना', 'दफन करना', 'रखना', 'पहनना', 'धारण करना', 'रत्न', 'यंत्र', 'ताबीज'],
  worship: ['पूजा', 'आरती', 'अर्चना', 'प्रार्थना', 'भजन', 'कीर्तन', 'मंदिर'],
  mantra: ['मंत्र', 'जप', 'जाप', 'स्मरण', 'नाम जप', 'मंत्र जप'],
  fast: ['व्रत', 'उपवास', 'निराहार', 'एक समय भोजन', 'व्रत रखना']
};

/**
 * Rule indicators (what makes something a rule)
 */
const RULE_INDICATORS = [
  // Direct effects
  'होता है', 'होती है', 'होते हैं', 'हो जाता है', 'हो जाती है',
  'प्रभाव', 'फल', 'परिणाम', 'असर', 'नतीजा',
  
  // Conditional
  'अगर', 'यदि', 'जब', 'तो', 'तब',
  
  // Outcomes
  'मिलता है', 'मिलती है', 'मिलते हैं', 'प्राप्त होता है',
  'कमी', 'वृद्धि', 'सुधार', 'हानि', 'लाभ',
  
  // Characteristics
  'स्वभाव', 'गुण', 'विशेषता', 'लक्षण',
  
  // Warnings/cautions
  'सावधान', 'ध्यान', 'सतर्क', 'बचना चाहिए',
  
  // Time-based
  'समय', 'अवधि', 'दशा', 'महादशा', 'अंतर्दशा',
  
  // Observations
  'देखा गया', 'अनुभव', 'प्रायः', 'आमतौर पर',
  
  // Philosophical
  'कहा जाता है', 'माना जाता है', 'समझा जाता है'
];

/**
 * Extract planets from text
 */
function extractPlanets(text) {
  const planets = [];
  for (const [hindi, planet] of Object.entries(PLANET_MAP)) {
    if (text.includes(hindi)) {
      planets.push(planet);
    }
  }
  return [...new Set(planets)];
}

/**
 * Extract houses from text
 */
function extractHouses(text) {
  const houses = [];
  for (const [hindi, house] of Object.entries(HOUSE_MAP)) {
    if (text.includes(hindi)) {
      houses.push(house.toString());
    }
  }
  return [...new Set(houses)];
}

/**
 * Detect if text contains rule indicators
 */
function hasRuleIndicators(text) {
  const lowerText = text.toLowerCase();
  return RULE_INDICATORS.some(indicator => lowerText.includes(indicator.toLowerCase()));
}

/**
 * Detect if text contains remedy indicators
 */
function hasRemedyIndicators(text) {
  const lowerText = text.toLowerCase();
  for (const keywords of Object.values(REMEDY_KEYWORDS)) {
    if (keywords.some(keyword => lowerText.includes(keyword.toLowerCase()))) {
      return true;
    }
  }
  
  // General remedy phrases
  const generalPhrases = ['करने से', 'नुकसान कम', 'फायदा', 'लाभ', 'सुधार', 'ठीक होना'];
  return generalPhrases.some(phrase => lowerText.includes(phrase));
}

/**
 * Determine rule type
 */
function determineRuleType(text) {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('सावधान') || lowerText.includes('ध्यान') || lowerText.includes('बचना')) {
    return 'warning';
  }
  if (lowerText.includes('करना') || lowerText.includes('न करना') || lowerText.includes('छोड़')) {
    return 'behavioral';
  }
  if (lowerText.includes('अगर') || lowerText.includes('यदि') || lowerText.includes('जब')) {
    return 'situational';
  }
  if (lowerText.includes('प्रतीक') || lowerText.includes('रूपक') || lowerText.includes('अर्थ')) {
    return 'symbolic';
  }
  if (lowerText.includes('देखा') || lowerText.includes('अनुभव') || lowerText.includes('प्रायः')) {
    return 'observation';
  }
  if (lowerText.includes('कहा जाता') || lowerText.includes('माना जाता') || lowerText.includes('समझा जाता')) {
    return 'philosophical';
  }
  
  return 'direct';
}

/**
 * Determine remedy category
 */
function detectRemedyCategory(text) {
  const lowerText = text.toLowerCase();
  
  for (const [category, keywords] of Object.entries(REMEDY_KEYWORDS)) {
    if (keywords.some(keyword => lowerText.includes(keyword.toLowerCase()))) {
      return category;
    }
  }
  
  return 'unknown';
}

/**
 * Extract remedy text
 */
function extractRemedyText(text, category) {
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
  
  // Fallback: return meaningful sentence
  const sentences = text.split(/[।\.]/);
  for (const sentence of sentences) {
    if (sentence.length > 10 && sentence.length < 300) {
      return sentence.trim();
    }
  }
  
  return text.substring(0, 300).trim();
}

/**
 * Determine confidence level
 * CONTENT-DEPTH-FIRST: Default to MEDIUM, only use LOW if truly vague
 */
function determineConfidence(text, hasPlanets, hasHouses, ruleType, remedyCategory) {
  // High: clear rule/remedy with planet/house context
  if ((hasPlanets || hasHouses) && (ruleType !== 'unknown' || remedyCategory !== 'unknown')) {
    return 'HIGH';
  }
  
  // Medium: clear rule/remedy OR planet/house context
  if (ruleType !== 'unknown' || remedyCategory !== 'unknown' || hasPlanets || hasHouses) {
    return 'MEDIUM';
  }
  
  // Low: vague but still extractable
  return 'LOW';
}

/**
 * Extract effect text from rule
 */
function extractEffectText(text) {
  // Try to find the effect/outcome part
  const effectMarkers = ['होता है', 'होती है', 'मिलता है', 'प्रभाव', 'फल', 'परिणाम'];
  
  for (const marker of effectMarkers) {
    const index = text.indexOf(marker);
    if (index > 0) {
      // Extract sentence containing marker
      const before = text.substring(Math.max(0, index - 100), index);
      const after = text.substring(index, Math.min(text.length, index + 200));
      return (before + after).trim();
    }
  }
  
  // Fallback: return meaningful portion
  const sentences = text.split(/[।\.]/);
  for (const sentence of sentences) {
    if (sentence.length > 15 && sentence.length < 400) {
      return sentence.trim();
    }
  }
  
  return text.substring(0, 400).trim();
}

/**
 * Main extraction function
 */
async function universalDeepExtraction(bookId) {
  console.log(`\n🔍 UNIVERSAL DEEP EXTRACTION: ${bookId}\n`);
  console.log('Philosophy: Maximum extraction > strict correctness\n');
  
  const paths = getPathsForBook(bookId);
  
  // Load source book
  const book = await readJson(paths.sourceBookPath);
  console.log(`Loaded ${book.length} chunks from source book\n`);
  
  const extractedRules = [];
  const extractedRemedies = [];
  let processedChunks = 0;
  
  // Process each chunk
  for (const chunk of book) {
    const text = chunk.text || '';
    
    // Skip if too short
    if (text.length < 15) {
      continue;
    }
    
    processedChunks++;
    
    // Extract planets and houses
    const planets = extractPlanets(text);
    const houses = extractHouses(text);
    
    // FIXED: Skip rules without planet/house - they cannot create condition_tree
    // Rules need astrological entities (planet/house) to be evaluable
    if (planets.length === 0 && houses.length === 0) {
      // Skip this chunk - no astrological entities to create a rule
      continue;
    }
    
    // Check for rules
    if (hasRuleIndicators(text)) {
      const ruleType = determineRuleType(text);
      const effectText = extractEffectText(text);
      const confidence = determineConfidence(text, planets.length > 0, houses.length > 0, ruleType, 'unknown');
      
      // CONTENT-DEPTH-FIRST: Extract even if vague (but only if has planet/house)
      if (effectText && effectText.length > 5) {
        const rule = {
          source_book: bookId,
          content_type: 'RULE',
          planet: planets,
          house: houses,
          sign: [], // Can be added later if needed
          condition_text: text.substring(0, 500).trim(),
          effect_text: effectText,
          rule_type: ruleType,
          confidence_level: confidence,
          notes: null, // No longer needed since we skip if no planet/house
          source: {
            chunk_id: chunk.chunk_id,
            page_number: chunk.page_number,
            chunk_index: chunk.chunk_index
          }
        };
        
        extractedRules.push(rule);
      }
    }
    
    // Check for remedies
    if (hasRemedyIndicators(text)) {
      const remedyCategory = detectRemedyCategory(text);
      const remedyText = extractRemedyText(text, remedyCategory);
      const confidence = determineConfidence(text, planets.length > 0, houses.length > 0, 'unknown', remedyCategory);
      
      // CONTENT-DEPTH-FIRST: Extract even if vague
      if (remedyText && remedyText.length > 5) {
        const remedy = {
          source_book: bookId,
          content_type: 'REMEDY',
          planet: planets,
          house: houses,
          condition_text: text.substring(0, 500).trim(),
          remedy_text: remedyText,
          remedy_category: remedyCategory,
          confidence_level: confidence,
          notes: planets.length === 0 && houses.length === 0 ? 'No explicit planet/house mapping' : null,
          source: {
            chunk_id: chunk.chunk_id,
            page_number: chunk.page_number,
            chunk_index: chunk.chunk_index
          }
        };
        
        extractedRemedies.push(remedy);
      }
    }
  }
  
  console.log(`\n✅ Extraction complete:`);
  console.log(`   - Processed chunks: ${processedChunks}`);
  console.log(`   - Rules extracted: ${extractedRules.length}`);
  console.log(`   - Remedies extracted: ${extractedRemedies.length}`);
  
  // Group rules by type
  const rulesByType = {};
  for (const rule of extractedRules) {
    const type = rule.rule_type;
    rulesByType[type] = (rulesByType[type] || 0) + 1;
  }
  
  console.log(`\n📊 Rules by type:`);
  for (const [type, count] of Object.entries(rulesByType)) {
    console.log(`   ${type}: ${count}`);
  }
  
  // Group rules by confidence
  const rulesByConfidence = {};
  for (const rule of extractedRules) {
    const conf = rule.confidence_level;
    rulesByConfidence[conf] = (rulesByConfidence[conf] || 0) + 1;
  }
  
  console.log(`\n📊 Rules by confidence:`);
  for (const [conf, count] of Object.entries(rulesByConfidence)) {
    console.log(`   ${conf}: ${count}`);
  }
  
  // Group remedies by category
  const remediesByCategory = {};
  for (const remedy of extractedRemedies) {
    const cat = remedy.remedy_category;
    remediesByCategory[cat] = (remediesByCategory[cat] || 0) + 1;
  }
  
  console.log(`\n📊 Remedies by category:`);
  for (const [cat, count] of Object.entries(remediesByCategory)) {
    console.log(`   ${cat}: ${count}`);
  }
  
  // Group remedies by confidence
  const remediesByConfidence = {};
  for (const remedy of extractedRemedies) {
    const conf = remedy.confidence_level;
    remediesByConfidence[conf] = (remediesByConfidence[conf] || 0) + 1;
  }
  
  console.log(`\n📊 Remedies by confidence:`);
  for (const [conf, count] of Object.entries(remediesByConfidence)) {
    console.log(`   ${conf}: ${count}`);
  }
  
  // Write outputs
  const rulesPath = path.join(paths.processedDir, 'rules.universal.v1.json');
  await writeJson(rulesPath, {
    schema_version: 1,
    book_id: bookId,
    created_at: nowIso(),
    extraction_mode: 'UNIVERSAL_DEEP',
    total_rules: extractedRules.length,
    by_type: rulesByType,
    by_confidence: rulesByConfidence,
    rules: extractedRules
  });
  
  const remediesPath = path.join(paths.processedDir, 'remedies.universal.v1.json');
  await writeJson(remediesPath, {
    schema_version: 1,
    book_id: bookId,
    created_at: nowIso(),
    extraction_mode: 'UNIVERSAL_DEEP',
    total_remedies: extractedRemedies.length,
    by_category: remediesByCategory,
    by_confidence: remediesByConfidence,
    remedies: extractedRemedies
  });
  
  console.log(`\n✅ Outputs:`);
  console.log(`   - Rules: ${rulesPath}`);
  console.log(`   - Remedies: ${remediesPath}\n`);
  
  return {
    rules: extractedRules,
    remedies: extractedRemedies
  };
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const bookId = mustGetBookId(process.argv);
  universalDeepExtraction(bookId).catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });
}

export { universalDeepExtraction };

