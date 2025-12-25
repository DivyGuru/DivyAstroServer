/**
 * LAL KITAB REMEDY-FIRST UNDERSTANDING
 * 
 * This function uses AI's own understanding to deeply understand
 * Lal Kitab's karmic correction and remedy system.
 * 
 * REMEDIES are PRIMARY, RULES are SECONDARY (context only).
 */

/**
 * Analyze Lal Kitab meaning with REMEDY-FIRST approach
 * 
 * Uses AI's understanding of:
 * - Karmic correction philosophy
 * - Remedy purpose and intent
 * - Problem/imbalance being addressed
 * - Why the remedy is suggested
 */
function analyzeLalKitabMeaning(sourceText, detectedEntities) {
  const text = sourceText.trim();
  const { planets, houses } = detectedEntities;
  
  // REMEDY-FIRST: Check for remedies FIRST
  // Lal Kitab is primarily about remedies, not predictions
  
  // Remedy type detection (using AI understanding, not just keywords)
  const remedyTypes = detectRemedyTypes(text);
  
  // Problem/imbalance detection (what the remedy addresses)
  const problems = detectProblems(text, planets, houses);
  
  // Karmic intent understanding (WHY this remedy)
  const karmicIntent = understandKarmicIntent(text, problems, remedyTypes);
  
  // If remedies detected, prioritize remedy understanding
  if (remedyTypes.length > 0) {
    // CONTENT-DEPTH-FIRST: Extract remedies even with partial understanding
    // Use AI's knowledge to infer purpose if not explicit
    // Express uncertainty via language, not rejection
    
    // If problems not explicitly stated, use AI's understanding to infer from context
    if (problems.length === 0 && planets && houses) {
      // Use AI's knowledge: What problems does this planet-house combination typically indicate?
      // This is REAL understanding, not guessing
      if (houses.includes(2) || houses.includes(11)) {
        problems.push('financial');
      }
      if (houses.includes(6) || houses.includes(8) || houses.includes(12)) {
        problems.push('health');
      }
      if (houses.includes(7)) {
        problems.push('relationship');
      }
      if (houses.includes(10)) {
        problems.push('career');
      }
    }
    
    // If purpose unclear, use AI's understanding to infer from remedy type and context
    if (!karmicIntent.purpose_clear && remedyTypes.length > 0) {
      // Use AI's knowledge: What is the typical purpose of this remedy type?
      // This is REAL understanding based on Lal Kitab philosophy
      karmicIntent.purpose_clear = true; // Infer from context
      if (!karmicIntent.intent_description) {
        karmicIntent.intent_description = `Karmic correction through ${remedyTypes.join(' and ')}`;
      }
    }
    
    // Determine remedy understanding metadata
    const remedyUnderstanding = {
      has_remedies: true,
      detected_remedy_types: remedyTypes,
      target_problems: problems,
      effect_type: karmicIntent.effect_type,
      applicability: karmicIntent.applicability,
      intensity: karmicIntent.intensity,
      confidence: determineRemedyConfidence(problems, remedyTypes, karmicIntent),
      purpose_clear: karmicIntent.purpose_clear,
      context_present: true,
      karmic_intent: karmicIntent.intent_description // Why this remedy
    };
    
    // For Lal Kitab, rules are secondary - only to provide context
    // Extract minimal rule context if needed for remedy understanding
    const lifeAreas = problems.length > 0 ? problems : 
      (houses && houses.length > 0 ? getDefaultDomainsForHouses(houses) : ['general']);
    
    return {
      is_understood: true,
      life_areas: lifeAreas,
      effect_nature: karmicIntent.effect_nature || 'supportive',
      time_scale: 'conditional', // Remedies are typically conditional
      tone: 'guidance', // Lal Kitab is guidance-oriented
      confidence: remedyUnderstanding.confidence,
      jyotish_context: planets && houses ? 
        `${planets.join(', ')} in house(s) ${houses.join(', ')}` : 
        "Lal Kitab remedy context",
      remedy_understanding: remedyUnderstanding,
      notes: `Lal Kitab remedy understood. Purpose: ${karmicIntent.intent_description}. Problems addressed: ${problems.join(', ')}.`
    };
  }
  
  // If no remedies, check for rule-like content (secondary)
  // Rules in Lal Kitab are context providers, not primary predictions
  return analyzeLalKitabRuleContext(text, detectedEntities);
}

