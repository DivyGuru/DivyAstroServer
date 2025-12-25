/**
 * Narrative Composer Layer
 * 
 * Converts structured domain signals into natural, human-readable kundli text.
 * 
 * This layer:
 * - Transforms signals + time patches into flowing paragraphs
 * - Uses calm, grounded, thoughtful language
 * - Hides technical details (planets, yogas, rule IDs)
 * - Creates one paragraph per domain
 * 
 * This layer DOES NOT:
 * - Generate AI-like bullet points
 * - Mention planet names or technical terms
 * - Create fear-based predictions
 * - Use exact dates
 */

/**
 * Domain-specific vocabulary and framing
 */
const DOMAIN_VOCABULARY = {
  money_finance: {
    area: 'financial life',
    framing: {
      focus: ['stability', 'planning', 'flow', 'resource management'],
      action: ['building', 'managing', 'planning', 'protecting'],
      concern: ['security', 'sustainability', 'balance', 'growth']
    },
    themeMap: {
      'money': 'financial resources',
      'business': 'business ventures',
      'wealth': 'wealth accumulation',
      'income': 'earning capacity',
      'expense': 'expense management',
      'savings': 'savings and security'
    }
  },
  career_direction: {
    area: 'professional life',
    framing: {
      focus: ['effort', 'direction', 'responsibility', 'growth'],
      action: ['building', 'developing', 'navigating', 'advancing'],
      concern: ['progress', 'recognition', 'stability', 'fulfillment']
    },
    themeMap: {
      'career': 'career path',
      'work': 'work environment',
      'job': 'job stability',
      'skill': 'skill development',
      'promotion': 'career advancement',
      'change': 'career transitions'
    }
  },
  relationships: {
    area: 'relationships',
    framing: {
      focus: ['communication', 'understanding', 'harmony', 'connection'],
      action: ['nurturing', 'building', 'maintaining', 'deepening'],
      concern: ['mutual respect', 'emotional safety', 'trust', 'compatibility']
    },
    themeMap: {
      'relationship': 'interpersonal bonds',
      'partnership': 'partnership dynamics',
      'marriage': 'marital harmony',
      'family': 'family connections',
      'social': 'social interactions',
      'love': 'romantic connections'
    }
  },
  family_home: {
    area: 'family and home life',
    framing: {
      focus: ['harmony', 'support', 'stability', 'nurturing'],
      action: ['strengthening', 'protecting', 'caring', 'unifying'],
      concern: ['family bonds', 'home environment', 'mutual support', 'peace']
    },
    themeMap: {
      'family': 'family relationships',
      'home': 'home environment',
      'parents': 'parental relationships',
      'children': 'parenting',
      'siblings': 'sibling bonds'
    }
  },
  health_body: {
    area: 'health and well-being',
    framing: {
      focus: ['balance', 'recovery', 'habits', 'vitality'],
      action: ['maintaining', 'restoring', 'protecting', 'enhancing'],
      concern: ['physical strength', 'energy levels', 'resilience', 'longevity']
    },
    themeMap: {
      'health': 'overall health',
      'body': 'physical well-being',
      'energy': 'energy levels',
      'recovery': 'healing and recovery',
      'lifestyle': 'lifestyle balance'
    }
  },
  mental_state: {
    area: 'mental and emotional well-being',
    framing: {
      focus: ['clarity', 'peace', 'resilience', 'awareness'],
      action: ['cultivating', 'developing', 'strengthening', 'nurturing'],
      concern: ['emotional balance', 'mental clarity', 'inner peace', 'self-awareness']
    },
    themeMap: {
      'mental': 'mental clarity',
      'emotional': 'emotional balance',
      'stress': 'stress management',
      'peace': 'inner peace',
      'clarity': 'mental clarity'
    }
  },
  spiritual_growth: {
    area: 'spiritual growth',
    framing: {
      focus: ['practice', 'understanding', 'connection', 'transformation'],
      action: ['deepening', 'exploring', 'practicing', 'integrating'],
      concern: ['inner wisdom', 'spiritual connection', 'purpose', 'transcendence']
    },
    themeMap: {
      'spiritual': 'spiritual development',
      'practice': 'spiritual practices',
      'growth': 'inner growth',
      'wisdom': 'spiritual wisdom'
    }
  },
  timing_luck: {
    area: 'timing and opportunities',
    framing: {
      focus: ['readiness', 'awareness', 'patience', 'action'],
      action: ['recognizing', 'seizing', 'preparing', 'waiting'],
      concern: ['favorable moments', 'opportunity windows', 'right timing', 'preparation']
    },
    themeMap: {
      'timing': 'life timing',
      'opportunity': 'opportunities',
      'luck': 'favorable conditions',
      'chance': 'chance events'
    }
  },
  events_changes: {
    area: 'life changes and events',
    framing: {
      focus: ['adaptation', 'preparation', 'acceptance', 'transition'],
      action: ['navigating', 'adapting', 'preparing', 'embracing'],
      concern: ['smooth transitions', 'positive change', 'readiness', 'resilience']
    },
    themeMap: {
      'change': 'life changes',
      'transition': 'transitions',
      'event': 'significant events',
      'transformation': 'personal transformation'
    }
  },
  self_identity: {
    area: 'self-identity and personal growth',
    framing: {
      focus: ['discovery', 'clarity', 'authenticity', 'growth'],
      action: ['exploring', 'understanding', 'embracing', 'developing'],
      concern: ['self-awareness', 'authentic expression', 'personal values', 'identity clarity']
    },
    themeMap: {
      'identity': 'self-identity',
      'self': 'self-understanding',
      'growth': 'personal growth',
      'authenticity': 'authentic self'
    }
  }
};

/**
 * Generates domain-specific opening sentence using themes and metrics
 */
/**
 * Generates domain-specific opening sentence
 * 
 * 5-LAYER COMPATIBILITY:
 * - Adapts tone based on active layers
 * - Strength/Yoga present → more confidence/stability language
 * - Never mentions planets, nakshatra, yoga names
 */
