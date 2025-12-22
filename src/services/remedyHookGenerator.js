/**
 * Remedy Hook Generator
 * 
 * Generates soft, optional remedy hooks that bridge narrative insight
 * to conscious action, without fear or manipulation.
 * 
 * Principles:
 * - Remedies are NOT forced
 * - No fear-based language
 * - No guarantees
 * - Optional, supportive, and meaningful
 */

/**
 * Domain-specific remedy hook messages
 */
const DOMAIN_REMEDY_HOOKS = {
  career_direction: {
    high_pressure: "During such professional phases, supportive practices can help maintain clarity, focus, and steady progress.",
    high_support: "This favorable period can be enhanced through practices that support professional growth and clarity.",
    low_stability: "During transitions, supportive practices can help navigate changes with greater ease and confidence.",
    balanced: "Supportive practices can help maintain balance and clarity throughout this professional phase.",
    with_timing: "During these specific periods, supportive practices can help you make the most of favorable timing."
  },
  money_finance: {
    high_pressure: "During such financial phases, supportive practices can help maintain stability and thoughtful decision-making.",
    high_support: "This favorable period can be enhanced through practices that support financial clarity and resource-building.",
    low_stability: "During financial transitions, supportive practices can help navigate changes with greater security and confidence.",
    balanced: "Supportive practices can help maintain financial balance and clarity throughout this phase.",
    with_timing: "During these specific periods, supportive practices can help you align with favorable financial timing."
  },
  relationships: {
    high_pressure: "During such relationship phases, supportive practices can help maintain harmony, understanding, and connection.",
    high_support: "This favorable period can be enhanced through practices that support deeper connection and mutual understanding.",
    low_stability: "During relationship transitions, supportive practices can help navigate changes with greater harmony and patience.",
    balanced: "Supportive practices can help maintain relationship harmony and deeper understanding throughout this phase.",
    with_timing: "During these specific periods, supportive practices can help strengthen bonds and deepen connection."
  },
  family_home: {
    high_pressure: "During such family phases, supportive practices can help maintain harmony, patience, and mutual support.",
    high_support: "This favorable period can be enhanced through practices that support family unity and domestic harmony.",
    low_stability: "During family transitions, supportive practices can help navigate changes with greater understanding and care.",
    balanced: "Supportive practices can help maintain family harmony and mutual support throughout this phase.",
    with_timing: "During these specific periods, supportive practices can help strengthen family bonds and create greater harmony."
  },
  health_body: {
    high_pressure: "During such health phases, supportive practices can help maintain vitality, balance, and recovery.",
    high_support: "This favorable period can be enhanced through practices that support physical well-being and energy restoration.",
    low_stability: "During health transitions, supportive practices can help navigate changes with greater resilience and care.",
    balanced: "Supportive practices can help maintain physical well-being and vitality throughout this phase.",
    with_timing: "During these specific periods, supportive practices can help optimize health and support recovery."
  },
  mental_state: {
    high_pressure: "During such inner phases, supportive practices can help maintain mental clarity, emotional balance, and inner peace.",
    high_support: "This favorable period can be enhanced through practices that support mental clarity and emotional well-being.",
    low_stability: "During emotional transitions, supportive practices can help navigate changes with greater self-awareness and peace.",
    balanced: "Supportive practices can help maintain mental clarity and emotional balance throughout this phase.",
    with_timing: "During these specific periods, supportive practices can help deepen inner peace and emotional stability."
  },
  spiritual_growth: {
    high_pressure: "During such spiritual phases, supportive practices can help deepen understanding, connection, and inner wisdom.",
    high_support: "This favorable period can be enhanced through practices that support spiritual growth and deeper connection.",
    low_stability: "During spiritual transitions, supportive practices can help navigate changes with greater clarity and understanding.",
    balanced: "Supportive practices can help maintain spiritual practice and deepening awareness throughout this phase.",
    with_timing: "During these specific periods, supportive practices can help deepen spiritual connection and understanding."
  },
  timing_luck: {
    high_pressure: "During such timing phases, supportive practices can help maintain readiness and recognize favorable opportunities.",
    high_support: "This favorable period can be enhanced through practices that support awareness and readiness for opportunities.",
    low_stability: "During timing transitions, supportive practices can help navigate changes with greater awareness and preparation.",
    balanced: "Supportive practices can help maintain readiness and awareness of favorable timing throughout this phase.",
    with_timing: "During these specific periods, supportive practices can help you align with favorable timing and opportunities."
  },
  events_changes: {
    high_pressure: "During such transition phases, supportive practices can help navigate changes with greater ease, adaptability, and confidence.",
    high_support: "This favorable period can be enhanced through practices that support smooth transitions and positive change.",
    low_stability: "During life transitions, supportive practices can help navigate changes with greater resilience and openness.",
    balanced: "Supportive practices can help maintain adaptability and readiness throughout this phase of change.",
    with_timing: "During these specific periods, supportive practices can help navigate transitions with greater ease and positive outcomes."
  },
  self_identity: {
    high_pressure: "During such self-discovery phases, supportive practices can help maintain clarity, authenticity, and self-understanding.",
    high_support: "This favorable period can be enhanced through practices that support authentic self-expression and personal growth.",
    low_stability: "During identity transitions, supportive practices can help navigate changes with greater self-awareness and acceptance.",
    balanced: "Supportive practices can help maintain authentic self-expression and personal clarity throughout this phase.",
    with_timing: "During these specific periods, supportive practices can help deepen self-understanding and authentic expression."
  }
};

