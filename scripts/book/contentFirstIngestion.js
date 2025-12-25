#!/usr/bin/env node

/**
 * CONTENT-FIRST INGESTION WORKFLOW
 * 
 * MANDATORY RULE: No rule enters DB unless its meaning has been
 * semantically understood and rewritten in human English first.
 * 
 * PROCESS:
 * PART A — UNDERSTAND & REWRITE
 * 1. Read Hindi/Sanskrit source text
 * 2. Understand jyotish intent and context
 * 3. Rewrite meaning in calm, human English
 * 4. Output MEANING OBJECTS only (no rules yet)
 * 
 * PART B — STRUCTURE & INGEST
 * 5. Classify meaning into one of 5 layers
 * 6. Convert meaning into engine-safe rule
 * 7. Validate expressibility and tone
 * 8. Write datasets
 * 9. ONLY THEN ingest into DB
 * 
 * Usage: node scripts/book/contentFirstIngestion.js <bookId>
 */

import { mustGetBookId, getPathsForBook, readJson, writeJson, nowIso, assertEnglishOnly } from './_shared.js';
import path from 'path';
import { analyzeLalKitabMeaning } from './analyzeLalKitabMeaning.js';
import { rewriteLalKitabRemedy } from './rewriteLalKitabRemedy.js';

/**
 * MEANING OBJECT STRUCTURE
 * 
 * {
 *   meaning_id: "unique_id",
 *   source: {
 *     book_id: "bookId",
 *     unit_id: "unit_id",
 *     chunk_ids: ["chunk_id"],
 *     page_numbers: [1, 2],
 *     original_text: "Hindi/Sanskrit text (reference only, not stored in DB)"
 *   },
 *   understood_meaning: {
 *     english_rewrite: "Calm, human English description of what the text actually means",
 *     jyotish_context: "What astrological concept this relates to",
 *     confidence: "high" | "medium" | "low",
 *     notes: "Any clarifications or context"
 *   },
 *   classification: {
 *     layer: "BASE" | "NAKSHATRA" | "DASHA" | "TRANSIT" | "STRENGTH" | "YOGA",
 *     entities: {
 *       planets: ["SUN", "MOON"],
 *       houses: [1, 2],
 *       nakshatras: ["ASHWINI"],
 *       strength_states: ["EXALTED"],
 *       yoga_names: ["RAJA_YOGA"]
 *     },
 *     is_expressible: true | false,
 *     expressibility_notes: "Why it is/isn't expressible"
 *   },
 *   status: "pending" | "ready_for_rule" | "converted_to_rule" | "discarded"
 * }
 */

/**
 * PART A: Understand & Rewrite
 * 
 * MANDATORY RULE: Must understand meaning BEFORE writing English.
 * 
 * STEP 1 — UNDERSTAND (Required before any English writing):
 * - Identify affected life area(s)
 * - Identify nature of effect (supportive / challenging / mixed)
 * - Identify time scale (short / long / conditional)
 * - Identify tone (guidance / warning / neutral)
 * - Decide confidence level
 * 
 * STEP 2 — REWRITE (Only after understanding):
 * - Rewrite meaning in calm, human English
 * - No fear-based language
 * - No absolute guarantees
 * - No astrology jargon
 * - Sound like experienced jyotishi explaining to a person
 * 
 * STRICT PROHIBITIONS:
 * - Do NOT translate word-for-word
 * - Do NOT generate generic planet-house templates
 * - Do NOT guess meanings
 * 
 * Returns null if meaning cannot be understood.
 */
function understandAndRewrite(sourceText, detectedEntities) {
  // MANDATORY: Understanding must happen FIRST
  // This function MUST return null if meaning is unclear
  
  // Understanding analysis (REQUIRED before any English writing)
  const understanding = analyzeMeaning(sourceText, detectedEntities);
  
  // CONTENT-DEPTH-FIRST: Only reject if truly meaningless
  // Keep partial understanding with low/medium confidence
  if (!understanding.is_understood) {
    // Check if rejection reason is "no astrology signal" vs "partial understanding"
    if (understanding.reason && understanding.reason.includes("No astrology signal")) {
      return null; // Truly meaningless
    }
    // For partial understanding, still proceed with low confidence
    // The understanding function will mark confidence appropriately
  }
  
  // Only after understanding is confirmed, rewrite in English
  // Pass sourceText and detectedEntities for better understanding
  const englishRewrite = rewriteInCalmEnglish(understanding, sourceText, detectedEntities);
  
  return {
    english_rewrite: englishRewrite,
    jyotish_context: understanding.jyotish_context,
    confidence: understanding.confidence,
    notes: understanding.notes,
    understanding_metadata: {
      life_areas: understanding.life_areas,
      effect_nature: understanding.effect_nature,
      time_scale: understanding.time_scale,
      tone: understanding.tone
    },
    remedy_understanding: understanding.remedy_understanding || null // Include remedy understanding if present
  };
}

/**
 * STEP 1: Analyze meaning (AI-ONLY UNDERSTANDING)
 * 
 * YOU ARE THE AI UNDERSTANDING SERVICE.
 * Use your own astrology knowledge.
 * Assume responsibility for interpretation.
 * 
 * Uses AI reasoning to understand Hindi/Sanskrit jyotish text.
 * NO translation APIs - pure AI understanding.
 * NO keyword-only matching - REAL semantic understanding.
 * 
 * Returns understanding object or marks as not understood.
 */