function generateOpening(domain, metrics, vocab, themes = [], hasStrengthYoga = false, mahadashaTone = null, coreLifePhase = null) {
  const { pressure, support, stability } = metrics;
  const framing = vocab.framing;
  
  // GLOBAL LIFE-PHASE COHERENCE: Ensure all domains share emotional gravity
  // If core life phase is heavy, all domains should reflect that weight
  const effectivePressure = coreLifePhase?.emotionalGravity === 'heavy' && pressure === 'low' 
    ? 'medium' 
    : coreLifePhase?.emotionalGravity === 'light' && pressure === 'high'
    ? 'medium'
    : pressure;
  
  const effectiveSupport = coreLifePhase?.emotionalGravity === 'heavy' && support === 'high'
    ? 'medium'
    : coreLifePhase?.emotionalGravity === 'light' && support === 'low'
    ? 'medium'
    : support;
  
  // ASTROLOGICAL AUTHENTICITY: Mahadasha dominance - if active, it must color all predictions
  if (mahadashaTone && mahadashaTone.weight >= 1.3) {
    // Heavy mahadasha (Saturn, Rahu, Ketu, Mars) - must dominate tone
    if (domain === 'career_direction' && mahadashaTone.planet === 'SATURN') {
      return `Professional responsibilities feel heavier now. ${mahadashaTone.experience}`;
    }
    if (domain === 'mental_state' && mahadashaTone.planet === 'SATURN') {
      return `Mental and emotional well-being feels more strained now. ${mahadashaTone.experience}`;
    }
    if (domain === 'money_finance' && mahadashaTone.planet === 'SATURN') {
      return `Financial planning requires careful attention. ${mahadashaTone.experience}`;
    }
  }
  
  // Use effective metrics for coherence
  const adjustedMetrics = { ...metrics, pressure: effectivePressure, support: effectiveSupport };
  
  // 5-LAYER COMPATIBILITY: Adapt tone if Strength/Yoga present
  const confidenceBoost = hasStrengthYoga ? 'more clearly' : '';
  const stabilityBoost = hasStrengthYoga ? 'with greater stability' : '';
  
  // Use first theme to add specificity, or use domain framing
  const primaryTheme = themes.length > 0 ? themes[0] : null;
  const themeContext = primaryTheme && vocab.themeMap && vocab.themeMap[primaryTheme] 
    ? vocab.themeMap[primaryTheme] 
    : framing.focus[0];
  
  // PAIN-FIRST UX: Start with FELT EXPERIENCE, not astrological rules
  // Structure: Pain → Validation → Direction → Calm close
  if (domain === 'career_direction') {
    if (effectivePressure === 'high' && effectiveSupport === 'low') {
      return `Effort feels heavy and results feel delayed. Work demands more than it gives back right now.`;
    }
    if (effectivePressure === 'high' && effectiveSupport === 'medium') {
      return `Work pressure increases while opportunities appear. You're juggling demands and possibilities.`;
    }
    if (effectiveSupport === 'high' && effectivePressure === 'low') {
      return `Career momentum builds. Recognition and opportunities arrive more easily.`;
    }
    if (stability === 'low') {
      return `Your professional direction shifts. What worked before may not work now.`;
    }
    return `Work moves forward steadily. New opportunities emerge gradually.`;
  }
  
  if (domain === 'money_finance') {
    if (effectivePressure === 'high' && effectiveSupport === 'low') {
      return `Money feels tight. Expenses outpace income, and savings feel out of reach.`;
    }
    if (effectivePressure === 'high' && effectiveSupport === 'medium') {
      return `Financial pressure exists alongside growth possibilities. You're managing constraints while building resources.`;
    }
    if (effectiveSupport === 'high' && effectivePressure === 'low') {
      return `Financial stability improves. Income flows more steadily and savings grow.`;
    }
    if (stability === 'low') {
      return `Your financial situation changes. Old patterns no longer serve you.`;
    }
    return `Money flows steadily. Long-term security builds gradually.`;
  }
  
  if (domain === 'relationships') {
    if (effectivePressure === 'high' && effectiveSupport === 'low') {
      return `Relationships feel strained. Misunderstandings happen easily, and connection feels harder to maintain.`;
    }
    if (effectivePressure === 'high' && effectiveSupport === 'medium') {
      return `Relationships bring both closeness and tension. You're navigating connection and conflict together.`;
    }
    if (effectiveSupport === 'high' && effectivePressure === 'low') {
      return `Relationships feel easier. Understanding flows naturally and bonds deepen.`;
    }
    if (stability === 'low') {
      return `Your relationships change. Old ways of connecting no longer fit.`;
    }
    return `Relationships move steadily. Connection and individual needs coexist.`;
  }
  
  if (domain === 'health_body') {
    if (effectivePressure === 'high' && effectiveSupport === 'low') {
      return `Energy feels low. Physical demands drain you, and recovery takes longer than expected.`;
    }
    if (effectivePressure === 'high' && effectiveSupport === 'medium') {
      return `Your body faces demands while healing continues. You're managing activity and rest.`;
    }
    if (effectiveSupport === 'high' && effectivePressure === 'low') {
      return `Physical energy improves. Strength returns and vitality feels more accessible.`;
    }
    if (stability === 'low') {
      return `Your health patterns shift. Old routines may not work as well.`;
    }
    return `Physical well-being continues steadily. Energy and strength maintain.`;
  }
  
  if (domain === 'family_home') {
    if (effectivePressure === 'high' && effectiveSupport === 'low') {
      return `Family responsibilities feel heavier. Home life demands more energy than it provides.`;
    }
    if (effectiveSupport === 'high' && effectivePressure === 'low') {
      return `Family connection strengthens. Home feels more supportive and stable.`;
    }
    if (stability === 'low') {
      return `Family dynamics change. Old patterns shift and new ways of relating emerge.`;
    }
    return `Family life moves steadily. Individual needs and collective harmony coexist.`;
  }
  
  if (domain === 'mental_state') {
    if (effectivePressure === 'high' && effectiveSupport === 'low') {
      return `Your mind feels tired. Thoughts race, emotions feel heavy, and peace feels distant.`;
    }
    if (effectiveSupport === 'high' && effectivePressure === 'low') {
      return `Mental clarity improves. Emotions settle and inner peace feels more accessible.`;
    }
    if (stability === 'low') {
      return `Your emotional patterns shift. Old ways of managing feelings no longer work.`;
    }
    return `Mental well-being continues steadily. Clarity and emotional stability maintain.`;
  }
  
  if (domain === 'spiritual_growth') {
    if (effectivePressure === 'high' && effectiveSupport === 'low') {
      return `Spiritual practice feels blocked. Connection feels distant and meaning feels unclear.`;
    }
    if (effectivePressure === 'high' && effectiveSupport === 'medium') {
      return `Spiritual growth brings both obstacles and insights. You're navigating challenges while deepening understanding.`;
    }
    if (effectiveSupport === 'high' && effectivePressure === 'low') {
      return `Spiritual connection deepens. Inner wisdom and understanding feel more accessible.`;
    }
    if (stability === 'low') {
      return `Your spiritual understanding shifts. Old perspectives give way to new insights.`;
    }
    return `Spiritual practice continues steadily. Awareness and connection deepen gradually.`;
  }
  
  if (domain === 'timing_luck') {
    if (effectivePressure === 'high' && effectiveSupport === 'low') {
      return `Timing feels off. Opportunities don't arrive when you need them, and decisions feel harder to make.`;
    }
    if (effectivePressure === 'high' && effectiveSupport === 'medium') {
      return `Timing is mixed. Some opportunities arrive while others require waiting.`;
    }
    if (effectiveSupport === 'high' && effectivePressure === 'low') {
      return `Timing feels favorable. Opportunities arrive when you need them.`;
    }
    if (stability === 'low') {
      return `Timing patterns shift. What worked before may not work now.`;
    }
    return `Timing remains steady. Opportunities emerge gradually.`;
  }
  
  if (domain === 'events_changes') {
    if (effectivePressure === 'high' && effectiveSupport === 'low') {
      return `Change feels difficult. Transitions bring uncertainty and adaptation feels forced.`;
    }
    if (effectivePressure === 'high' && effectiveSupport === 'medium') {
      return `Change brings both challenges and possibilities. You're navigating transitions while finding new ground.`;
    }
    if (effectiveSupport === 'high' && effectivePressure === 'low') {
      return `Change flows smoothly. Transitions feel natural and new opportunities arrive.`;
    }
    if (stability === 'low') {
      return `Change accelerates. Old patterns break and new ones form.`;
    }
    return `Change continues steadily. Transitions unfold gradually.`;
  }
  
  if (domain === 'self_identity') {
    if (effectivePressure === 'high' && effectiveSupport === 'low') {
      return `You feel uncertain about who you are. Self-doubt increases and clarity about your identity feels distant.`;
    }
    if (effectivePressure === 'high' && effectiveSupport === 'medium') {
      return `Self-questioning and self-discovery happen together. You're navigating doubt while finding clarity.`;
    }
    if (effectiveSupport === 'high' && effectivePressure === 'low') {
      return `Self-awareness deepens. You feel clearer about who you are and what you value.`;
    }
    if (stability === 'low') {
      return `Your sense of self changes. Old self-understandings shift and new ones form.`;
    }
    return `Self-discovery continues steadily. Clarity about your identity builds gradually.`;
  }
  
  // Generic fallback with theme context - PAIN-FIRST UX
  // GLOBAL LIFE-PHASE COHERENCE: Use effective metrics
  if (effectivePressure === 'high' && effectiveSupport === 'low') {
    return `${themeContext.charAt(0).toUpperCase() + themeContext.slice(1)} feels difficult. Progress feels slow and effort feels heavy.`;
  }
  
  if (effectiveSupport === 'high' && effectivePressure === 'low') {
    return `${themeContext.charAt(0).toUpperCase() + themeContext.slice(1)} feels easier. Positive developments arrive more naturally.`;
  }
  
  if (stability === 'low') {
    return `${themeContext.charAt(0).toUpperCase() + themeContext.slice(1)} shifts. Old patterns change and new ones form.`;
  }
  
  return `${themeContext.charAt(0).toUpperCase() + themeContext.slice(1)} continues steadily. Progress unfolds gradually.`;
}

