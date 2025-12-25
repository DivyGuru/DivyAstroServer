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
function generateOpening(domain, metrics, vocab, themes = [], hasStrengthYoga = false) {
  const { pressure, support, stability } = metrics;
  const framing = vocab.framing;
  
  // 5-LAYER COMPATIBILITY: Adapt tone if Strength/Yoga present
  const confidenceBoost = hasStrengthYoga ? 'more clearly' : '';
  const stabilityBoost = hasStrengthYoga ? 'with greater stability' : '';
  
  // Use first theme to add specificity, or use domain framing
  const primaryTheme = themes.length > 0 ? themes[0] : null;
  const themeContext = primaryTheme && vocab.themeMap && vocab.themeMap[primaryTheme] 
    ? vocab.themeMap[primaryTheme] 
    : framing.focus[0];
  
  // Domain-specific opening patterns - Human, personal, astrologer voice
  if (domain === 'career_direction') {
    if (pressure === 'high' && support === 'low') {
      return `Your professional direction or responsibilities may feel heavier now. This period invites patience as progress unfolds more gradually than you might expect.`;
    }
    if (pressure === 'high' && support === 'medium') {
      return `You may notice increased demands alongside new opportunities in your work life. Careful prioritization helps you navigate this balance.`;
    }
    if (support === 'high' && pressure === 'low') {
      return `Career opportunities and recognition flow more easily now. This period supports your professional visibility and growth.`;
    }
    if (stability === 'low') {
      return `Your professional path may gently shift direction. Staying open to new possibilities serves you well.`;
    }
    return `Your work life moves steadily forward. At the same time, emerging opportunities invite your attention.`;
  }
  
  if (domain === 'money_finance') {
    if (pressure === 'high' && support === 'low') {
      return `How you manage money or long-term security may require more careful attention now. Thoughtful planning helps maintain stability during this phase.`;
    }
    if (pressure === 'high' && support === 'medium') {
      return `Financial constraints and opportunities appear together. Strategic decisions help you balance immediate needs with future growth.`;
    }
    if (support === 'high' && pressure === 'low') {
      return `Financial stability and growth opportunities feel more accessible. This period supports building your resources and security.`;
    }
    if (stability === 'low') {
      return `Your approach to money may benefit from flexibility. Building sustainable foundations matters more than quick gains.`;
    }
    return `Your financial planning continues steadily. This period also brings opportunities to strengthen your long-term security.`;
  }
  
  if (domain === 'relationships') {
    if (pressure === 'high' && support === 'low') {
      return `Your relationships may feel more sensitive or require extra care now. Patient communication and deeper understanding help restore harmony.`;
    }
    if (pressure === 'high' && support === 'medium') {
      return `Connection and complexity appear together in your relationships. Thoughtful attention to both your needs and theirs creates balance.`;
    }
    if (support === 'high' && pressure === 'low') {
      return `Connection, understanding, and mutual support flow more easily now. This period supports deeper bonds and harmony in your relationships.`;
    }
    if (stability === 'low') {
      return `Your relationships may gently evolve. Openness to new ways of connecting and understanding each other serves you well.`;
    }
    return `Your relationships balance connection with individual needs. This period supports deeper understanding and mutual care.`;
  }
  
  if (domain === 'health_body') {
    if (pressure === 'high' && support === 'low') {
      return `Your physical routines may need steadier discipline and awareness now. Energy levels benefit from careful management and supportive habits.`;
    }
    if (pressure === 'high' && support === 'medium') {
      return `Physical demands and healing support appear together. Balanced self-care and recovery practices help you maintain well-being.`;
    }
    if (support === 'high' && pressure === 'low') {
      return `Vitality, strength, and health stability feel more accessible. This period supports your physical well-being and energy.`;
    }
    if (stability === 'low') {
      return `Your lifestyle choices may benefit from adaptability. Building sustainable wellness habits matters more than quick fixes.`;
    }
    return `Your physical well-being continues steadily. Thoughtful self-care and awareness support your vitality.`;
  }
  
  if (domain === 'family_home') {
    if (pressure === 'high' && support === 'low') {
      return `Family responsibilities or home matters may require more attention now. Patience, understanding, and mutual support help maintain harmony.`;
    }
    if (support === 'high' && pressure === 'low') {
      return `Connection, support, and domestic stability feel more accessible. This period supports harmony and comfort in your family and home life.`;
    }
    if (stability === 'low') {
      return `Your family dynamics may gently evolve. Openness to new ways of relating helps create a more supportive home environment.`;
    }
    return `Your family and home life balance individual needs with collective harmony. This period supports mutual care and emotional security.`;
  }
  
  if (domain === 'mental_state') {
    if (pressure === 'high' && support === 'low') {
      return `Your mental and emotional well-being may feel more strained now. Self-awareness, reflection, and practices that restore inner balance help.`;
    }
    if (support === 'high' && pressure === 'low') {
      return `Clarity, emotional stability, and inner peace feel more accessible. This period supports your mental and emotional well-being.`;
    }
    if (stability === 'low') {
      return `Your emotional management may benefit from adaptability. Practices that cultivate mental clarity serve you well.`;
    }
    return `Your mental and emotional well-being balance self-awareness with inner peace. This period supports clarity and emotional stability.`;
  }
  
  if (domain === 'spiritual_growth') {
    if (pressure === 'high' && support === 'low') {
      return `Your spiritual practice may encounter obstacles now. Deeper reflection and a renewed commitment to spiritual understanding help.`;
    }
    if (pressure === 'high' && support === 'medium') {
      return `Spiritual challenges and insights appear together. Patience and consistent practice support your growth.`;
    }
    if (support === 'high' && pressure === 'low') {
      return `Inner wisdom, spiritual connection, and deeper understanding feel more accessible. This period supports your spiritual growth.`;
    }
    if (stability === 'low') {
      return `Your spiritual understanding may gently evolve. Openness to new perspectives and practices serves you well.`;
    }
    return `Your spiritual practice continues steadily. This period supports deepening awareness and spiritual growth.`;
  }
  
  if (domain === 'timing_luck') {
    if (pressure === 'high' && support === 'low') {
      return `Important decisions and opportunities require careful consideration, as favorable windows may be less accessible in the immediate term.`;
    }
    if (pressure === 'high' && support === 'medium') {
      return `Significant actions face mixed timing, with some opportunities present while others require patience and better preparation.`;
    }
    if (support === 'high' && pressure === 'low') {
      return `Favorable timing supports important decisions and actions, with opportunities and supportive conditions more readily available.`;
    }
    if (stability === 'low') {
      return `Timing requires flexibility in planning and readiness to act when favorable moments arise.`;
    }
    return `Timing for important matters is balanced, supporting steady progress while remaining attentive to emerging opportunities.`;
  }
  
  if (domain === 'events_changes') {
    if (pressure === 'high' && support === 'low') {
      return `Significant changes require careful navigation, patience, and thoughtful adaptation to new circumstances.`;
    }
    if (pressure === 'high' && support === 'medium') {
      return `Transitions present both challenges and opportunities, calling for balanced preparation and openness to change.`;
    }
    if (support === 'high' && pressure === 'low') {
      return `Positive change flows smoothly, with transitions and new opportunities more accessible.`;
    }
    if (stability === 'low') {
      return `Flexibility and openness to new directions help navigate changing circumstances.`;
    }
    return `Steady change supports gradual transitions and thoughtful adaptation.`;
  }
  
  if (domain === 'self_identity') {
    if (pressure === 'high' && support === 'low') {
      return `Your sense of who you are may feel more uncertain now. Deeper self-reflection and authentic self-discovery help clarify your path.`;
    }
    if (pressure === 'high' && support === 'medium') {
      return `Self-doubt and self-discovery appear together. Patience and honest self-reflection support your growth.`;
    }
    if (support === 'high' && pressure === 'low') {
      return `Self-awareness, authentic expression, and personal values feel more accessible. This period supports your true identity.`;
    }
    if (stability === 'low') {
      return `Your sense of self may gently evolve. Openness to new self-understandings and flexibility in expression serve you well.`;
    }
    return `Your self-discovery continues steadily. This period supports authentic personal growth and clarity about who you are.`;
  }
  
  // Generic fallback with theme context - Natural, varied openings
  if (pressure === 'high' && support === 'low') {
    return `${themeContext.charAt(0).toUpperCase() + themeContext.slice(1)} may require focused attention and steady ${framing.action[0]} during this period.`;
  }
  
  if (support === 'high' && pressure === 'low') {
    return `${themeContext.charAt(0).toUpperCase() + themeContext.slice(1)} and positive developments are more accessible.`;
  }
  
  if (stability === 'low') {
    return `${themeContext.charAt(0).toUpperCase() + themeContext.slice(1)} may shift, requiring flexibility and openness to new approaches.`;
  }
  
  return `Steady ${framing.action[0]} and thoughtful attention to ${themeContext} continue to support progress.`;
}