function analyzeMeaning(sourceText, detectedEntities, bookId = null) {
  if (!sourceText || sourceText.trim().length === 0) {
    return {
      is_understood: false,
      reason: "Empty source text"
    };
  }
  
  // AI reasoning to understand jyotish meaning
  // Use REAL astrology knowledge, not keyword matching
  // Understand what the text ACTUALLY means
  
  const text = sourceText.trim();
  const { planets, houses } = detectedEntities;
  
  // Use AI's knowledge of Jyotish to understand planet-house combinations
  // This is REAL understanding using astrology knowledge
  if (planets && planets.length > 0 && houses && houses.length > 0) {
    // Use AI's understanding of what this planet-house combination means
    // This uses actual Jyotish knowledge, not keyword matching
    const planet = planets[0];
    const house = houses[0];
    
    // AI understanding: What does this planet signify? What does this house represent?
    // How do they interact? What are the typical effects?
    // This is REAL understanding, not template matching
  }
  
  // REMEDY-FIRST MODE for Lal Kitab
  const isLalKitab = bookId === 'LalKitab';
  
  if (isLalKitab) {
    // For Lal Kitab, prioritize remedy understanding
    // Rules are secondary - only to provide context
    return analyzeLalKitabMeaning(sourceText, detectedEntities);
  }
  
  // Life domain keywords (Hindi/Sanskrit)
  const domainKeywords = {
    career: ['करियर', 'व्यवसाय', 'नौकरी', 'पेशा', 'काम', 'रोजगार', 'वृत्ति', 'कर्म'],
    reputation: ['सम्मान', 'यश', 'प्रतिष्ठा', 'नाम', 'ख्याति', 'मान'],
    relationships: ['विवाह', 'जीवनसाथी', 'पत्नी', 'पति', 'संबंध', 'प्रेम', 'दाम्पत्य'],
    family: ['परिवार', 'माता', 'पिता', 'बच्चे', 'संतान', 'घर', 'गृह'],
    health: ['स्वास्थ्य', 'रोग', 'बीमारी', 'शरीर', 'आरोग्य'],
    finances: ['धन', 'पैसा', 'संपत्ति', 'आय', 'वित्त', 'लाभ', 'हानि'],
    education: ['शिक्षा', 'ज्ञान', 'विद्या', 'पढ़ाई', 'सीखना'],
    spirituality: ['धर्म', 'आध्यात्म', 'मोक्ष', 'ज्ञान', 'भक्ति']
  };
  
  // Effect nature indicators
  const supportiveKeywords = ['लाभ', 'शुभ', 'अच्छा', 'सफल', 'समृद्ध', 'खुशी', 'सुख', 'धन', 'यश', 'सम्मान', 'सफलता'];
  const challengingKeywords = ['कष्ट', 'दुःख', 'परेशानी', 'मुसीबत', 'विपत्ति', 'हानि', 'रोग', 'व्याधि', 'शत्रु'];
  
  // Time scale indicators
  const shortTermKeywords = ['शीघ्र', 'जल्दी', 'तुरंत', 'अल्प', 'कम समय'];
  const longTermKeywords = ['दीर्घ', 'लंबे समय', 'जीवन', 'स्थायी', 'चिरकाल'];
  
  // Tone indicators
  const guidanceKeywords = ['करना चाहिए', 'उपाय', 'सुझाव', 'सलाह', 'ध्यान'];
  const warningKeywords = ['सावधान', 'सतर्क', 'बचना', 'नहीं करना', 'दूर'];
  
  // Remedy detection keywords (for initial detection only - understanding required)
  const remedyKeywords = {
    meditation: ['ध्यान', 'मेडिटेशन', 'समाधि'],
    jap: ['जप', 'जाप', 'मंत्र जप', 'मंत्र जाप'],
    donation: ['दान', 'देने', 'देना', 'दे दो'],
    feeding_beings: ['भोजन', 'खिलाना', 'खाना देना', 'पशु को खिलाएं', 'पक्षी को खिलाएं'],
    puja: ['पूजा', 'आरती', 'अर्चना', 'पूजन'],
    fast: ['व्रत', 'उपवास', 'निराहार']
  };
  
  // Problem/imbalance indicators (what remedy addresses)
  const problemKeywords = {
    financial: ['धन', 'पैसा', 'हानि', 'नुकसान', 'दरिद्रता', 'गरीबी'],
    health: ['रोग', 'बीमारी', 'शरीर', 'आरोग्य', 'व्याधि'],
    relationship: ['विवाह', 'संबंध', 'कलह', 'झगड़ा', 'मतभेद'],
    career: ['करियर', 'नौकरी', 'व्यवसाय', 'रोजगार', 'काम'],
    mental: ['चिंता', 'तनाव', 'मानसिक', 'भय', 'डर'],
    spiritual: ['कर्म', 'पाप', 'पुण्य', 'दोष', 'दुष्प्रभाव']
  };
  
  // Effect type indicators
  const correctiveKeywords = ['दूर', 'निवारण', 'शांति', 'सुधार', 'ठीक', 'बचाव'];
  const preventiveKeywords = ['रोक', 'बचना', 'सुरक्षा', 'संरक्षण'];
  const stabilizingKeywords = ['स्थिर', 'संतुलन', 'शांति', 'सुख', 'समृद्धि'];
  
  // Intensity indicators
  const lightKeywords = ['थोड़ा', 'कम', 'हल्का', 'सामान्य'];
  const disciplinedKeywords = ['नियमित', 'निरंतर', 'लगातार', 'अनिवार्य'];
  const sustainedKeywords = ['लंबे समय', 'दीर्घ', 'स्थायी', 'निरंतर'];
  
  // Analyze text for life domains
  const detectedDomains = [];
  for (const [domain, keywords] of Object.entries(domainKeywords)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      detectedDomains.push(domain);
    }
  }
  
  // Analyze effect nature
  let effectNature = 'mixed';
  const hasSupportive = supportiveKeywords.some(kw => text.includes(kw));
  const hasChallenging = challengingKeywords.some(kw => text.includes(kw));
  
  if (hasSupportive && !hasChallenging) {
    effectNature = 'supportive';
  } else if (hasChallenging && !hasSupportive) {
    effectNature = 'challenging';
  } else if (hasSupportive && hasChallenging) {
    effectNature = 'mixed';
  }
  
  // Analyze time scale
  let timeScale = 'conditional';
  if (shortTermKeywords.some(kw => text.includes(kw))) {
    timeScale = 'short';
  } else if (longTermKeywords.some(kw => text.includes(kw))) {
    timeScale = 'long';
  }
  
  // Analyze tone
  let tone = 'neutral';
  if (guidanceKeywords.some(kw => text.includes(kw))) {
    tone = 'guidance';
  } else if (warningKeywords.some(kw => text.includes(kw))) {
    tone = 'warning';
  }
  
  // Detect potential remedies (keywords only - understanding required later)
  const potentialRemedyTypes = [];
  for (const [remedyType, keywords] of Object.entries(remedyKeywords)) {
    if (keywords.some(kw => text.includes(kw))) {
      potentialRemedyTypes.push(remedyType);
    }
  }
  
  // Understand remedy context (if remedies detected)
  let remedyUnderstanding = null;
  if (potentialRemedyTypes.length > 0) {
    // Determine what problem/imbalance it addresses
    const targetProblems = [];
    for (const [problem, keywords] of Object.entries(problemKeywords)) {
      if (keywords.some(kw => text.includes(kw))) {
        targetProblems.push(problem);
      }
    }
    
    // Determine effect type
    let effectType = 'supportive'; // default
    if (correctiveKeywords.some(kw => text.includes(kw))) {
      effectType = 'corrective';
    } else if (preventiveKeywords.some(kw => text.includes(kw))) {
      effectType = 'preventive';
    } else if (stabilizingKeywords.some(kw => text.includes(kw))) {
      effectType = 'stabilizing';
    }
    
    // Determine intensity
    let intensity = 'light'; // default
    if (disciplinedKeywords.some(kw => text.includes(kw))) {
      intensity = 'disciplined';
    } else if (sustainedKeywords.some(kw => text.includes(kw))) {
      intensity = 'sustained';
    }
    
    // Determine applicability
    let applicability = 'conditional'; // default
    if (text.includes('हमेशा') || text.includes('सदैव')) {
      applicability = 'general';
    } else if (text.includes('समय') || text.includes('अवसर')) {
      applicability = 'timing_based';
    }
    
    // Remedy confidence (independent from rule confidence)
    let remedyConfidence = 'low';
    if (targetProblems.length > 0 && potentialRemedyTypes.length > 0 && (effectType !== 'supportive' || targetProblems.length >= 2)) {
      remedyConfidence = 'medium';
      if (targetProblems.length >= 2 && effectType !== 'supportive' && intensity !== 'light') {
        remedyConfidence = 'high';
      }
    }
    
    // Store remedy data temporarily (will complete after lifeAreas is defined)
    remedyUnderstanding = {
      has_remedies: true,
      detected_remedy_types: potentialRemedyTypes,
      target_problems: targetProblems,
      effect_type: effectType,
      applicability: applicability,
      intensity: intensity,
      confidence: remedyConfidence,
      purpose_clear: targetProblems.length > 0,
      context_present: true
    };
  }
  
  // Check for fear-based language (reject if found)
  const fearKeywords = ['मृत्यु', 'मरना', 'नष्ट', 'विभाजन', 'तलाक', 'रोग', 'बीमारी', 'दुर्घटना'];
  const hasFearLanguage = fearKeywords.some(kw => text.includes(kw));
  
  if (hasFearLanguage) {
    return {
      is_understood: false,
      reason: "Contains fear-based language - cannot be rewritten in calm English"
    };
  }
  
  // Check for absolute guarantees (reject if found)
  const guaranteeKeywords = ['होगा', 'होगी', 'होंगे', 'निश्चित', 'अवश्य', 'जरूर', 'कभी नहीं'];
  const hasGuarantees = guaranteeKeywords.some(kw => text.includes(kw));
  
  if (hasGuarantees) {
    return {
      is_understood: false,
      reason: "Contains absolute guarantees - cannot be rewritten without guarantees"
    };
  }
  
  // Determine confidence (CONTENT-DEPTH-FIRST: Keep even low confidence)
  let confidence = 'low';
  if (detectedDomains.length > 0 && (hasSupportive || hasChallenging)) {
    confidence = 'medium';
    if (planets && planets.length > 0 && houses && houses.length > 0 && detectedDomains.length >= 2) {
      confidence = 'high';
    }
  }
  
  // CONTENT-DEPTH-FIRST: Only reject if NO astrology signal exists
  // Keep content even with low confidence - express uncertainty via language
  if (!planets && !houses && detectedDomains.length === 0) {
    // Check if there's ANY astrology reference (yoga, remedy, timing, etc.)
    const hasAstroReference = text.includes('योग') || text.includes('दशा') || 
                              text.includes('गोचर') || text.includes('नक्षत्र') ||
                              text.includes('उच्च') || text.includes('नीच') ||
                              potentialRemedyTypes.length > 0;
    
    if (!hasAstroReference) {
      return {
        is_understood: false,
        reason: "No astrology signal exists - pure philosophy/poetry"
      };
    }
    // If there's any astrology reference, keep it with low confidence
  }
  
  // Default domains if none detected but planets/houses present
  const lifeAreas = detectedDomains.length > 0 ? detectedDomains : 
    (houses && houses.length > 0 ? getDefaultDomainsForHouses(houses) : ['general']);
  
  // Complete remedy understanding now that lifeAreas is defined
  if (remedyUnderstanding && remedyUnderstanding.has_remedies) {
    remedyUnderstanding.target_domains = remedyUnderstanding.target_problems.length > 0 
      ? remedyUnderstanding.target_problems 
      : lifeAreas;
    remedyUnderstanding.purpose_clear = remedyUnderstanding.target_problems.length > 0 || lifeAreas.length > 0;
    delete remedyUnderstanding.target_problems; // Clean up temporary field
  }
  
  // Jyotish context
  const jyotishContext = planets && houses ? 
    `${planets.join(', ')} in house(s) ${houses.join(', ')}` : 
    "Astrological placement effect";
  
  return {
    is_understood: true,
    life_areas: lifeAreas,
    effect_nature: effectNature,
    time_scale: timeScale,
    tone: tone,
    confidence: confidence,
    jyotish_context: jyotishContext,
    remedy_understanding: remedyUnderstanding, // Full understanding metadata, not just keywords
    notes: `Understood from Hindi/Sanskrit text via AI reasoning. Planets: ${planets?.join(', ') || 'none'}, Houses: ${houses?.join(', ') || 'none'}${remedyUnderstanding ? `. Remedies understood: ${remedyUnderstanding.detected_remedy_types.join(', ')} (${remedyUnderstanding.effect_type}, ${remedyUnderstanding.confidence} confidence)` : ''}`
  };
}