/**
 * Generates domain-specific explanation sentence using themes
 */
/**
 * Generate brief validation (optional astrology context)
 * PAIN-FIRST UX: Astrology comes AFTER validation, brief and optional
 */
function generateValidation(domain, metrics, vocab, hasDasha = false, hasTransit = false) {
  // Very brief, optional - only if it adds context
  // Most of the time, return null (skip validation)
  if (hasDasha) {
    return `This pattern reflects longer-term cycles.`;
  }
  if (hasTransit) {
    return `Current planetary movements influence this.`;
  }
  return null; // Skip validation most of the time
}

/**
 * Generates domain-specific direction (what to do)
 * PAIN-FIRST UX: Direction comes after pain and validation
 * Remove generic self-help language (flexibility, adaptability, openness, balance)
 * 
 * 5-LAYER COMPATIBILITY:
 * - Adapts tone based on active layers
 * - Strength/Yoga present → more confidence language
 * - Never mentions planets, nakshatra, yoga names
 */
function generateExplanation(domain, metrics, vocab, themes = [], hasStrengthYoga = false, mahadashaTone = null, coreLifePhase = null) {
  const { pressure, support, stability } = metrics;
  const framing = vocab.framing;
  
  // 5-LAYER COMPATIBILITY: Adapt tone if Strength/Yoga present
  const confidenceBoost = hasStrengthYoga ? 'more consistently' : '';
  
  // Use themes to add specificity
  const themeContext = themes.length > 0 && vocab.themeMap && vocab.themeMap[themes[0]]
    ? vocab.themeMap[themes[0]]
    : framing.focus[0];
  
  // PAIN-FIRST UX: Direction comes after validation
  // Remove generic self-help language (flexibility, adaptability, openness, balance)
  if (domain === 'career_direction') {
    if (pressure === 'high' && stability === 'low') {
      return `Build skills and show reliability. These matter more than quick advancement.`;
    }
    if (support === 'high' && stability === 'high') {
      return `A solid foundation supports career growth, recognition, and meaningful advancement.`;
    }
    if (pressure === 'high' && support === 'medium') {
      return `Manage professional responsibilities while making strategic moves. Skill development helps maintain progress.`;
    }
    if (stability === 'low') {
      return `Your career direction shifts. New paths may serve you better than old ones.`;
    }
    return `Professional development continues steadily. New career opportunities emerge gradually.`;
  }
  
  if (domain === 'money_finance') {
    if (pressure === 'high' && stability === 'low') {
      return `Budget carefully and protect existing resources. Building security gradually matters more than quick gains.`;
    }
    if (support === 'high' && stability === 'high') {
      return `Favorable conditions support financial growth, savings accumulation, and sustainable wealth-building.`;
    }
    if (pressure === 'high' && support === 'medium') {
      return `Manage financial constraints while building resources. Strategic planning helps maintain stability.`;
    }
    if (stability === 'low') {
      return `Your financial approach shifts. New strategies may serve you better.`;
    }
    return `Financial planning continues steadily. Resource management supports long-term security.`;
  }
  
  if (domain === 'relationships') {
    if (pressure === 'high' && stability === 'low') {
      return `Communicate patiently and understand different perspectives. Connection through challenges helps restore harmony.`;
    }
    if (support === 'high' && stability === 'high') {
      return `Favorable conditions support deepening relationships, building trust, and experiencing greater harmony.`;
    }
    if (pressure === 'high' && support === 'medium') {
      return `Honor your individual needs while maintaining relationship harmony. Mutual understanding helps maintain connection.`;
    }
    if (stability === 'low') {
      return `Your relationship patterns shift. New ways of connecting may serve you better.`;
    }
    return `Relationship-building continues steadily. Connection and individual growth coexist.`;
  }
  
  if (domain === 'health_body') {
    if (pressure === 'high' && stability === 'low') {
      return `Rest and recovery matter more than pushing limits. Build sustainable health habits gradually.`;
    }
    if (support === 'high' && stability === 'high') {
      return `Favorable conditions support physical strength, energy restoration, and overall vitality.`;
    }
    if (pressure === 'high' && support === 'medium') {
      return `Manage physical demands while prioritizing recovery. Supportive health practices help maintain well-being.`;
    }
    if (stability === 'low') {
      return `Your health routines shift. New patterns may serve you better.`;
    }
    return `Health maintenance continues steadily. Physical well-being maintains.`;
  }
  
  if (domain === 'family_home') {
    if (pressure === 'high' && stability === 'low') {
      return `Practice patience and mutual understanding. Creating a supportive home environment matters despite challenges.`;
    }
    if (support === 'high' && stability === 'high') {
      return `Favorable conditions support family harmony, domestic stability, and deeper family connections.`;
    }
    if (stability === 'low') {
      return `Your family dynamics shift. New ways of relating may serve you better.`;
    }
    return `Family-building continues steadily. Individual needs and collective harmony coexist.`;
  }
  
  if (domain === 'mental_state') {
    if (pressure === 'high' && stability === 'low') {
      return `Practice self-awareness and emotional regulation. Inner peace through challenges takes priority.`;
    }
    if (support === 'high' && stability === 'high') {
      return `Favorable conditions support mental clarity, emotional stability, and inner peace.`;
    }
    if (stability === 'low') {
      return `Your emotional patterns shift. New ways of managing feelings may serve you better.`;
    }
    return `Mental well-being continues steadily. Clarity and emotional stability maintain.`;
  }
  
  if (domain === 'spiritual_growth') {
    if (pressure === 'high' && stability === 'low') {
      return `Practice consistently and contemplate deeply. Connecting to spiritual wisdom takes priority.`;
    }
    if (support === 'high' && stability === 'high') {
      return `Favorable conditions support spiritual insight, inner transformation, and deeper spiritual understanding.`;
    }
    if (pressure === 'high' && support === 'medium') {
      return `Navigate spiritual challenges while deepening practice. Growth opportunities help maintain progress.`;
    }
    if (stability === 'low') {
      return `Your spiritual understanding shifts. New perspectives may serve you better.`;
    }
    return `Spiritual development continues steadily. Awareness of your spiritual path deepens gradually.`;
  }
  
  if (domain === 'timing_luck') {
    if (pressure === 'high' && stability === 'low') {
      return `Wait and prepare carefully. More favorable conditions matter before making significant moves.`;
    }
    if (support === 'high' && stability === 'high') {
      return `Favorable timing supports important decisions and actions, with opportunities more readily available.`;
    }
    if (pressure === 'high' && support === 'medium') {
      return `Practice patience while staying ready to act. Favorable moments help maintain progress.`;
    }
    if (stability === 'low') {
      return `Your timing patterns shift. New approaches may serve you better.`;
    }
    return `Timing remains steady. Favorable moments for important matters emerge gradually.`;
  }
  
  if (domain === 'events_changes') {
    if (pressure === 'high' && stability === 'low') {
      return `Prepare carefully and navigate transitions thoughtfully. Significant life changes take priority.`;
    }
    if (support === 'high' && stability === 'high') {
      return `Favorable conditions support positive change, smooth transitions, and meaningful life developments.`;
    }
    if (pressure === 'high' && support === 'medium') {
      return `Navigate change challenges while recognizing growth opportunities. Positive transformation helps maintain stability.`;
    }
    if (stability === 'low') {
      return `Your life patterns shift. New directions may serve you better.`;
    }
    return `Life changes continue steadily. Positive developments emerge gradually.`;
  }
  
  if (domain === 'self_identity') {
    if (pressure === 'high' && stability === 'low') {
      return `Reflect honestly and explore your authentic values. Understanding who you truly are takes priority.`;
    }
    if (support === 'high' && stability === 'high') {
      return `Favorable conditions support self-clarity, authentic self-expression, and alignment with your true identity.`;
    }
    if (pressure === 'high' && support === 'medium') {
      return `Navigate self-questioning while recognizing self-discovery opportunities. Authentic growth helps maintain progress.`;
    }
    if (stability === 'low') {
      return `Your self-understanding shifts. New ways of expressing yourself may serve you better.`;
    }
    return `Self-discovery continues steadily. Authentic personal development unfolds gradually.`;
  }
  
  // Generic fallback with theme context - Natural, varied phrasing
  if (pressure === 'high' && stability === 'low') {
    return `${framing.action[0].charAt(0).toUpperCase() + framing.action[0].slice(1)} ${themeContext} steadily matters more than seeking quick results.`;
  }
  
  if (support === 'high' && stability === 'high') {
    return `Favorable conditions support ${framing.action[0]} ${themeContext} and meaningful progress.`;
  }
  
  if (stability === 'low') {
    return `Flexibility in approach and openness to new ways of ${framing.action[0]} ${themeContext} may benefit you.`;
  }
  
  return `Steady ${framing.action[0]} continues while remaining attentive to ${themeContext}.`;
}