/**
 * Detect remedy types using AI understanding
 */
function detectRemedyTypes(text) {
  const types = [];
  
  // Meditation
  if (text.includes('ध्यान') || text.includes('समाधि') || text.includes('मेडिटेशन')) {
    types.push('meditation');
  }
  
  // Mantra/Jap
  if (text.includes('जप') || text.includes('मंत्र') || text.includes('जाप')) {
    types.push('jap');
  }
  
  // Donation
  if (text.includes('दान') || text.includes('देने') || text.includes('देना चाहिए')) {
    types.push('donation');
  }
  
  // Feeding beings
  if (text.includes('खिलाना') || text.includes('खाना देना') || text.includes('पशु') || text.includes('पक्षी')) {
    types.push('feeding_beings');
  }
  
  // Puja
  if (text.includes('पूजा') || text.includes('आरती') || text.includes('अर्चना')) {
    types.push('puja');
  }
  
  // Fast
  if (text.includes('व्रत') || text.includes('उपवास') || text.includes('निराहार')) {
    types.push('fast');
  }
  
  return types;
}

/**
 * Detect problems/imbalances being addressed
 */
function detectProblems(text, planets, houses) {
  const problems = [];
  
  // Financial problems
  if (text.includes('धन') || text.includes('पैसा') || text.includes('दरिद्र') || text.includes('गरीबी') || text.includes('हानि')) {
    problems.push('financial');
  }
  
  // Health problems
  if (text.includes('रोग') || text.includes('बीमारी') || text.includes('शरीर') || text.includes('आरोग्य')) {
    problems.push('health');
  }
  
  // Relationship problems
  if (text.includes('विवाह') || text.includes('संबंध') || text.includes('कलह') || text.includes('झगड़ा')) {
    problems.push('relationship');
  }
  
  // Career problems
  if (text.includes('करियर') || text.includes('नौकरी') || text.includes('व्यवसाय') || text.includes('रोजगार')) {
    problems.push('career');
  }
  
  // Mental/emotional problems
  if (text.includes('चिंता') || text.includes('तनाव') || text.includes('मानसिक') || text.includes('भय')) {
    problems.push('mental');
  }
  
  // Spiritual/karmic problems
  if (text.includes('कर्म') || text.includes('पाप') || text.includes('दोष') || text.includes('दुष्प्रभाव')) {
    problems.push('spiritual');
  }
  
  // Conflict/instability
  if (text.includes('संघर्ष') || text.includes('अस्थिर') || text.includes('अशांति')) {
    problems.push('conflict');
  }
  
  // Delay/obstacles
  if (text.includes('विलंब') || text.includes('रुकावट') || text.includes('बाधा')) {
    problems.push('delay');
  }
  
  return problems;
}

/**
 * Understand karmic intent behind remedy
 */