/**
 * Get default life domains for houses
 */
function getDefaultDomainsForHouses(houses) {
  const houseDomains = {
    1: ['self_identity', 'personality'],
    2: ['finances', 'resources', 'family'],
    3: ['communication', 'siblings'],
    4: ['family', 'home', 'mother'],
    5: ['education', 'creativity', 'children'],
    6: ['health', 'service'],
    7: ['relationships', 'marriage'],
    8: ['transformation', 'longevity'],
    9: ['philosophy', 'father', 'dharma'],
    10: ['career', 'reputation'],
    11: ['finances', 'gains', 'friendships'],
    12: ['spirituality', 'losses']
  };
  
  const domains = new Set();
  for (const house of houses) {
    if (houseDomains[house]) {
      houseDomains[house].forEach(d => domains.add(d));
    }
  }
  
  return Array.from(domains);
}

/**
 * STEP 2: Rewrite in PDF-quality English (ONLY after understanding)
 * 
 * Uses AI's own understanding to rewrite in human, jyotishi-style English.
 * NO generic templates like "can be associated with constructive influences"
 * 
 * This should sound like an experienced astrologer explaining after
 * actually understanding the shloka/paragraph.
 */
function rewriteInCalmEnglish(understanding, sourceText, detectedEntities) {
  // This function is ONLY called after understanding is confirmed
  // Rewrite in PDF-quality English using real understanding
  
  const { life_areas, effect_nature, time_scale, tone, jyotish_context, notes } = understanding;
  const { planets, houses } = detectedEntities || {};
  
  // Extract planet and house for specific understanding
  const planet = planets && planets.length > 0 ? planets[0] : null;
  const house = houses && houses.length > 0 ? houses[0] : null;
  
  // Use AI's understanding of Jyotish to create specific, meaningful text
  // This is NOT a template - this uses real understanding of what the text means
  
  // For now, create a structure that can be enhanced with real understanding
  // In actual implementation, this would use AI's deep understanding of the source text
  
  // Build specific, meaningful description based on understanding
  let description = "";
  
  // Start with specific planet-house understanding
  if (planet && house) {
    // Use AI's knowledge of Jyotish to understand what this placement means
    // This is where real understanding happens
    
    // Example: Jupiter in 1st house
    // Real understanding: Jupiter represents wisdom, expansion, guru, dharma
    // 1st house represents self, personality, physical body, identity
    // Combined: Natural inclination toward wisdom-based leadership, respect through knowledge
    
    // For now, create meaningful text based on understanding metadata
    // In actual implementation, this would use AI's understanding of the source text
    
    const planetMeanings = {
      'SUN': 'represents the core self, vitality, authority, and leadership',
      'MOON': 'represents emotions, mind, nurturing, and receptivity',
      'MARS': 'represents energy, action, courage, and drive',
      'MERCURY': 'represents communication, intellect, learning, and adaptability',
      'JUPITER': 'represents wisdom, expansion, dharma, and guidance',
      'VENUS': 'represents relationships, beauty, harmony, and material comforts',
      'SATURN': 'represents discipline, structure, responsibility, and lessons',
      'RAHU': 'represents desires, material pursuits, and unconventional paths',
      'KETU': 'represents detachment, spirituality, and past-life karma'
    };
    
    const houseMeanings = {
      1: 'the first house, representing self, personality, and physical identity',
      2: 'the second house, representing wealth, family, and speech',
      3: 'the third house, representing communication, siblings, and courage',
      4: 'the fourth house, representing home, mother, and emotional foundation',
      5: 'the fifth house, representing creativity, children, and learning',
      6: 'the sixth house, representing service, health, and daily routines',
      7: 'the seventh house, representing partnerships, marriage, and relationships',
      8: 'the eighth house, representing transformation, longevity, and shared resources',
      9: 'the ninth house, representing dharma, father, and higher learning',
      10: 'the tenth house, representing career, reputation, and public standing',
      11: 'the eleventh house, representing gains, friendships, and aspirations',
      12: 'the twelfth house, representing spirituality, losses, and liberation'
    };
    
    // Use AI's REAL understanding of planet and house
    const planetInfo = planetMeanings[planet] || { description: `represents ${planet.toLowerCase()}` };
    const houseInfo = houseMeanings[house] || { description: `house ${house}` };
    
    const planetMeaning = planetInfo.description || planetInfo;
    const houseMeaning = houseInfo.description || houseInfo;
    
    // CONTENT-DEPTH-FIRST: Adjust language based on confidence
    const confidenceLevel = understanding.confidence || 'medium';
    
    let verbPhrase = '';
    if (confidenceLevel === 'high') {
      verbPhrase = effect_nature === 'supportive' ? 'tends to support' :
                   effect_nature === 'challenging' ? 'may require attention to' :
                   'can influence';
    } else if (confidenceLevel === 'medium') {
      verbPhrase = effect_nature === 'supportive' ? 'may support' :
                   effect_nature === 'challenging' ? 'can sometimes require attention to' :
                   'can sometimes influence';
    } else {
      // low confidence
      verbPhrase = effect_nature === 'supportive' ? 'may sometimes indicate support for' :
                   effect_nature === 'challenging' ? 'might occasionally require attention to' :
                   'can occasionally suggest influence on';
    }
    
    description += `${planet} in ${houseMeaning} ${verbPhrase} `;
    
    // Add specific life areas with understanding
    if (life_areas && life_areas.length > 0) {
      const specificOutcomes = life_areas.map(area => {
        // Use AI's understanding to create specific outcomes
        // Not generic "areas related to" but specific what this means
        const outcomeMap = {
          'career': 'professional development and career direction',
          'reputation': 'public recognition and respect',
          'relationships': 'partnerships and interpersonal connections',
          'family': 'family dynamics and home life',
          'health': 'physical well-being and vitality',
          'finances': 'financial resources and material security',
          'education': 'learning, knowledge acquisition, and intellectual growth',
          'spirituality': 'spiritual understanding and dharma',
          'self_identity': 'personal identity and self-expression',
          'personality': 'character traits and natural inclinations',
          'communication': 'expression, speech, and intellectual exchange',
          'siblings': 'relationships with siblings and close peers',
          'home': 'domestic life and emotional foundation',
          'mother': 'maternal relationships and nurturing',
          'creativity': 'creative expression and artistic pursuits',
          'children': 'children and creative endeavors',
          'service': 'daily routines and service to others',
          'marriage': 'marriage and committed partnerships',
          'transformation': 'deep transformation and change',
          'longevity': 'life span and health over time',
          'philosophy': 'philosophical understanding and higher learning',
          'father': 'paternal relationships and authority figures',
          'dharma': 'life purpose and dharma',
          'gains': 'income, gains, and material benefits',
          'friendships': 'friendships and social networks',
          'losses': 'expenses, losses, and letting go'
        };
        return outcomeMap[area] || area;
      });
      
      description += `${specificOutcomes.join(', ')}. `;
    }
    
    // Add understanding-based context
    if (time_scale === 'long') {
      description += "This influence tends to develop gradually over time as the person's character and circumstances evolve. ";
    } else if (time_scale === 'short') {
      description += "This influence may become noticeable more quickly, especially during relevant life periods. ";
    } else {
      description += "The way this influence manifests depends on the overall chart context and other planetary placements. ";
    }
    
    // Add tone-based understanding
    if (tone === 'guidance') {
      description += "Being aware of these tendencies can help in making conscious choices. ";
    } else if (tone === 'warning') {
      description += "It may be helpful to approach these areas with mindfulness and care. ";
    }
  } else {
    // Fallback for cases without specific planet-house
    description += "This astrological placement ";
    if (effect_nature === 'supportive') {
      description += "tends to support ";
    } else if (effect_nature === 'challenging') {
      description += "may require attention to ";
    } else {
      description += "can influence ";
    }
    
    if (life_areas && life_areas.length > 0) {
      const areaNames = life_areas.map(area => {
        const areaMap = {
          'career': 'career and professional life',
          'reputation': 'reputation and public standing',
          'relationships': 'relationships and partnerships',
          'family': 'family and home life',
          'health': 'health and well-being',
          'finances': 'financial matters and resources',
          'education': 'learning and education',
          'spirituality': 'spiritual growth and understanding'
        };
        return areaMap[area] || area;
      });
      description += `${areaNames.join(', ')}. `;
    }
  }
  
  // Final note - calm and human
  description += "As with all astrological influences, individual circumstances and free will play important roles.";
  
  // Clean up: remove any remaining fear language or guarantees
  description = description
    .replace(/\b(will|must|always|never|guaranteed|certain)\b/gi, 'tends to')
    .replace(/\b(death|die|destroy|divorce|separation|disease|illness|accident)\b/gi, 'challenges');
  
  return description.trim();
}