/**
 * Generates time awareness sentences
 * 
 * 5-LAYER COMPATIBILITY:
 * - Dasha sensitivity → long-term framing ("over the coming years")
 * - Transit sensitivity → caution language ("during certain periods")
 * - If layers inactive, does NOT hint at them
 */
function generateTimeAwareness(timeWindows, vocab, hasDasha = false, hasTransit = false) {
  const sentences = [];
  
  // 5-LAYER COMPATIBILITY: Year patches (from DASHA layer)
  // Only generate if DASHA rules exist OR year patches exist
  if (timeWindows.years && timeWindows.years.length > 0) {
    const yearPatch = timeWindows.years[0]; // Use first year patch
    const duration = yearPatch.to - yearPatch.from + 1;
    
    // 5-LAYER COMPATIBILITY: Long-term framing for DASHA sensitivity
    const timeFrame = hasDasha ? 'over the coming years' : `over the coming ${duration > 1 ? 'years' : 'year'}`;
    
    if (yearPatch.nature === 'consolidation') {
      sentences.push(`${timeFrame}, consistent effort and thoughtful planning can gradually strengthen your position.`);
    } else if (yearPatch.nature === 'growth') {
      sentences.push(`${timeFrame}, opportunities for growth and development are more accessible.`);
    } else if (yearPatch.nature === 'restructuring') {
      sentences.push(`${timeFrame}, this phase may require adjustments and reorganization.`);
    } else if (yearPatch.nature === 'sensitive') {
      sentences.push(`${timeFrame}, this period requires careful attention and thoughtful decision-making.`);
    } else if (yearPatch.nature === 'transition') {
      sentences.push(`${timeFrame}, this phase involves transitions that benefit from patient adaptation.`);
    } else {
      sentences.push(`${timeFrame}, this period offers a foundation for steady progress.`);
    }
  } else if (hasDasha) {
    // 5-LAYER COMPATIBILITY: DASHA rules exist but no patches (metrics insufficient)
    // Don't hint at it - just skip time awareness
  }
  
  // 5-LAYER COMPATIBILITY: Month patches (from TRANSIT layer)
  // Only generate if TRANSIT rules exist OR month patches exist
  if (timeWindows.months && timeWindows.months.length > 0) {
    const monthPatch = timeWindows.months[0]; // Use first month patch
    
    // 5-LAYER COMPATIBILITY: Caution language for TRANSIT sensitivity
    if (monthPatch.nature === 'decision_sensitive') {
      sentences.push(`Particular care is advised during certain periods when decisions made in haste may have longer-lasting consequences.`);
    } else if (monthPatch.nature === 'caution_required') {
      sentences.push(`Certain short periods may require extra caution and careful planning.`);
    } else if (monthPatch.nature === 'supportive') {
      sentences.push(`Some periods may offer more favorable conditions for important decisions and actions.`);
    } else if (monthPatch.nature === 'volatile') {
      sentences.push(`Some periods may see more frequent changes, requiring flexibility and adaptability.`);
    }
  } else if (hasTransit) {
    // 5-LAYER COMPATIBILITY: TRANSIT rules exist but no patches (metrics insufficient)
    // Don't hint at it - just skip time awareness
  }
  
  return sentences.join(' ');
}