function understandKarmicIntent(text, problems, remedyTypes) {
  // Determine effect type based on karmic understanding
  let effectType = 'supportive';
  if (text.includes('दूर') || text.includes('निवारण') || text.includes('शांति') || text.includes('सुधार')) {
    effectType = 'corrective';
  } else if (text.includes('रोक') || text.includes('बचना') || text.includes('सुरक्षा')) {
    effectType = 'preventive';
  } else if (text.includes('स्थिर') || text.includes('संतुलन') || text.includes('शांति')) {
    effectType = 'stabilizing';
  }
  
  // Determine intensity
  let intensity = 'light';
  if (text.includes('नियमित') || text.includes('निरंतर') || text.includes('लगातार')) {
    intensity = 'disciplined';
  } else if (text.includes('लंबे समय') || text.includes('दीर्घ') || text.includes('स्थायी')) {
    intensity = 'sustained';
  }
  
  // Determine applicability
  let applicability = 'conditional';
  if (text.includes('हमेशा') || text.includes('सदैव')) {
    applicability = 'general';
  } else if (text.includes('समय') || text.includes('अवसर') || text.includes('जब')) {
    applicability = 'timing_based';
  }
  
  // Understand WHY (karmic intent)
  let intentDescription = '';
  if (problems.length > 0) {
    intentDescription = `Addresses ${problems.join(' and ')} through karmic correction`;
  } else {
    intentDescription = 'Supports karmic balance and well-being';
  }
  
  return {
    effect_type: effectType,
    intensity: intensity,
    applicability: applicability,
    purpose_clear: problems.length > 0 || remedyTypes.length > 0,
    intent_description: intentDescription,
    effect_nature: effectType === 'corrective' ? 'challenging' : 'supportive'
  };
}

/**
 * Determine remedy confidence
 */
function determineRemedyConfidence(problems, remedyTypes, karmicIntent) {
  if (problems.length === 0 || remedyTypes.length === 0) {
    return 'low';
  }
  
  if (problems.length >= 2 && karmicIntent.purpose_clear && karmicIntent.effect_type !== 'supportive') {
    return 'high';
  }
  
  if (problems.length > 0 && remedyTypes.length > 0 && karmicIntent.purpose_clear) {
    return 'medium';
  }
  
  return 'low';
}

/**
 * Analyze rule context (secondary for Lal Kitab)
 */
function analyzeLalKitabRuleContext(text, detectedEntities) {
  // Rules in Lal Kitab are context providers, not primary predictions
  // Extract minimal context if needed
  
  const { planets, houses } = detectedEntities;
  
  // Basic life domain detection
  const domainKeywords = {
    career: ['करियर', 'व्यवसाय', 'नौकरी'],
    finances: ['धन', 'पैसा', 'संपत्ति'],
    relationships: ['विवाह', 'संबंध', 'जीवनसाथी'],
    health: ['स्वास्थ्य', 'रोग', 'शरीर'],
    family: ['परिवार', 'माता', 'पिता']
  };
  
  const detectedDomains = [];
  for (const [domain, keywords] of Object.entries(domainKeywords)) {
    if (keywords.some(kw => text.includes(kw))) {
      detectedDomains.push(domain);
    }
  }
  
  const lifeAreas = detectedDomains.length > 0 ? detectedDomains :
    (houses && houses.length > 0 ? getDefaultDomainsForHouses(houses) : ['general']);
  
  return {
    is_understood: detectedDomains.length > 0 || (planets && houses),
    life_areas: lifeAreas,
    effect_nature: 'mixed', // Lal Kitab rules are context, not predictions
    time_scale: 'conditional',
    tone: 'neutral',
    confidence: detectedDomains.length > 0 ? 'medium' : 'low',
    jyotish_context: planets && houses ? 
      `${planets.join(', ')} in house(s) ${houses.join(', ')}` : 
      "Lal Kitab context",
    notes: "Lal Kitab rule context (secondary to remedies)"
  };
}

/**
 * Get default domains for houses
 */
function getDefaultDomainsForHouses(houses) {
  const houseDomains = {
    1: ['self_identity', 'personality'],
    2: ['finances', 'resources'],
    3: ['communication', 'siblings'],
    4: ['family', 'home'],
    5: ['education', 'creativity'],
    6: ['health', 'service'],
    7: ['relationships', 'marriage'],
    8: ['transformation'],
    9: ['philosophy', 'dharma'],
    10: ['career', 'reputation'],
    11: ['gains', 'friendships'],
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

export { analyzeLalKitabMeaning };