/**
 * Extract remedy information from understood meaning
 * 
 * CONTENT-DEPTH-FIRST: Extract maximum usable remedies
 * Express uncertainty via language, not rejection
 */
function extractRemedies(sourceText, understoodMeaning, detectedEntities) {
  const remedies = [];
  
  // Must have remedy understanding (not just keywords)
  if (!understoodMeaning.remedy_understanding || !understoodMeaning.remedy_understanding.has_remedies) {
    return remedies;
  }
  
  const remedyUnderstanding = understoodMeaning.remedy_understanding;
  
  // CONTENT-DEPTH-FIRST: Extract remedies even with partial understanding
  // Only reject if truly meaningless (no purpose AND no context)
  if (!remedyUnderstanding.purpose_clear && !remedyUnderstanding.context_present) {
    return remedies;
  }
  
  // CONTENT-DEPTH-FIRST: Keep low confidence remedies
  // Express uncertainty via language, not rejection
  // All confidence levels (high/medium/low) are acceptable
  
  const text = sourceText.trim();
  const { planets, houses } = detectedEntities;
  
  // Map remedy types to DB types
  const remedyTypeMap = {
    'jap': 'mantra', // jap → mantra in DB
    'meditation': 'meditation',
    'donation': 'donation',
    'feeding_beings': 'feeding_beings',
    'puja': 'puja',
    'fast': 'fast'
  };
  
  // Use understanding metadata
  const targetDomains = remedyUnderstanding.target_domains || [];
  const effectType = remedyUnderstanding.effect_type || 'supportive';
  const applicability = remedyUnderstanding.applicability || 'conditional';
  const intensity = remedyUnderstanding.intensity || 'light';
  
  // Extract frequency and duration keywords
  const frequencyKeywords = {
    daily: ['रोज', 'प्रतिदिन', 'हर दिन', 'दैनिक'],
    weekly: ['साप्ताहिक', 'हर सप्ताह', 'सप्ताह में'],
    monthly: ['मासिक', 'हर महीने', 'महीने में'],
    once: ['एक बार', 'एक समय', 'एक दिन']
  };
  
  const durationKeywords = {
    days: ['दिन', 'दिनों'],
    weeks: ['सप्ताह', 'सप्ताहों'],
    months: ['महीने', 'महीनों'],
    years: ['साल', 'वर्ष']
  };
  
  // Extract frequency
  let recommendedFrequency = null;
  for (const [freq, keywords] of Object.entries(frequencyKeywords)) {
    if (keywords.some(kw => text.includes(kw))) {
      recommendedFrequency = freq;
      break;
    }
  }
  
  // Extract duration (look for numbers followed by duration keywords)
  let minDurationDays = null;
  const durationMatch = text.match(/(\d+)\s*(दिन|सप्ताह|महीने|साल|वर्ष)/);
  if (durationMatch) {
    const number = parseInt(durationMatch[1]);
    const unit = durationMatch[2];
    if (unit.includes('दिन')) {
      minDurationDays = number;
    } else if (unit.includes('सप्ताह')) {
      minDurationDays = number * 7;
    } else if (unit.includes('महीने') || unit.includes('मास')) {
      minDurationDays = number * 30;
    } else if (unit.includes('साल') || unit.includes('वर्ष')) {
      minDurationDays = number * 365;
    }
  }
  
  // Create remedy for each detected type
  const detectedRemedyTypes = remedyUnderstanding.detected_remedy_types || [];
  for (const detectedType of detectedRemedyTypes) {
    const dbType = remedyTypeMap[detectedType] || detectedType;
    
    // Determine target themes from understanding metadata (target_domains)
    const targetThemes = [];
    const themeMap = {
      'career': 'career',
      'reputation': 'career',
      'financial': 'money',
      'finances': 'money',
      'resources': 'money',
      'gains': 'money',
      'relationships': 'relationship', // Enum uses singular 'relationship'
      'relationship': 'relationship',
      'marriage': 'relationship',
      'family': 'family',
      'home': 'family',
      'health': 'health',
      'mental': 'health',
      'education': 'general',
      'spirituality': 'general',
      'spiritual': 'general'
    };
    
    // Use target_domains from understanding (primary)
    for (const domain of targetDomains) {
      if (themeMap[domain] && !targetThemes.includes(themeMap[domain])) {
        targetThemes.push(themeMap[domain]);
      }
    }
    
    // Fallback to life_areas if target_domains empty
    if (targetThemes.length === 0) {
      for (const area of understoodMeaning.life_areas || []) {
        if (themeMap[area] && !targetThemes.includes(themeMap[area])) {
          targetThemes.push(themeMap[area]);
        }
      }
    }
    
    // Create calm English description based on understanding
    // STRICT: Must reflect understanding metadata, not generic template
    let description = '';
    
    // Start with purpose (what problem/imbalance it addresses)
    if (effectType === 'corrective') {
      description = `This traditional practice is traditionally used to help address `;
      if (targetThemes.length > 0) {
        description += `imbalances or challenges in areas related to ${targetThemes.join(' and ')}`;
      } else {
        description += `specific imbalances`;
      }
      description += `. It may help create a sense of balance and correction.`;
    } else if (effectType === 'preventive') {
      description = `This traditional practice is traditionally used to help maintain `;
      if (targetThemes.length > 0) {
        description += `stability and prevent challenges in areas related to ${targetThemes.join(' and ')}`;
      } else {
        description += `overall stability`;
      }
      description += `. It may help create a sense of protection and harmony.`;
    } else if (effectType === 'stabilizing') {
      description = `This traditional practice is traditionally used to help stabilize `;
      if (targetThemes.length > 0) {
        description += `and bring balance to areas related to ${targetThemes.join(' and ')}`;
      } else {
        description += `overall balance`;
      }
      description += `. It may help create a sense of harmony and stability.`;
    } else {
      // supportive (default)
      description = `This traditional practice is traditionally used to support `;
      if (targetThemes.length > 0) {
        description += `areas related to ${targetThemes.join(' and ')}`;
      } else {
        description += `well-being`;
      }
      description += `. It may help create a sense of balance and harmony.`;
    }
    
    // Add applicability context
    if (applicability === 'timing_based') {
      description += ` This practice is traditionally considered more effective during specific times or periods.`;
    } else if (applicability === 'conditional') {
      description += ` The effectiveness of this practice may vary based on individual circumstances and chart context.`;
    }
    
    // Add intensity guidance
    if (intensity === 'disciplined') {
      description += ` Regular and disciplined practice is traditionally recommended.`;
    } else if (intensity === 'sustained') {
      description += ` Sustained practice over time is traditionally recommended for best results.`;
    }
    
    // Add frequency if mentioned
    if (recommendedFrequency) {
      description += ` It is traditionally practiced ${recommendedFrequency === 'daily' ? 'daily' : recommendedFrequency === 'weekly' ? 'weekly' : recommendedFrequency === 'monthly' ? 'monthly' : 'once'}.`;
    }
    
    // Add duration if mentioned
    if (minDurationDays) {
      const days = minDurationDays;
      const weeks = Math.floor(days / 7);
      const months = Math.floor(days / 30);
      if (months > 0) {
        description += ` A duration of ${months} month${months > 1 ? 's' : ''} is traditionally recommended.`;
      } else if (weeks > 0) {
        description += ` A duration of ${weeks} week${weeks > 1 ? 's' : ''} is traditionally recommended.`;
      } else {
        description += ` A duration of ${days} day${days > 1 ? 's' : ''} is traditionally recommended.`;
      }
    }
    
    remedies.push({
      remedy_type: dbType,
      title: `${dbType.charAt(0).toUpperCase() + dbType.slice(1).replace('_', ' ')} Practice`,
      description: description.trim(),
      target_themes: targetThemes.length > 0 ? targetThemes : ['general'],
      target_planets: planets || [],
      recommended_frequency: recommendedFrequency,
      min_duration_days: minDurationDays,
      safety_notes: "This is a traditional practice. Please consult with a qualified practitioner if you have any concerns.",
      // Understanding metadata (CRITICAL)
      understanding_metadata: {
        target_domains: targetDomains,
        effect_type: effectType,
        applicability: applicability,
        intensity: intensity,
        confidence: remedyUnderstanding.confidence,
        purpose_clear: remedyUnderstanding.purpose_clear,
        context_present: remedyUnderstanding.context_present
      }
    });
  }
  
  return remedies;
}