/**
 * Generates calm closing (PAIN-FIRST UX)
 * Calm, reassuring, grounding - not prescriptive
 * Remove generic self-help language
 */
function generateClosing(domain, metrics, vocab, themes = []) {
  const { pressure, support, stability } = metrics;
  
  // Calm closes - reassuring, not prescriptive
  if (domain === 'career_direction') {
    if (pressure === 'high') {
      return `This phase will pass. Steady effort builds stability over time.`;
    }
    if (support === 'high') {
      return `This period supports your professional growth.`;
    }
    return `Your career path continues to unfold.`;
  }
  
  if (domain === 'money_finance') {
    if (pressure === 'high') {
      return `This phase will pass. Careful planning builds security over time.`;
    }
    if (support === 'high') {
      return `This period supports your financial growth.`;
    }
    return `Your financial situation continues to stabilize.`;
  }
  
  if (domain === 'relationships') {
    if (pressure === 'high') {
      return `This phase will pass. Patience and understanding restore connection over time.`;
    }
    if (support === 'high') {
      return `This period supports deeper bonds.`;
    }
    return `Your relationships continue to deepen.`;
  }
  
  if (domain === 'health_body') {
    if (pressure === 'high') {
      return `This phase will pass. Rest and recovery restore energy over time.`;
    }
    if (support === 'high') {
      return `This period supports your physical well-being.`;
    }
    return `Your health continues to stabilize.`;
  }
  
  if (domain === 'family_home') {
    if (pressure === 'high') {
      return `This phase will pass. Patience and mutual support strengthen bonds over time.`;
    }
    if (support === 'high') {
      return `This period supports family harmony.`;
    }
    return `Your family life continues to stabilize.`;
  }
  
  if (domain === 'mental_state') {
    if (pressure === 'high') {
      return `This phase will pass. Self-awareness and emotional regulation restore peace over time.`;
    }
    if (support === 'high') {
      return `This period supports your mental well-being.`;
    }
    return `Your mental clarity continues to stabilize.`;
  }
  
  if (domain === 'spiritual_growth') {
    if (pressure === 'high') {
      return `This phase will pass. Consistent practice deepens understanding over time.`;
    }
    if (support === 'high') {
      return `This period supports your spiritual growth.`;
    }
    return `Your spiritual practice continues to deepen.`;
  }
  
  if (domain === 'timing_luck') {
    if (pressure === 'high') {
      return `This phase will pass. Patience and preparation help recognize opportunities over time.`;
    }
    if (support === 'high') {
      return `This period supports favorable timing.`;
    }
    return `Timing continues to stabilize.`;
  }
  
  if (domain === 'events_changes') {
    if (pressure === 'high') {
      return `This phase will pass. Careful preparation helps navigate transitions over time.`;
    }
    if (support === 'high') {
      return `This period supports positive change.`;
    }
    return `Life changes continue to unfold.`;
  }
  
  if (domain === 'self_identity') {
    if (pressure === 'high') {
      return `This phase will pass. Honest reflection clarifies your identity over time.`;
    }
    if (support === 'high') {
      return `This period supports self-clarity.`;
    }
    return `Your self-understanding continues to deepen.`;
  }
  
  // Generic fallback - calm, reassuring
  if (pressure === 'high') {
    return `This phase will pass. Steady effort builds stability over time.`;
  }
  
  if (support === 'high') {
    return `This period supports your growth.`;
  }
  
  return `Your path continues to unfold.`;
}