/**
 * Generates domain-specific explanation sentence using themes
 */
/**
 * Generates domain-specific explanation sentence
 * 
 * 5-LAYER COMPATIBILITY:
 * - Adapts tone based on active layers
 * - Strength/Yoga present → more confidence language
 * - Never mentions planets, nakshatra, yoga names
 */
function generateExplanation(domain, metrics, vocab, themes = [], hasStrengthYoga = false) {
  const { pressure, support, stability } = metrics;
  const framing = vocab.framing;
  
  // 5-LAYER COMPATIBILITY: Adapt tone if Strength/Yoga present
  const confidenceBoost = hasStrengthYoga ? 'more consistently' : '';
  
  // Use themes to add specificity
  const themeContext = themes.length > 0 && vocab.themeMap && vocab.themeMap[themes[0]]
    ? vocab.themeMap[themes[0]]
    : framing.focus[0];
  
  // Domain-specific explanations - Human, personal, astrologer voice
  if (domain === 'career_direction') {
    if (pressure === 'high' && stability === 'low') {
      return `Focus on building skills and demonstrating reliability. These qualities matter more than seeking rapid advancement right now.`;
    }
    if (support === 'high' && stability === 'high') {
      return `A solid foundation supports your career growth, professional recognition, and meaningful advancement.`;
    }
    if (pressure === 'high' && support === 'medium') {
      return `Balance your professional responsibilities with strategic career moves and skill development. This approach helps maintain steady progress.`;
    }
    if (stability === 'low') {
      return `Staying open to new professional directions and flexible in your career planning serves you well.`;
    }
    return `Your professional development continues steadily. At the same time, emerging career opportunities invite your attention.`;
  }
  
  if (domain === 'money_finance') {
    if (pressure === 'high' && stability === 'low') {
      return `Prioritize careful budgeting and protecting your existing resources. Building financial security gradually matters more than quick gains.`;
    }
    if (support === 'high' && stability === 'high') {
      return `Favorable conditions support your financial growth, savings accumulation, and sustainable wealth-building.`;
    }
    if (pressure === 'high' && support === 'medium') {
      return `Balance financial constraints with opportunities for growth. Strategic planning helps maintain stability while building resources.`;
    }
    if (stability === 'low') {
      return `Adaptability in your financial planning and a focus on building stable foundations serve you well.`;
    }
    return `Your financial planning continues steadily. Thoughtful resource management supports your long-term security.`;
  }
  
  if (domain === 'relationships') {
    if (pressure === 'high' && stability === 'low') {
      return `Patient communication and understanding different perspectives matter most. Nurturing connection through challenges helps restore harmony.`;
    }
    if (support === 'high' && stability === 'high') {
      return `Favorable conditions support deepening your relationships, building trust, and experiencing greater harmony.`;
    }
    if (pressure === 'high' && support === 'medium') {
      return `Balance your individual needs with relationship harmony and mutual understanding. This approach helps maintain connection.`;
    }
    if (stability === 'low') {
      return `Staying open to new ways of relating and flexible in your relationship dynamics serves you well.`;
    }
    return `Your relationship-building continues steadily. This period honors both connection and individual growth.`;
  }
  
  if (domain === 'health_body') {
    if (pressure === 'high' && stability === 'low') {
      return `Rest, recovery practices, and building sustainable health habits matter more than pushing physical limits.`;
    }
    if (support === 'high' && stability === 'high') {
      return `Favorable conditions support physical strength, energy restoration, and overall vitality.`;
    }
    if (pressure === 'high' && support === 'medium') {
      return `Balancing physical demands with recovery needs and supportive health practices helps maintain well-being.`;
    }
    if (stability === 'low') {
      return `Adaptable health routines support sustainable wellness.`;
    }
    return `Steady health maintenance and thoughtful attention to physical well-being continue.`;
  }
  
  if (domain === 'family_home') {
    if (pressure === 'high' && stability === 'low') {
      return `Patience, mutual understanding, and creating a supportive home environment matter most despite challenges.`;
    }
    if (support === 'high' && stability === 'high') {
      return `Favorable conditions support family harmony, domestic stability, and deeper family connections.`;
    }
    if (stability === 'low') {
      return `Openness to new family dynamics and flexibility in creating a harmonious home environment may benefit you.`;
    }
    return `Steady family-building continues while balancing individual needs with collective harmony.`;
  }
  
  if (domain === 'mental_state') {
    if (pressure === 'high' && stability === 'low') {
      return `Self-awareness, emotional regulation practices, and cultivating inner peace through challenges take priority.`;
    }
    if (support === 'high' && stability === 'high') {
      return `Favorable conditions support mental clarity, emotional balance, and inner peace.`;
    }
    if (stability === 'low') {
      return `Adaptable emotional management supports mental clarity.`;
    }
    return `Steady mental well-being continues through practices that nurture clarity and emotional balance.`;
  }
  
  if (domain === 'spiritual_growth') {
    if (pressure === 'high' && stability === 'low') {
      return `Consistent spiritual practice, inner contemplation, and deepening your connection to spiritual wisdom take priority.`;
    }
    if (support === 'high' && stability === 'high') {
      return `Favorable conditions support spiritual insight, inner transformation, and deeper spiritual understanding.`;
    }
    if (pressure === 'high' && support === 'medium') {
      return `Balancing spiritual challenges with opportunities for growth and deeper practice helps maintain progress.`;
    }
    if (stability === 'low') {
      return `Openness to new spiritual perspectives and flexibility in your spiritual practices may benefit you.`;
    }
    return `Steady spiritual development and deepening awareness of your spiritual path continue.`;
  }
  
  if (domain === 'timing_luck') {
    if (pressure === 'high' && stability === 'low') {
      return `Patience, careful preparation, and waiting for more favorable conditions matter before making significant moves.`;
    }
    if (support === 'high' && stability === 'high') {
      return `Favorable timing supports important decisions and actions, with opportunities more readily available.`;
    }
    if (pressure === 'high' && support === 'medium') {
      return `Balancing patience with readiness to act when favorable moments present themselves helps maintain progress.`;
    }
    if (stability === 'low') {
      return `Flexibility in timing and readiness to adapt helps navigate changing conditions.`;
    }
    return `Steady progress continues while remaining attentive to favorable timing for important matters.`;
  }
  
  if (domain === 'events_changes') {
    if (pressure === 'high' && stability === 'low') {
      return `Careful preparation, adaptability, and thoughtful navigation of significant life transitions take priority.`;
    }
    if (support === 'high' && stability === 'high') {
      return `Favorable conditions support positive change, smooth transitions, and meaningful life developments.`;
    }
    if (pressure === 'high' && support === 'medium') {
      return `Balancing the challenges of change with opportunities for growth and positive transformation helps maintain stability.`;
    }
    if (stability === 'low') {
      return `Flexibility and openness to new directions help navigate changing circumstances.`;
    }
    return `Steady adaptation to life changes continues while remaining open to positive developments.`;
  }
  
  if (domain === 'self_identity') {
    if (pressure === 'high' && stability === 'low') {
      return `Honest self-reflection, exploring your authentic values, and understanding who you truly are take priority.`;
    }
    if (support === 'high' && stability === 'high') {
      return `Favorable conditions support self-clarity, authentic self-expression, and alignment with your true identity.`;
    }
    if (pressure === 'high' && support === 'medium') {
      return `Balancing self-questioning with opportunities for self-discovery and authentic growth helps maintain progress.`;
    }
    if (stability === 'low') {
      return `Openness to new self-understandings and flexibility in how you express your authentic self may benefit you.`;
    }
    return `Steady self-discovery and authentic personal development continue.`;
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
 * Generates domain-specific closing guidance sentence
 */
function generateClosing(domain, metrics, vocab, themes = []) {
  const { pressure, support, stability } = metrics;
  const framing = vocab.framing;
  
  // Domain-specific closings
  if (domain === 'career_direction') {
    if (pressure === 'high') {
      return `Approaching this professional phase with discipline and strategic focus can transform challenges into long-term career stability and growth.`;
    }
    if (support === 'high') {
      return `This period rewards consistent professional effort and thoughtful engagement with career opportunities.`;
    }
    if (stability === 'low') {
      return `Navigating this career phase with flexibility and openness can help establish a more fulfilling professional direction.`;
    }
    return `This professional phase benefits from steady effort balanced with awareness of emerging career opportunities.`;
  }
  
  if (domain === 'money_finance') {
    if (pressure === 'high') {
      return `Approaching this financial phase with careful planning and resourcefulness can build stronger financial foundations over time.`;
    }
    if (support === 'high') {
      return `This period rewards thoughtful financial decisions and consistent resource-building practices.`;
    }
    if (stability === 'low') {
      return `Navigating this financial phase with adaptability and planning can help establish more stable financial patterns.`;
    }
    return `This financial phase benefits from steady resource management balanced with awareness of growth opportunities.`;
  }
  
  if (domain === 'relationships') {
    if (pressure === 'high') {
      return `Approaching this relationship phase with patience and understanding can deepen connection and build stronger bonds over time.`;
    }
    if (support === 'high') {
      return `This period rewards consistent attention to relationships and thoughtful engagement with those around you.`;
    }
    if (stability === 'low') {
      return `Navigating this relationship phase with openness and communication can help establish more harmonious connections.`;
    }
    return `This relationship phase benefits from steady attention to connection balanced with respect for individual needs.`;
  }
  
  if (domain === 'health_body') {
    if (pressure === 'high') {
      return `Approaching this health phase with careful self-care and supportive habits can restore vitality and build long-term wellness.`;
    }
    if (support === 'high') {
      return `This period rewards consistent health practices and thoughtful attention to physical well-being.`;
    }
    if (stability === 'low') {
      return `Navigating this health phase with adaptability and self-awareness can help establish more sustainable wellness patterns.`;
    }
    return `This health phase benefits from steady self-care balanced with awareness of your body's changing needs.`;
  }
  
  if (domain === 'family_home') {
    if (pressure === 'high') {
      return `Approaching this family phase with patience and mutual support can strengthen bonds and create a more harmonious home environment.`;
    }
    if (support === 'high') {
      return `This period rewards consistent attention to family needs and thoughtful engagement with family life.`;
    }
    if (stability === 'low') {
      return `Navigating this family phase with openness and understanding can help establish more supportive family dynamics.`;
    }
    return `This family phase benefits from steady attention to family harmony balanced with respect for individual needs.`;
  }
  
  if (domain === 'mental_state') {
    if (pressure === 'high') {
      return `Approaching this inner phase with self-awareness and emotional practices can restore mental clarity and build lasting inner peace.`;
    }
    if (support === 'high') {
      return `This period rewards consistent attention to mental well-being and practices that nurture inner clarity.`;
    }
    if (stability === 'low') {
      return `Navigating this inner phase with adaptability and self-compassion can help establish more stable emotional patterns.`;
    }
    return `This inner phase benefits from steady attention to mental well-being balanced with practices that support emotional balance.`;
  }
  
  if (domain === 'spiritual_growth') {
    if (pressure === 'high') {
      return `Approaching this spiritual phase with consistent practice and inner reflection can deepen your spiritual understanding and connection.`;
    }
    if (support === 'high') {
      return `This period rewards dedicated spiritual practice and openness to deeper spiritual insights and transformation.`;
    }
    if (stability === 'low') {
      return `Navigating this spiritual phase with flexibility and openness can help establish a more authentic spiritual path.`;
    }
    return `This spiritual phase benefits from steady practice balanced with openness to new spiritual perspectives and growth.`;
  }
  
  if (domain === 'timing_luck') {
    if (pressure === 'high') {
      return `Approaching timing decisions with patience and careful preparation can help you recognize and act on favorable opportunities when they arise.`;
    }
    if (support === 'high') {
      return `This period rewards readiness to act and thoughtful engagement with favorable timing for important decisions.`;
    }
    if (stability === 'low') {
      return `Navigating timing with flexibility and awareness can help you adapt to changing conditions and recognize favorable moments.`;
    }
    return `This timing phase benefits from steady preparation balanced with readiness to act when favorable conditions emerge.`;
  }
  
  if (domain === 'events_changes') {
    if (pressure === 'high') {
      return `Approaching life changes with careful preparation and adaptability can help you navigate transitions smoothly and emerge stronger.`;
    }
    if (support === 'high') {
      return `This period rewards openness to change and thoughtful engagement with positive life developments and transitions.`;
    }
    if (stability === 'low') {
      return `Navigating changes with flexibility and readiness can help you adapt to new circumstances and embrace positive transformation.`;
    }
    return `This phase of change benefits from steady adaptation balanced with openness to positive developments and new directions.`;
  }
  
  if (domain === 'self_identity') {
    if (pressure === 'high') {
      return `Approaching this phase of self-discovery with honest reflection and self-compassion can help you understand and express your authentic self more fully.`;
    }
    if (support === 'high') {
      return `This period rewards consistent self-reflection and authentic self-expression aligned with your true values and identity.`;
    }
    if (stability === 'low') {
      return `Navigating self-identity with openness and self-acceptance can help you establish a clearer and more authentic sense of self.`;
    }
    return `This phase of self-discovery benefits from steady self-reflection balanced with openness to new self-understandings and authentic growth.`;
  }
  
  // Generic fallback with varied openings per domain
  if (pressure === 'high') {
    const openers = [
      `Focusing on ${framing.action[0]} and steady effort`,
      `Applying ${framing.action[0]} with consistent attention`,
      `Engaging with ${framing.action[0]} and thoughtful focus`
    ];
    const opener = openers[Math.floor(Math.random() * openers.length)];
    return `${opener} can transform challenges into long-term ${framing.focus[0]}.`;
  }
  
  if (support === 'high') {
    const openers = [
      `Consistent effort and thoughtful engagement`,
      `Steady work and mindful attention`,
      `Dedicated practice and careful planning`
    ];
    const opener = openers[Math.floor(Math.random() * openers.length)];
    return `${opener} are rewarded with meaningful progress.`;
  }
  
  if (stability === 'low') {
    const openers = [
      `Patience and adaptability`,
      `Flexibility and steady attention`,
      `Openness to change and consistent effort`
    ];
    const opener = openers[Math.floor(Math.random() * openers.length)];
    return `${opener} help establish steadier patterns over time.`;
  }
  
  const openers = [
    `A balanced approach`,
    `Thoughtful attention to both`,
    `Maintaining equilibrium between`
  ];
  const opener = openers[Math.floor(Math.random() * openers.length)];
  return `${opener} honors both opportunities and responsibilities.`;
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
function composeDomainNarrative(domainSignal) {
  const { domain, summary_metrics, themes = [], time_windows, rule_trace, _layer_status } = domainSignal;
  
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
  
  // Build paragraph components with themes
  const opening = generateOpening(domain, summary_metrics, vocab, themes, hasStrengthYoga);
  const explanation = generateExplanation(domain, summary_metrics, vocab, themes, hasStrengthYoga);
  const timeAwareness = generateTimeAwareness(time_windows || {}, vocab, hasDasha, hasTransit);
  const closing = generateClosing(domain, summary_metrics, vocab, themes);
  
  // Combine into single paragraph with de-duplication
  const sentences = [opening];
  
  // Add explanation only if it's different from opening
  if (explanation && explanation !== opening && !isSimilarSentence(explanation, opening)) {
    sentences.push(explanation);
  }
  
  if (timeAwareness && !isSimilarSentence(timeAwareness, opening) && !isSimilarSentence(timeAwareness, explanation)) {
    sentences.push(timeAwareness);
  }
  
  // Add closing only if it adds value
  if (closing && !isSimilarSentence(closing, opening) && !isSimilarSentence(closing, explanation)) {
    sentences.push(closing);
  }
  
  // Quality guardrail: Limit to 1-2 concise sentences
  // If we have more than 2, keep the most informative ones
  if (sentences.length > 2) {
    // Keep opening (most important) and the longest/most specific one
    const sorted = sentences.slice(1).sort((a, b) => b.length - a.length);
    return [opening, sorted[0]].join(' ').trim();
  }
  
  return sentences.join(' ').trim();
}

/**
 * Main function: Compose narratives for all domain signals
 * 
 * @param {Array} domainSignalsWithPatches - Array of domain signals with time patches
 * @returns {Array} Array of domain text blocks
 */
export function composeNarrative(domainSignalsWithPatches) {
  return domainSignalsWithPatches
    .filter(signal => {
      // Only compose for domains with meaningful metrics
      const { confidence } = signal.summary_metrics;
      return confidence >= 0.3; // Minimum confidence threshold
    })
    .map(signal => ({
      domain: signal.domain,
      text: composeDomainNarrative(signal),
      summary_metrics: signal.summary_metrics,
      themes: signal.themes,
      time_windows: signal.time_windows,
      rule_trace: signal.rule_trace // Preserved for transparency, not in text
    }));
}