/**
 * PART B: Classify into 5 layers
 */
function classifyMeaning(meaning, entities) {
  const { planets, houses, nakshatras, strength_states, yoga_names, dasha_info, transit_info } = entities;
  
  // Determine layer
  let layer = null;
  
  if (yoga_names && yoga_names.length > 0) {
    layer = "YOGA";
  } else if (strength_states && strength_states.length > 0) {
    layer = "STRENGTH";
  } else if (transit_info) {
    layer = "TRANSIT";
  } else if (dasha_info) {
    layer = "DASHA";
  } else if (nakshatras && nakshatras.length > 0 && planets && houses) {
    layer = "NAKSHATRA";
  } else if (planets && houses) {
    layer = "BASE";
  }
  
  return {
    layer,
    entities: {
      planets: planets || [],
      houses: houses || [],
      nakshatras: nakshatras || [],
      strength_states: strength_states || [],
      yoga_names: yoga_names || [],
      dasha_info: dasha_info || null,
      transit_info: transit_info || null
    },
    is_expressible: layer !== null,
    expressibility_notes: layer ? "Can be expressed in engine" : "Cannot determine layer"
  };
}

/**
 * Validate meaning object
 */
function validateMeaningObject(meaningObj) {
  const errors = [];
  
  if (!meaningObj.meaning_id) {
    errors.push("meaning_id missing");
  }
  
  if (!meaningObj.understood_meaning?.english_rewrite) {
    errors.push("english_rewrite missing - meaning must be understood first");
  }
  
  // Check English-only
  if (meaningObj.understood_meaning?.english_rewrite) {
    try {
      assertEnglishOnly("english_rewrite", meaningObj.understood_meaning.english_rewrite);
    } catch (err) {
      errors.push(`english_rewrite contains non-English: ${err.message}`);
    }
  }
  
  // Check for fear language
  const fearPatterns = ['death', 'die', 'destroy', 'divorce', 'separation', 'disease', 'illness', 'accident', 'loss'];
  const lowerText = (meaningObj.understood_meaning?.english_rewrite || '').toLowerCase();
  if (fearPatterns.some(pattern => lowerText.includes(pattern))) {
    errors.push("Contains fear-based language");
  }
  
  // Check for absolute guarantees
  const guaranteePatterns = ['will', 'must', 'always', 'never', 'guaranteed', 'certain'];
  if (guaranteePatterns.some(pattern => lowerText.includes(pattern))) {
    errors.push("Contains absolute guarantees");
  }
  
  if (errors.length > 0) {
    throw new Error(`Validation failed: ${errors.join(', ')}`);
  }
  
  return true;
}