/**
 * Check if two sentences are too similar (repetition detection)
 */
function isSimilarSentence(s1, s2) {
  if (!s1 || !s2) return false;
  
  // Normalize sentences
  const n1 = s1.toLowerCase().replace(/[^\w\s]/g, '').trim();
  const n2 = s2.toLowerCase().replace(/[^\w\s]/g, '').trim();
  
  // Check for high word overlap
  const words1 = new Set(n1.split(/\s+/));
  const words2 = new Set(n2.split(/\s+/));
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  const similarity = intersection.size / union.size;
  
  // Also check for repetitive patterns
  const repetitivePatterns = [
    /this period|this phase/gi,
    /emphasizes|requires|supports|provides/gi
  ];
  
  const patternMatch = repetitivePatterns.some(pattern => {
    const matches1 = (s1.match(pattern) || []).length;
    const matches2 = (s2.match(pattern) || []).length;
    return matches1 > 0 && matches2 > 0 && matches1 === matches2;
  });
  
  return similarity > 0.6 || patternMatch;
}

/**
 * Composes narrative paragraph for a single domain
 * 
 * 5-LAYER COMPATIBILITY:
 * - Never mentions planets, nakshatra, yoga names
 * - Internally adapts tone based on layers:
 *   - Strength/Yoga present → more confidence/stability language
 *   - Dasha sensitivity → long-term framing ("over the coming years")
 *   - Transit sensitivity → caution language ("during certain periods")
 * - If a layer is inactive, narrative does NOT hint at it
 * 
 * QUALITY: Reduces repetition, limits to 1-2 concise sentences
 */
/**
 * Extract current mahadasha planet from domain signal context
 * ASTROLOGICAL AUTHENTICITY: Mahadasha must dominate tone
 */
function extractCurrentMahadasha(domainSignal) {
  // Check if mahadasha info is in astro snapshot metadata
  // This would be passed through from the prediction engine
  const mahadasha = domainSignal._mahadasha_context?.current_mahadasha || null;
  return mahadasha ? mahadasha.toUpperCase() : null;
}

/**
 * Get mahadasha tone weight - how much it should dominate predictions
 * ASTROLOGICAL AUTHENTICITY: Saturn Mahadasha = pressure, delay, isolation, karmic weight
 */
function getMahadashaToneWeight(mahadasha) {
  if (!mahadasha) return null;
  
  const tones = {
    'SATURN': {
      weight: 1.5, // Heavy dominance
      feeling: 'pressure, delay, isolation, karmic weight',
      experience: 'This period emphasizes responsibility, discipline, and long-term restructuring. You may feel pressure, delays, or isolation as karmic lessons unfold.'
    },
    'RAHU': {
      weight: 1.4,
      feeling: 'material desires, restlessness, unconventional paths',
      experience: 'This period brings strong material desires and restlessness. Unconventional paths and sudden changes may dominate your experience.'
    },
    'KETU': {
      weight: 1.4,
      feeling: 'detachment, spiritual focus, loss, karmic resolution',
      experience: 'This period emphasizes detachment and spiritual focus. You may experience losses or karmic resolution as you move toward liberation.'
    },
    'MARS': {
      weight: 1.3,
      feeling: 'action, conflict, energy, courage',
      experience: 'This period brings intense energy and action. Conflicts may arise, requiring courage and assertive energy.'
    },
    'SUN': {
      weight: 1.2,
      feeling: 'authority, leadership, confidence, visibility',
      experience: 'This period emphasizes authority and leadership. Your confidence and visibility increase.'
    },
    'MOON': {
      weight: 1.1,
      feeling: 'emotional patterns, intuition, inner security',
      experience: 'This period focuses on emotional patterns and inner security. Your intuition and emotional awareness deepen.'
    },
    'MERCURY': {
      weight: 1.1,
      feeling: 'communication, learning, intellectual pursuits',
      experience: 'This period emphasizes communication and learning. Intellectual pursuits and mental activity increase.'
    },
    'JUPITER': {
      weight: 1.0,
      feeling: 'wisdom, expansion, growth, spirituality',
      experience: 'This period brings wisdom and expansion. Growth opportunities and spiritual development are supported.'
    },
    'VENUS': {
      weight: 1.0,
      feeling: 'relationships, beauty, material comforts',
      experience: 'This period emphasizes relationships and material comforts. Harmony and pleasure are more accessible.'
    }
  };
  
  return tones[mahadasha] || null;
}

