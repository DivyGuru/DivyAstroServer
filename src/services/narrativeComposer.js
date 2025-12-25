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
  
  // Domain-specific opening patterns
  if (domain === 'career_direction') {
    if (pressure === 'high' && support === 'low') {
      return `Your professional path is currently marked by increased responsibilities and slower-than-expected progress, requiring sustained effort and strategic direction.`;
    }
    if (pressure === 'high' && support === 'medium') {
      return `Your career is navigating a period where professional demands and growth opportunities coexist, calling for careful prioritization and steady advancement.`;
    }
    if (support === 'high' && pressure === 'low') {
      return `Your professional life is moving through a supportive phase where career opportunities and recognition are more accessible.`;
    }
    if (stability === 'low') {
      return `Your career direction is experiencing shifts that may require flexibility in approach and openness to new professional paths.`;
    }
    return `Your professional life currently balances steady progress with emerging opportunities for growth and development.`;
  }
  
  if (domain === 'money_finance') {
    if (pressure === 'high' && support === 'low') {
      return `Your financial situation is facing constraints that require careful resource management and thoughtful planning to maintain stability.`;
    }
    if (pressure === 'high' && support === 'medium') {
      return `Your financial life is balancing between resource constraints and growth opportunities, necessitating strategic financial decisions.`;
    }
    if (support === 'high' && pressure === 'low') {
      return `Your financial resources are in a favorable phase where stability and growth opportunities are more accessible.`;
    }
    if (stability === 'low') {
      return `Financial planning requires adaptability and a focus on building sustainable foundations.`;
    }
    return `Your financial life currently supports steady resource-building and thoughtful financial planning.`;
  }
  
  if (domain === 'relationships') {
    if (pressure === 'high' && support === 'low') {
      return `Your relationships are experiencing challenges that call for patient communication and deeper understanding to restore harmony.`;
    }
    if (pressure === 'high' && support === 'medium') {
      return `Your relationships are navigating a period where connection and complexity coexist, requiring thoughtful attention to mutual needs.`;
    }
    if (support === 'high' && pressure === 'low') {
      return `Your relationships are in a harmonious phase where connection, understanding, and mutual support flow more naturally.`;
    }
    if (stability === 'low') {
      return `Your relationship dynamics are evolving, inviting openness to new ways of connecting and understanding one another.`;
    }
    return `Your relationships currently balance connection with individual needs, fostering deeper understanding.`;
  }
  
  if (domain === 'health_body') {
    if (pressure === 'high' && support === 'low') {
      return `Your physical well-being is requiring extra attention, with energy levels and recovery needing careful management and supportive habits.`;
    }
    if (pressure === 'high' && support === 'medium') {
      return `Your health is in a phase where physical demands and healing support coexist, calling for balanced self-care and recovery practices.`;
    }
    if (support === 'high' && pressure === 'low') {
      return `Your physical well-being is in a supportive phase where vitality, strength, and health stability are more accessible.`;
    }
    if (stability === 'low') {
      return `Lifestyle choices require adaptability and a focus on building sustainable wellness habits.`;
    }
    return `Your health and well-being currently support steady vitality and thoughtful self-care.`;
  }
  
  if (domain === 'family_home') {
    if (pressure === 'high' && support === 'low') {
      return `Your family and home life are facing increased responsibilities that require patience, understanding, and mutual support to maintain harmony.`;
    }
    if (support === 'high' && pressure === 'low') {
      return `Your family and home environment are in a harmonious phase where connection, support, and domestic stability are more accessible.`;
    }
    if (stability === 'low') {
      return `Your family dynamics are evolving, inviting openness to new ways of relating and creating a more supportive home environment.`;
    }
    return `Your family and home life currently balance individual needs with collective harmony and mutual care.`;
  }
  
  if (domain === 'mental_state') {
    if (pressure === 'high' && support === 'low') {
      return `Your mental and emotional well-being is experiencing strain that calls for self-awareness, reflection, and practices that restore inner balance.`;
    }
    if (support === 'high' && pressure === 'low') {
      return `Your mental and emotional state is in a peaceful phase where clarity, emotional stability, and inner peace are more accessible.`;
    }
    if (stability === 'low') {
      return `Emotional management requires adaptability and practices that cultivate mental clarity.`;
    }
    return `Your mental and emotional well-being currently balance self-awareness with practices that nurture inner peace.`;
  }
  
  if (domain === 'spiritual_growth') {
    if (pressure === 'high' && support === 'low') {
      return `Your spiritual journey is encountering obstacles that invite deeper practice, inner reflection, and a renewed commitment to spiritual understanding.`;
    }
    if (pressure === 'high' && support === 'medium') {
      return `Your spiritual path is navigating a period where challenges and insights coexist, calling for patience and consistent spiritual practice.`;
    }
    if (support === 'high' && pressure === 'low') {
      return `Your spiritual growth is in a favorable phase where inner wisdom, spiritual connection, and deeper understanding are more accessible.`;
    }
    if (stability === 'low') {
      return `Your spiritual understanding is evolving, inviting openness to new perspectives and practices that deepen your spiritual connection.`;
    }
    return `Your spiritual growth currently supports steady practice and deepening spiritual awareness.`;
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
      return `Your sense of self and personal identity is going through a period of questioning that invites deeper self-reflection and authentic self-discovery.`;
    }
    if (pressure === 'high' && support === 'medium') {
      return `Your self-understanding is navigating a period where self-doubt and self-discovery coexist, calling for patience and honest self-reflection.`;
    }
    if (support === 'high' && pressure === 'low') {
      return `Your self-identity is in a clear phase where self-awareness, authentic expression, and personal values are more accessible.`;
    }
    if (stability === 'low') {
      return `Your sense of self is evolving, inviting openness to new self-understandings and flexibility in how you express your authentic identity.`;
    }
    return `Your self-identity currently supports steady self-discovery and authentic personal growth.`;
  }
  
  // Generic fallback with theme context
  if (pressure === 'high' && support === 'low') {
    return `Your ${vocab.area} is entering a phase where ${themeContext} requires focused attention and steady ${framing.action[0]}.`;
  }
  
  if (support === 'high' && pressure === 'low') {
    return `Your ${vocab.area} is moving through a supportive phase where ${themeContext} and positive developments are more accessible.`;
  }
  
  if (stability === 'low') {
    return `Your ${vocab.area} is experiencing shifts in ${themeContext}, requiring flexibility and openness to new approaches.`;
  }
  
  return `Your ${vocab.area} is moving through a balanced phase that supports steady ${framing.action[0]} and thoughtful attention to ${themeContext}.`;
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
  
  // Domain-specific explanations
  if (domain === 'career_direction') {
    if (pressure === 'high' && stability === 'low') {
      return `This period emphasizes building skills, demonstrating reliability, and making steady progress rather than seeking rapid advancement.`;
    }
    if (support === 'high' && stability === 'high') {
      return `This phase provides a solid foundation for career growth, professional recognition, and meaningful advancement.`;
    }
    if (pressure === 'high' && support === 'medium') {
      return `This period requires balancing professional responsibilities with strategic career moves and skill development.`;
    }
    if (stability === 'low') {
      return `This phase invites openness to new professional directions and flexibility in career planning.`;
    }
    return `This period supports steady professional development while remaining open to emerging career opportunities.`;
  }
  
  if (domain === 'money_finance') {
    if (pressure === 'high' && stability === 'low') {
      return `This period emphasizes careful budgeting, protecting existing resources, and building financial security gradually.`;
    }
    if (support === 'high' && stability === 'high') {
      return `This phase offers favorable conditions for financial growth, savings accumulation, and sustainable wealth-building.`;
    }
    if (pressure === 'high' && support === 'medium') {
      return `This period requires balancing financial constraints with opportunities for resource growth and strategic planning.`;
    }
    if (stability === 'low') {
      return `This phase calls for adaptability in financial planning and a focus on building stable financial foundations.`;
    }
    return `This period supports steady financial planning and thoughtful resource management.`;
  }
  
  if (domain === 'relationships') {
    if (pressure === 'high' && stability === 'low') {
      return `This period emphasizes patient communication, understanding different perspectives, and nurturing connection through challenges.`;
    }
    if (support === 'high' && stability === 'high') {
      return `This phase provides favorable conditions for deepening relationships, building trust, and experiencing greater harmony.`;
    }
    if (pressure === 'high' && support === 'medium') {
      return `This period requires balancing individual needs with relationship harmony and mutual understanding.`;
    }
    if (stability === 'low') {
      return `This phase invites openness to new ways of relating and flexibility in relationship dynamics.`;
    }
    return `This period supports steady relationship-building while honoring both connection and individual growth.`;
  }
  
  if (domain === 'health_body') {
    if (pressure === 'high' && stability === 'low') {
      return `This period emphasizes rest, recovery practices, and building sustainable health habits rather than pushing physical limits.`;
    }
    if (support === 'high' && stability === 'high') {
      return `This phase provides favorable conditions for physical strength, energy restoration, and overall vitality.`;
    }
    if (pressure === 'high' && support === 'medium') {
      return `This period requires balancing physical demands with recovery needs and supportive health practices.`;
    }
    if (stability === 'low') {
      return `Adaptable health routines support sustainable wellness during this phase.`;
    }
    return `This period supports steady health maintenance and thoughtful attention to physical well-being.`;
  }
  
  if (domain === 'family_home') {
    if (pressure === 'high' && stability === 'low') {
      return `This period emphasizes patience, mutual understanding, and creating a supportive home environment despite challenges.`;
    }
    if (support === 'high' && stability === 'high') {
      return `This phase provides favorable conditions for family harmony, domestic stability, and deeper family connections.`;
    }
    if (stability === 'low') {
      return `This phase invites openness to new family dynamics and flexibility in creating a harmonious home environment.`;
    }
    return `This period supports steady family-building while balancing individual needs with collective harmony.`;
  }
  
  if (domain === 'mental_state') {
    if (pressure === 'high' && stability === 'low') {
      return `This period emphasizes self-awareness, emotional regulation practices, and cultivating inner peace through challenges.`;
    }
    if (support === 'high' && stability === 'high') {
      return `This phase provides favorable conditions for mental clarity, emotional balance, and inner peace.`;
    }
    if (stability === 'low') {
      return `Adaptable emotional management supports mental clarity during this phase.`;
    }
    return `This period supports steady mental well-being through practices that nurture clarity and emotional balance.`;
  }
  
  if (domain === 'spiritual_growth') {
    if (pressure === 'high' && stability === 'low') {
      return `This period emphasizes consistent spiritual practice, inner contemplation, and deepening your connection to spiritual wisdom.`;
    }
    if (support === 'high' && stability === 'high') {
      return `This phase provides favorable conditions for spiritual insight, inner transformation, and deeper spiritual understanding.`;
    }
    if (pressure === 'high' && support === 'medium') {
      return `This period requires balancing spiritual challenges with opportunities for growth and deeper practice.`;
    }
    if (stability === 'low') {
      return `This phase invites openness to new spiritual perspectives and flexibility in your spiritual practices.`;
    }
    return `This period supports steady spiritual development and deepening awareness of your spiritual path.`;
  }
  
  if (domain === 'timing_luck') {
    if (pressure === 'high' && stability === 'low') {
      return `This period emphasizes patience, careful preparation, and waiting for more favorable conditions before making significant moves.`;
    }
    if (support === 'high' && stability === 'high') {
      return `This phase provides favorable timing for important decisions and actions, with opportunities more readily available.`;
    }
    if (pressure === 'high' && support === 'medium') {
      return `This period requires balancing patience with readiness to act when favorable moments present themselves.`;
    }
    if (stability === 'low') {
      return `Flexibility in timing and readiness to adapt helps navigate changing conditions.`;
    }
    return `This period supports steady progress while remaining attentive to favorable timing for important matters.`;
  }
  
  if (domain === 'events_changes') {
    if (pressure === 'high' && stability === 'low') {
      return `This period emphasizes careful preparation, adaptability, and thoughtful navigation of significant life transitions.`;
    }
    if (support === 'high' && stability === 'high') {
      return `This phase provides favorable conditions for positive change, smooth transitions, and meaningful life developments.`;
    }
    if (pressure === 'high' && support === 'medium') {
      return `This period requires balancing the challenges of change with opportunities for growth and positive transformation.`;
    }
    if (stability === 'low') {
      return `This phase invites openness to new directions and flexibility in adapting to changing life circumstances.`;
    }
    return `This period supports steady adaptation to life changes while remaining open to positive developments.`;
  }
  
  if (domain === 'self_identity') {
    if (pressure === 'high' && stability === 'low') {
      return `This period emphasizes honest self-reflection, exploring your authentic values, and understanding who you truly are.`;
    }
    if (support === 'high' && stability === 'high') {
      return `This phase provides favorable conditions for self-clarity, authentic self-expression, and alignment with your true identity.`;
    }
    if (pressure === 'high' && support === 'medium') {
      return `This period requires balancing self-questioning with opportunities for self-discovery and authentic growth.`;
    }
    if (stability === 'low') {
      return `This phase invites openness to new self-understandings and flexibility in how you express your authentic self.`;
    }
    return `This period supports steady self-discovery and authentic personal development.`;
  }
  
  // Generic fallback with theme context
  if (pressure === 'high' && stability === 'low') {
    return `This period emphasizes ${framing.action[0]} ${themeContext} steadily rather than seeking quick results.`;
  }
  
  if (support === 'high' && stability === 'high') {
    return `This phase provides favorable conditions for ${framing.action[0]} ${themeContext} and meaningful progress.`;
  }
  
  if (stability === 'low') {
    return `This phase invites flexibility in approach and openness to new ways of ${framing.action[0]} ${themeContext}.`;
  }
  
  return `This period supports steady ${framing.action[0]} while remaining attentive to ${themeContext}.`;
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