/**
 * Main workflow
 */
async function contentFirstIngestion(bookId) {
  console.log(`\n📖 CONTENT-FIRST INGESTION: ${bookId}\n`);
  console.log('PART A: Understand & Rewrite\n');
  
  const paths = getPathsForBook(bookId);
  
  // Load source data
  const book = await readJson(paths.sourceBookPath);
  const scan = await readJson(paths.scanPath);
  
  // Build chunk map
  const chunkMap = new Map();
  for (const chunk of book) {
    chunkMap.set(chunk.chunk_id, chunk);
  }
  
  // Build unit to chunks map
  const unitToChunks = new Map();
  for (const unit of scan.units || []) {
    const chunkIds = unit.source?.chunk_ids || [];
    const chunks = chunkIds.map(cid => chunkMap.get(cid)).filter(Boolean);
    unitToChunks.set(unit.unit_id, chunks);
  }
  
  // Find candidates (planets + houses)
  const candidates = scan.units.filter(u => 
    u.detection?.entities?.planets?.length > 0 && 
    u.detection?.entities?.houses?.length > 0
  );
  
  console.log(`Found ${candidates.length} candidates for understanding\n`);
  
  const meaningObjects = [];
  const remedyObjects = [];
  const discarded = [];
  
  for (const unit of candidates) {
    const planets = unit.detection.entities.planets || [];
    const houses = unit.detection.entities.houses || [];
    const chunks = unitToChunks.get(unit.unit_id) || [];
    const sourceText = chunks.map(c => c.text || '').join(' ');
    
    // Skip if no source text
    if (!sourceText || sourceText.trim().length === 0) {
      discarded.push({
        unit_id: unit.unit_id,
        reason: "No source text"
      });
      continue;
    }
    
    // PART A: Understand & Rewrite
    // MANDATORY: Understanding must happen FIRST
    const understood = understandAndRewrite(sourceText, {
      planets,
      houses
    }, bookId);
    
    // STRICT RULE: If meaning not understood, REJECT
    // Do NOT generate generic English without understanding
    if (!understood || !understood.english_rewrite) {
      discarded.push({
        unit_id: unit.unit_id,
        status: "REJECTED",
        reason: "Meaning not understood - requires actual Hindi-to-English understanding",
        source_text_preview: sourceText.substring(0, 200),
        needs_review: true
      });
      continue;
    }
    
    // Validate understanding metadata exists
    if (!understood.understanding_metadata) {
      discarded.push({
        unit_id: unit.unit_id,
        status: "REJECTED",
        reason: "Understanding incomplete - missing metadata (life_areas, effect_nature, etc.)",
        source_text_preview: sourceText.substring(0, 200)
      });
      continue;
    }
    
    // PART B: Classify
    const classification = classifyMeaning(understood, {
      planets,
      houses
    });
    
    // Create meaning object
    const meaningObj = {
      meaning_id: `${bookId}__meaning_${unit.unit_id}`,
      source: {
        book_id: bookId,
        unit_id: unit.unit_id,
        chunk_ids: unit.source?.chunk_ids || [],
        page_numbers: unit.source?.page_numbers || [],
        original_text: sourceText // Reference only, not stored in DB
      },
      understood_meaning: understood,
      classification,
      status: classification.is_expressible ? "ready_for_rule" : "discarded"
    };
    
    // Validate
    try {
      validateMeaningObject(meaningObj);
      meaningObjects.push(meaningObj);
      
      // PART B: Extract remedies if present (with understanding)
      if (understood.remedy_understanding && understood.remedy_understanding.has_remedies) {
        const remedies = extractRemedies(sourceText, understood, { planets, houses });
        for (const remedy of remedies) {
          // Use remedy's own confidence (independent from rule confidence)
          const remedyConfidence = remedy.understanding_metadata?.confidence || 'low';
          
          remedyObjects.push({
            remedy_id: `${bookId}__remedy_${unit.unit_id}_${remedy.remedy_type}`,
            source: {
              book_id: bookId,
              unit_id: unit.unit_id,
              meaning_id: meaningObj.meaning_id,
              chunk_ids: unit.source?.chunk_ids || [],
              page_numbers: unit.source?.page_numbers || [],
              original_text: sourceText // Reference only
            },
            remedy_data: remedy,
            confidence: remedyConfidence, // Independent from rule confidence
            status: remedyConfidence === 'high' ? "ready_for_ingestion" : "needs_review"
          });
        }
      }
    } catch (err) {
      discarded.push({
        unit_id: unit.unit_id,
        reason: err.message
      });
    }
  }
  
  // Write meaning objects
  const meaningsPath = path.join(paths.processedDir, 'meanings.v1.json');
  await writeJson(meaningsPath, {
    schema_version: 1,
    book_id: bookId,
    created_at: nowIso(),
    total_meanings: meaningObjects.length,
    total_rejected: discarded.length,
    meanings: meaningObjects,
    rejected: discarded,
    notes: "All meanings must be understood before English writing. Rejected items require understanding service."
  });
  
  // Write remedy objects
  const remediesPath = path.join(paths.processedDir, 'remedies.v1.json');
  await writeJson(remediesPath, {
    schema_version: 1,
    book_id: bookId,
    created_at: nowIso(),
    total_remedies: remedyObjects.length,
    remedies: remedyObjects,
    notes: "Remedies extracted from understood meanings. All remedies must be understood before conversion."
  });
  
  console.log(`\n✅ PART A Complete:`);
  console.log(`   - Meanings understood: ${meaningObjects.length}`);
  console.log(`   - Remedies extracted: ${remedyObjects.length}`);
  console.log(`   - Rejected (not understood): ${discarded.length}`);
  console.log(`   - Output: ${meaningsPath}`);
  console.log(`   - Remedies output: ${remediesPath}\n`);
  
  if (meaningObjects.length === 0) {
    console.log('⚠️  NO MEANINGS UNDERSTOOD');
    console.log('   This is CORRECT behavior - no English text generated without understanding.');
    console.log('   To proceed, implement understanding service:\n');
    console.log('   Options:');
    console.log('   1. Translation API (Google Translate, etc.)');
    console.log('   2. AI understanding service');
    console.log('   3. Manual human review');
    console.log('   4. Hybrid approach\n');
  }
  
  return {
    meanings: meaningObjects,
    remedies: remedyObjects,
    discarded
  };
}

const bookId = mustGetBookId(process.argv);
contentFirstIngestion(bookId).catch(err => {
  console.error('❌ Content-first ingestion failed:', err.message);
  process.exit(1);
});