/**
 * CTA variations to avoid repetition
 */
const CTA_VARIATIONS = [
  "View supportive remedies",
  "Explore supportive practices",
  "Discover supportive remedies",
  "Learn about supportive practices",
  "See supportive remedies"
];

/**
 * Generates a remedy hook for a domain section
 * 
 * SAFETY & EDGE CASES:
 * - Returns null if confidence < 0.6 (threshold)
 * - Returns null if domain not found
 * - Returns null if section structure invalid
 * - Always returns valid hook structure or null (never throws)
 * 
 * DETERMINISTIC:
 * - Same input → same output
 * - CTA selection is hash-based (stable per domain)
 * 
 * @param {Object} section - Domain section with narrative, metrics, time_windows
 * @returns {Object|null} Remedy hook object or null if not applicable
 */
export function generateRemedyHook(section) {
  // Input validation
  if (!section || typeof section !== 'object') {
    return null;
  }
  
  const { domain, summary_metrics, time_windows } = section;
  
  // Validate domain
  if (!domain || typeof domain !== 'string') {
    return null;
  }
  
  // Validate and extract confidence
  const confidence = summary_metrics?.confidence;
  if (typeof confidence !== 'number' || confidence < 0.6) {
    return null;
  }
  
  // Get domain-specific hooks
  const domainHooks = DOMAIN_REMEDY_HOOKS[domain];
  if (!domainHooks || typeof domainHooks !== 'object') {
    return null;
  }
  
  // Extract metrics safely
  const pressure = summary_metrics?.pressure;
  const support = summary_metrics?.support;
  const stability = summary_metrics?.stability;
  
  // Determine hook message based on metrics and timing
  let message = null;
  
  // Check if time windows exist (timing-sensitive)
  const hasTimeWindows = 
    (Array.isArray(time_windows?.years) && time_windows.years.length > 0) ||
    (Array.isArray(time_windows?.months) && time_windows.months.length > 0);
  
  // Priority: timing > high_pressure > high_support > low_stability > balanced
  if (hasTimeWindows && domainHooks.with_timing && typeof domainHooks.with_timing === 'string') {
    message = domainHooks.with_timing;
  } else if (pressure === 'high' && domainHooks.high_pressure && typeof domainHooks.high_pressure === 'string') {
    message = domainHooks.high_pressure;
  } else if (support === 'high' && domainHooks.high_support && typeof domainHooks.high_support === 'string') {
    message = domainHooks.high_support;
  } else if (stability === 'low' && domainHooks.low_stability && typeof domainHooks.low_stability === 'string') {
    message = domainHooks.low_stability;
  } else if (domainHooks.balanced && typeof domainHooks.balanced === 'string') {
    message = domainHooks.balanced;
  }
  
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return null;
  }
  
  // Select CTA variation based on domain hash (deterministic)
  const domainHash = domain.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const ctaIndex = Math.abs(domainHash) % CTA_VARIATIONS.length;
  const cta = CTA_VARIATIONS[ctaIndex] || CTA_VARIATIONS[0]; // Fallback to first CTA
  
  // Validate CTA
  if (!cta || typeof cta !== 'string') {
    return null;
  }
  
  return {
    message: message.trim(),
    cta: cta.trim()
  };
}