function composeDomainNarrative(domainSignal) {
  const { domain, summary_metrics, themes = [], time_windows, rule_trace, _layer_status, _core_life_phase } = domainSignal;
  
  const vocab = DOMAIN_VOCABULARY[domain] || {
    area: 'life',
    framing: {
      focus: ['growth', 'balance'],
      action: ['developing', 'nurturing'],
      concern: ['well-being', 'progress']
    },
    themeMap: {}
  };
  
  // 5-LAYER COMPATIBILITY: Detect active layers (for tone adaptation)
  const hasStrengthYoga = (rule_trace?.strength_rules_applied?.length > 0 || 
                           rule_trace?.yoga_rules_applied?.length > 0);
  const hasDasha = rule_trace?.dasha_rules_applied?.length > 0;
  const hasTransit = rule_trace?.transit_rules_applied?.length > 0;
  const hasNakshatra = rule_trace?.nakshatra_rules_applied?.length > 0;
  
  // ASTROLOGICAL AUTHENTICITY: Extract and weight mahadasha dominance
  const currentMahadasha = extractCurrentMahadasha(domainSignal) || (_core_life_phase?.mahadasha || null);
  const mahadashaTone = currentMahadasha ? getMahadashaToneWeight(currentMahadasha) : null;
  
  // GLOBAL LIFE-PHASE COHERENCE: Use core life phase to ensure unified tone
  // The core life phase is implicitly referenced - all domains share the same emotional gravity
  
  // PAIN-FIRST UX: Structure = Pain → Validation → Direction → Calm close
  // Build paragraph components with themes
  const pain = generateOpening(domain, summary_metrics, vocab, themes, hasStrengthYoga, mahadashaTone, _core_life_phase);
  const validation = generateValidation(domain, summary_metrics, vocab, hasDasha, hasTransit); // Brief, optional astrology
  const direction = generateExplanation(domain, summary_metrics, vocab, themes, hasStrengthYoga, mahadashaTone, _core_life_phase);
  const calmClose = generateClosing(domain, summary_metrics, vocab, themes);
  
  // PAIN-FIRST UX: Combine following structure
  const sentences = [pain]; // Always start with pain
  
  // Add validation only if brief and adds value (optional)
  if (validation && validation.length < 80 && !isSimilarSentence(validation, pain)) {
    sentences.push(validation);
  }
  
  // Add direction if different from pain
  if (direction && direction !== pain && !isSimilarSentence(direction, pain)) {
    sentences.push(direction);
  }
  
  // Add calm close only if it adds value and is different
  if (calmClose && !isSimilarSentence(calmClose, pain) && !isSimilarSentence(calmClose, direction)) {
    sentences.push(calmClose);
  }
  
  // Quality guardrail: Limit to 2-3 sentences max (Pain + Direction/Close)
  if (sentences.length > 3) {
    // Keep pain (most important), direction, and calm close
    return [pain, direction, calmClose].filter(s => s).join(' ').trim();
  }
  
  return sentences.join(' ').trim();
}

/**
 * Determine core life phase from all domain signals
 * GLOBAL LIFE-PHASE COHERENCE: Based on Mahadasha + dominant house + dosha
 */
function determineCoreLifePhase(allDomainSignals) {
  // Extract mahadasha from first signal that has it
  let mahadasha = null;
  for (const signal of allDomainSignals) {
    const m = extractCurrentMahadasha(signal);
    if (m) {
      mahadasha = m;
      break;
    }
  }
  
  // Determine dominant emotional gravity from all domains
  // Count pressure levels across all domains
  const pressureCounts = { high: 0, medium: 0, low: 0 };
  const supportCounts = { high: 0, medium: 0, low: 0 };
  const stabilityCounts = { high: 0, medium: 0, low: 0 };
  
  for (const signal of allDomainSignals) {
    const { pressure, support, stability } = signal.summary_metrics || {};
    if (pressure) pressureCounts[pressure] = (pressureCounts[pressure] || 0) + 1;
    if (support) supportCounts[support] = (supportCounts[support] || 0) + 1;
    if (stability) stabilityCounts[stability] = (stabilityCounts[stability] || 0) + 1;
  }
  
  // Determine dominant metrics
  const dominantPressure = Object.keys(pressureCounts).reduce((a, b) => 
    pressureCounts[a] > pressureCounts[b] ? a : b, 'medium'
  );
  const dominantSupport = Object.keys(supportCounts).reduce((a, b) => 
    supportCounts[a] > supportCounts[b] ? a : b, 'medium'
  );
  const dominantStability = Object.keys(stabilityCounts).reduce((a, b) => 
    stabilityCounts[a] > stabilityCounts[b] ? a : b, 'medium'
  );
  
  // Determine dominant house based on most active domain
  // Map domains to houses
  const domainToHouse = {
    'self_identity': 1,
    'money_finance': 2,
    'relationships': 7,
    'career_direction': 10,
    'health_body': 6,
    'family_home': 4,
    'spiritual_growth': 9,
    'mental_state': 12
  };
  
  // Find domain with highest pressure or lowest support (most active)
  let dominantDomain = null;
  let maxActivity = -1;
  for (const signal of allDomainSignals) {
    const { pressure, support, confidence } = signal.summary_metrics || {};
    const activity = (pressure === 'high' ? 3 : pressure === 'medium' ? 2 : 1) + 
                     (support === 'low' ? 3 : support === 'medium' ? 2 : 1) +
                     (confidence || 0) * 2;
    if (activity > maxActivity) {
      maxActivity = activity;
      dominantDomain = signal.domain;
    }
  }
  
  const dominantHouse = dominantDomain ? domainToHouse[dominantDomain] : null;
  
  // Build core life phase description
  const mahadashaTone = mahadasha ? getMahadashaToneWeight(mahadasha) : null;
  
  let phaseDescription = '';
  if (mahadashaTone) {
    phaseDescription = mahadashaTone.feeling;
  } else if (dominantPressure === 'high' && dominantSupport === 'low') {
    phaseDescription = 'restructuring, challenges, and karmic lessons';
  } else if (dominantPressure === 'high' && dominantSupport === 'medium') {
    phaseDescription = 'growth through challenges and opportunities';
  } else if (dominantSupport === 'high' && dominantPressure === 'low') {
    phaseDescription = 'expansion, harmony, and positive developments';
  } else {
    phaseDescription = 'steady progress and gradual transformation';
  }
  
  return {
    mahadasha,
    dominantHouse,
    dominantPressure,
    dominantSupport,
    dominantStability,
    phaseDescription,
    emotionalGravity: dominantPressure === 'high' && dominantSupport === 'low' ? 'heavy' :
                      dominantPressure === 'high' && dominantSupport === 'medium' ? 'moderate' :
                      dominantSupport === 'high' && dominantPressure === 'low' ? 'light' : 'balanced'
  };
}

/**
 * Get relative intensity factor for domain
 * RELATIVE INTENSITY BALANCE: Each domain has natural intensity variation
 */
function getDomainIntensityFactor(domain) {
  // Career / duty-related domains → highest intensity
  if (domain === 'career_direction' || domain === 'self_identity') {
    return 1.0; // Full intensity
  }
  
  // Money / stability → medium-high
  if (domain === 'money_finance' || domain === 'family_home') {
    return 0.85; // Slightly reduced
  }
  
  // Relationships → medium
  if (domain === 'relationships' || domain === 'spiritual_growth') {
    return 0.7; // Moderate intensity
  }
  
  // Health / mind → medium-low (unless explicitly afflicted)
  if (domain === 'health_body' || domain === 'mental_state') {
    return 0.6; // Lower intensity by default
  }
  
  // Timing, events, changes → medium
  if (domain === 'timing_luck' || domain === 'events_changes') {
    return 0.75; // Moderate
  }
  
  // Default
  return 0.8;
}

/**
 * Apply unified emotional gravity with relative intensity balance
 * RELATIVE INTENSITY BALANCE: Core life phase dominant, but domains have natural variation
 */
function applyUnifiedGravity(domainSignal, coreLifePhase) {
  const { domain, summary_metrics } = domainSignal;
  const { pressure, support, stability } = summary_metrics;
  
  // Get domain's relative intensity factor
  const intensityFactor = getDomainIntensityFactor(domain);
  
  // Core life phase remains dominant, but apply relative intensity
  if (coreLifePhase.emotionalGravity === 'heavy') {
    // Heavy core phase: All domains reflect weight, but with relative variation
    const adjustedMetrics = { ...summary_metrics };
    
    // RELATIVE INTENSITY: High-intensity domains (career) feel more weight
    // Low-intensity domains (health, mind) feel lighter unless explicitly afflicted
    if (pressure === 'low') {
      if (intensityFactor >= 0.85) {
        // High-intensity domains (career, money) should feel the weight
        adjustedMetrics.pressure = 'medium';
      } else if (intensityFactor < 0.7) {
        // Low-intensity domains (health, mind) can stay lighter
        adjustedMetrics.pressure = 'low'; // Keep as is - natural variation
      } else {
        // Medium-intensity domains get slight adjustment
        adjustedMetrics.pressure = 'medium';
      }
    }
    
    if (support === 'high') {
      if (intensityFactor >= 0.85) {
        // High-intensity domains should reflect the heavy phase
        adjustedMetrics.support = 'medium';
      } else if (intensityFactor < 0.7) {
        // Low-intensity domains can keep higher support (natural variation)
        adjustedMetrics.support = 'high'; // Keep as is
      } else {
        adjustedMetrics.support = 'medium';
      }
    }
    
    return adjustedMetrics;
  } else if (coreLifePhase.emotionalGravity === 'light') {
    // Light core phase: All domains reflect lightness, but with relative variation
    const adjustedMetrics = { ...summary_metrics };
    
    if (pressure === 'high') {
      if (intensityFactor >= 0.85) {
        // High-intensity domains can still have some pressure (natural variation)
        adjustedMetrics.pressure = 'medium';
      } else if (intensityFactor < 0.7) {
        // Low-intensity domains should be lighter
        adjustedMetrics.pressure = 'medium';
      } else {
        adjustedMetrics.pressure = 'medium';
      }
    }
    
    if (support === 'low') {
      if (intensityFactor >= 0.85) {
        // High-intensity domains can have medium support
        adjustedMetrics.support = 'medium';
      } else if (intensityFactor < 0.7) {
        // Low-intensity domains should have better support
        adjustedMetrics.support = 'medium';
      } else {
        adjustedMetrics.support = 'medium';
      }
    }
    
    return adjustedMetrics;
  }
  
  // Balanced or moderate - keep as is, allowing natural variation
  return summary_metrics;
}

/**
 * Main function: Compose narratives for all domain signals
 * GLOBAL LIFE-PHASE COHERENCE: All domains must feel like one continuous life phase
 * 
 * @param {Array} domainSignalsWithPatches - Array of domain signals with time patches
 * @returns {Array} Array of domain text blocks
 */
export function composeNarrative(domainSignalsWithPatches) {
  // Filter to meaningful signals
  const meaningfulSignals = domainSignalsWithPatches.filter(signal => {
    const { confidence } = signal.summary_metrics || {};
    return confidence >= 0.3; // Minimum confidence threshold
  });
  
  // GLOBAL LIFE-PHASE COHERENCE: Determine core life phase from all domains
  const coreLifePhase = determineCoreLifePhase(meaningfulSignals);
  
  // Compose narratives with unified gravity
  return meaningfulSignals.map(signal => {
    // Apply unified emotional gravity
    const adjustedMetrics = applyUnifiedGravity(signal, coreLifePhase);
    const adjustedSignal = {
      ...signal,
      summary_metrics: adjustedMetrics,
      _core_life_phase: coreLifePhase // Pass core phase for narrative generation
    };
    
    return {
      domain: signal.domain,
      text: composeDomainNarrative(adjustedSignal),
      summary_metrics: adjustedMetrics,
      themes: signal.themes,
      time_windows: signal.time_windows,
      rule_trace: signal.rule_trace // Preserved for transparency, not in text
    };
  });
}

