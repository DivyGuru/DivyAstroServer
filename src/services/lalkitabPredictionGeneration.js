/**
 * Lal Kitab Prediction Generation Service
 * 
 * Generates Lal Kitab Prediction data based on planet positions.
 * Similar to sample PDF structure: Planet in house predictions with remedies.
 * 
 * API CONTRACT:
 * {
 *   meta: {
 *     window_id: string,
 *     generated_at: string ISO timestamp
 *   },
 *   predictions: [
 *     {
 *       planet: string,
 *       house: number,
 *       narrative: string,
 *       remedies: [
 *         {
 *           number: number,
 *           description: string
 *         }
 *       ]
 *     }
 *   ]
 * }
 */

import { query } from '../../config/db.js';
import { normalizeAstroState, evalNode } from '../engine/ruleEvaluator.js';

/**
 * Planet ID mapping (as per database convention)
 */
const PLANET_IDS = {
  'SUN': 0,
  'MOON': 1,
  'MARS': 2,
  'MERCURY': 3,
  'JUPITER': 4,
  'VENUS': 5,
  'SATURN': 6,
  'RAHU': 7,
  'KETU': 8
};

/**
 * Get planet name in proper format
 */
function getPlanetName(planet) {
  if (!planet) return null;
  
  const planetMap = {
    'SUN': 'Sun',
    'MOON': 'Moon',
    'MARS': 'Mars',
    'MERCURY': 'Mercury',
    'JUPITER': 'Jupiter',
    'VENUS': 'Venus',
    'SATURN': 'Saturn',
    'RAHU': 'Rahu',
    'KETU': 'Ketu'
  };
  
  const upperPlanet = String(planet).toUpperCase();
  return planetMap[upperPlanet] || planet;
}

/**
 * Get sign name from sign number (handles Rahu/Ketu correctly)
 */
function getSignName(signNumber) {
  if (!signNumber || signNumber < 1 || signNumber > 12) {
    return null;
  }
  
  const signs = [
    'Aries', 'Taurus', 'Gemini', 'Cancer',
    'Leo', 'Virgo', 'Libra', 'Scorpio',
    'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
  ];
  
  return signs[signNumber - 1] || null;
}

/**
 * Planet nature characteristics for narrative generation
 */
const PLANET_NATURES = {
  'SUN': {
    qualities: ['authority', 'leadership', 'ego', 'vitality', 'father', 'government'],
    influence: 'brings authority and leadership qualities',
    caution: 'may create ego challenges or authority conflicts'
  },
  'MOON': {
    qualities: ['emotions', 'mind', 'mother', 'intuition', 'fluctuations', 'public'],
    influence: 'affects emotions and mental state',
    caution: 'may cause emotional fluctuations or mental restlessness'
  },
  'MARS': {
    qualities: ['energy', 'action', 'courage', 'conflict', 'passion', 'sports'],
    influence: 'brings energy and action-oriented tendencies',
    caution: 'may create conflicts or impulsive behavior'
  },
  'MERCURY': {
    qualities: ['communication', 'intelligence', 'business', 'writing', 'learning'],
    influence: 'enhances communication and intellectual abilities',
    caution: 'may cause communication challenges or mental restlessness'
  },
  'JUPITER': {
    qualities: ['wisdom', 'expansion', 'guru', 'philosophy', 'wealth', 'spirituality'],
    influence: 'brings wisdom and expansion',
    caution: 'may create overconfidence or excessive spending'
  },
  'VENUS': {
    qualities: ['love', 'relationships', 'beauty', 'arts', 'luxury', 'comfort'],
    influence: 'enhances relationships and artistic expression',
    caution: 'may create attachment or excessive indulgence'
  },
  'SATURN': {
    qualities: ['discipline', 'delays', 'karma', 'hard work', 'restrictions', 'patience'],
    influence: 'brings discipline and karmic lessons',
    caution: 'may create delays or restrictions'
  },
  'RAHU': {
    qualities: ['desires', 'materialism', 'foreign', 'technology', 'unconventional', 'sudden gains'],
    influence: 'creates strong desires and material focus',
    caution: 'may create confusion or attachment to material things'
  },
  'KETU': {
    qualities: ['detachment', 'spirituality', 'mysticism', 'loss', 'liberation', 'past karma'],
    influence: 'brings detachment and spiritual focus',
    caution: 'may create isolation or detachment from material world'
  }
};

/**
 * House domain characteristics
 */
const HOUSE_DOMAINS = {
  1: { primary: 'self-identity', secondary: 'personality', areas: ['personal confidence', 'physical appearance', 'how you present yourself'] },
  2: { primary: 'wealth', secondary: 'family resources', areas: ['possessions', 'speech', 'food habits', 'financial stability'] },
  3: { primary: 'communication', secondary: 'siblings', areas: ['courage', 'short journeys', 'writing', 'learning'] },
  4: { primary: 'home', secondary: 'mother', areas: ['property', 'emotional foundations', 'inner peace', 'domestic life'] },
  5: { primary: 'creativity', secondary: 'children', areas: ['education', 'romance', 'speculation', 'intelligence'] },
  6: { primary: 'health', secondary: 'service', areas: ['daily routines', 'enemies', 'workplace challenges', 'diseases'] },
  7: { primary: 'partnerships', secondary: 'marriage', areas: ['business relationships', 'public dealings', 'spouse'] },
  8: { primary: 'transformation', secondary: 'longevity', areas: ['occult', 'shared resources', 'sudden changes', 'mysteries'] },
  9: { primary: 'spirituality', secondary: 'father', areas: ['higher learning', 'dharma', 'philosophy', 'long journeys'] },
  10: { primary: 'career', secondary: 'reputation', areas: ['public standing', 'authority', 'profession', 'status'] },
  11: { primary: 'gains', secondary: 'income', areas: ['friendships', 'aspirations', 'social networks', 'fulfillment of desires'] },
  12: { primary: 'losses', secondary: 'expenses', areas: ['spirituality', 'isolation', 'hidden enemies', 'karma', 'liberation'] }
};

/**
 * Check if house is dusthana (6/8/12) - struggle houses
 */
function isDusthanaHouse(house) {
  return house === 6 || house === 8 || house === 12;
}

/**
 * Get dusthana house struggle description
 */
function getDusthanaStruggle(house, planetName) {
  const struggles = {
    6: {
      primary: 'daily struggles, health challenges, and workplace conflicts',
      feeling: 'constant effort without peace, restlessness, dissatisfaction',
      experience: 'You may feel drained by daily routines, health concerns, or workplace tensions.'
    },
    8: {
      primary: 'transformation, obstacles, and sudden changes',
      feeling: 'deep pressure, hidden challenges, karmic weight',
      experience: 'This placement brings deep pressure and hidden challenges that require significant inner strength.'
    },
    12: {
      primary: 'losses, isolation, and karmic resolution',
      feeling: 'isolation, draining energy, effort without visible results',
      experience: 'This placement can feel isolating and draining, with effort that doesn\'t always show visible results.'
    }
  };
  
  return struggles[house] || null;
}

/**
 * Generate planet+house specific narrative with astrological authenticity
 * ASTROLOGICAL AUTHENTICITY: Dusthana houses must feel like struggle, not neutral
 */
function generatePlanetHouseNarrative(planet, house, ruleMeaning = null) {
  const planetName = getPlanetName(planet);
  const planetUpper = planet.toUpperCase();
  const planetNature = PLANET_NATURES[planetUpper];
  const houseDomain = HOUSE_DOMAINS[house];
  
  if (!planetNature || !houseDomain) {
    // Fallback if planet/house not found
    return ruleMeaning || `This planetary placement influences life experiences in this area.`;
  }
  
  // ASTROLOGICAL AUTHENTICITY: Dusthana house pain priority
  const isDusthana = isDusthanaHouse(house);
  const struggle = isDusthana ? getDusthanaStruggle(house, planetName) : null;
  
  // Build specific narrative combining planet nature + house domain
  // IMPORTANT: User requested 7–8 lines minimum (multi-line, astrologer-style, blunt + explanatory)
  const lines = [];

  // Primary statement: Planet influence on house domain
  const areaPhrase = houseDomain.areas.length > 0 
    ? `such as ${houseDomain.areas[0]} or ${houseDomain.areas[1] || houseDomain.areas[0]}`
    : `${houseDomain.primary} and ${houseDomain.secondary}`;
  
  // Line 1: Felt experience (pain / manifestation)
  if (isDusthana && struggle) {
    lines.push(`${struggle.experience}`);
    lines.push(`In this placement, ${houseDomain.primary} can feel like ${struggle.feeling}.`);
  } else {
    const painPhrase = getPainPhrase(planetNature, houseDomain);
    lines.push(painPhrase);
    lines.push(`The pressure tends to concentrate around ${houseDomain.primary} and ${houseDomain.secondary}.`);
  }
  
  // Line 3–4: Situation + manifestation (house-specific)
  lines.push(`This is ${planetName} working through your ${getOrdinal(house)} house, so the story plays out through ${areaPhrase}.`);
  lines.push(`In daily life, it can show through decisions, timing, and repeated situations connected to ${houseDomain.primary}.`);

  // Line 5: Planet tone (distinct)
  lines.push(`${planetName} here ${planetNature.influence}, which shapes how you handle this area when things are smooth and when they are tense.`);

  // Line 6: Caution (blunt, but neutral)
  if (planetNature.caution) {
    lines.push(`A caution in this placement: it ${planetNature.caution}.`);
  } else {
    lines.push(`A caution in this placement: the same theme can repeat until the lesson is handled cleanly.`);
  }

  // Line 7: Direction (from ruleMeaning if available; otherwise grounded guidance)
  if (ruleMeaning && 
      !ruleMeaning.includes('planetary configuration creates specific influences') &&
      !ruleMeaning.includes('Planetary positions reflect karmic patterns') &&
      !ruleMeaning.includes('This placement influences') &&
      ruleMeaning.length > 50) {
    const cleaned = ruleMeaning
      .replace(/This placement influences?/gi, '')
      .replace(/This planetary/gi, '')
      .replace(/planetary configuration creates specific influences/gi, '')
      .replace(/Planetary positions reflect karmic patterns/gi, '')
      .trim();
    if (cleaned && cleaned.length > 20 && !isSimilarSentence(cleaned, lines[0])) {
      lines.push(cleaned);
    } else {
      lines.push(`When you keep actions simple and consistent in ${houseDomain.primary}, the pressure reduces naturally.`);
    }
  } else {
    lines.push(`When you keep actions simple and consistent in ${houseDomain.primary}, the pressure reduces naturally.`);
  }
  
  // Line 8: Calm close (no promises, no fear)
  lines.push(`Over time, this placement becomes easier to handle as your approach to ${houseDomain.primary} becomes more mature and steady.`);

  // Ensure at least 7–8 lines; return multi-line narrative for UI readability
  const finalLines = lines.filter(Boolean).slice(0, 8);
  return finalLines.join('\n').trim();
}

/**
 * Get pain phrase (felt experience) based on planet nature and house domain
 * PAIN-FIRST UX: Start with what the user FEELS, not astrological rules
 */
function getPainPhrase(planetNature, houseDomain) {
  // Safety checks
  if (!planetNature || !houseDomain) {
    return `This placement influences life experiences.`;
  }
  
  const planet = planetNature.name ? planetNature.name.toLowerCase() : '';
  const domain = houseDomain.primary ? houseDomain.primary.toLowerCase() : '';
  
  // Pain phrases based on planet + domain combinations
  if (planet === 'sun' && (domain.includes('career') || domain.includes('identity'))) {
    return `Your sense of self feels uncertain. Recognition feels distant.`;
  }
  if (planet === 'moon' && (domain.includes('mind') || domain.includes('emotion'))) {
    return `Your emotions feel unstable. Peace feels hard to find.`;
  }
  if (planet === 'mars' && (domain.includes('energy') || domain.includes('action'))) {
    return `Your energy feels scattered. Action feels blocked.`;
  }
  if (planet === 'mercury' && (domain.includes('communication') || domain.includes('thought'))) {
    return `Your thoughts feel unclear. Communication feels difficult.`;
  }
  if (planet === 'jupiter' && (domain.includes('growth') || domain.includes('wisdom'))) {
    return `Growth feels slow. Wisdom feels out of reach.`;
  }
  if (planet === 'venus' && (domain.includes('love') || domain.includes('pleasure'))) {
    return `Love feels complicated. Pleasure feels distant.`;
  }
  if (planet === 'saturn' && (domain.includes('responsibility') || domain.includes('delay'))) {
    return `Responsibilities feel heavy. Progress feels delayed.`;
  }
  if (planet === 'rahu' && (domain.includes('desire') || domain.includes('restless'))) {
    return `Desires feel unfulfilled. Restlessness increases.`;
  }
  if (planet === 'ketu' && (domain.includes('detachment') || domain.includes('isolation'))) {
    return `Connection feels distant. Isolation feels stronger.`;
  }
  
  // Generic pain phrase based on planet nature
  if (planetNature.influence && (planetNature.influence.includes('challenges') || planetNature.influence.includes('difficulties'))) {
    return `${houseDomain.primary || 'life'} feels difficult. ${houseDomain.secondary || 'experiences'} feels strained.`;
  }
  
  // Default: felt experience
  const primary = houseDomain.primary || 'life';
  const influence = planetNature.influence || '';
  return `${primary} feels ${influence.includes('supports') ? 'supported' : 'affected'}.`;
}

/**
 * Check if two sentences are similar (repetition detection)
 */
function isSimilarSentence(s1, s2) {
  if (!s1 || !s2) return false;
  const n1 = s1.toLowerCase().replace(/[^\w\s]/g, '').trim();
  const n2 = s2.toLowerCase().replace(/[^\w\s]/g, '').trim();
  const words1 = new Set(n1.split(/\s+/));
  const words2 = new Set(n2.split(/\s+/));
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  return (intersection.size / union.size) > 0.6;
}

/**
 * Get correct ordinal for house number
 */
function getOrdinal(num) {
  if (!num || typeof num !== 'number') return `${num}th`;
  
  const lastDigit = num % 10;
  const lastTwoDigits = num % 100;
  
  if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
    return `${num}th`;
  }
  
  switch (lastDigit) {
    case 1: return `${num}st`;
    case 2: return `${num}nd`;
    case 3: return `${num}rd`;
    default: return `${num}th`;
  }
}

/**
 * Check if remedy text is actionable (HARD FILTER - CRITICAL)
 * A remedy MUST be actionable - must include clear action verbs
 * Removes philosophical/explanatory sentences and rule-like text
 */
function isActionableRemedy(text) {
  if (!text || typeof text !== 'string' || text.trim().length < 10) return false;
  
  const lowerText = text.toLowerCase().trim();
  
  // CRITICAL: Must have at least ONE clear action verb at the start or early in sentence
  // Action verbs that MUST be present for a valid remedy
  const requiredActionVerbs = [
    'donate', 'donation', 'give', 'offer', 'contribute',
    'feed', 'feeding', 'serve food', 'provide food',
    'chant', 'chanting', 'jap', 'mantra', 'recite', 'repeat',
    'meditate', 'meditation', 'pray', 'prayer',
    'fast', 'fasting', 'abstain', 'abstain from',
    'wear', 'install', 'place', 'keep',
    'avoid', 'refrain', 'refrain from', 'do not',
    'perform', 'practice', 'do', 'follow',
    'help', 'serve', 'service', 'assist',
    'maintain', 'keep', 'observe', 'adhere',
    'visit', 'go to', 'attend'
  ];
  
  // Check if text contains action verb (prefer early, but allow anywhere if clear action)
  const hasRequiredAction = requiredActionVerbs.some(verb => {
    const index = lowerText.indexOf(verb);
    // Action verb should appear within first 150 chars (allows for longer intros)
    return index >= 0 && index < 150;
  });
  
  // If no required action verb found, reject
  if (!hasRequiredAction) {
    return false;
  }
  
  // HARD FILTER: Exclude philosophical/explanatory/rule-like patterns
  const exclusionPatterns = [
    // Rule-like explanations
    /this (placement|planet|house|position|configuration)/i,
    /planetary (position|placement|influence|configuration)/i,
    /tends to/i,
    /may (influence|affect|create|help|support)/i,
    /might (influence|affect|help)/i,
    /could (influence|affect|help)/i,
    /can (influence|affect|create|help)/i,
    /is (likely|probably|generally|often|usually)/i,
    /often (results|leads|creates|influences)/i,
    /typically (influences|affects|results)/i,
    /usually (causes|results|influences)/i,
    /before (wearing|installing|using|practicing)/i, // Safety notes
    /one may (assess|consider|evaluate)/i,
    /it is (assumed|believed|said|thought)/i,
    /such as/i, // "Remedial practices such as..."
    /practices such as/i,
    /remedial practices/i,
    /this practice (tends|may|can|might)/i,
    /planetary positions reflect/i,
    /karmic patterns/i,
    /some influences are/i,
    /must be experienced/i,
    /can be modified/i,
    /reflects (karmic|planetary)/i
  ];
  
  // If matches any exclusion pattern, reject
  const matchesExclusion = exclusionPatterns.some(pattern => pattern.test(text));
  if (matchesExclusion) {
    return false;
  }
  
  // Final check: Text should be imperative or action-oriented
  // Should not be a statement about what "is" or "may be"
  const isStatement = /^(this|these|it|they|planetary|karmic)/i.test(text.trim());
  if (isStatement && !hasRequiredAction) {
    return false;
  }
  
  return true;
}

/**
 * Format remedy description following PAIN-FIRST UX structure:
 * Why issue exists → Why remedy helps → What to expect
 * Remedies should feel optional, supportive, and non-judgmental
 */
function formatRemedyForUX(description) {
  if (!description || typeof description !== 'string') return description;
  
  const trimmed = description.trim();
  
  // If already follows pain-first structure, return as-is
  if (/^(this|these|when|because|since|as|due to|when you|if you)/i.test(trimmed)) {
    return trimmed;
  }
  
  // Extract action from remedy
  const actionMatch = trimmed.match(/^(donate|feed|chant|wear|install|perform|practice|avoid|give|offer|visit|go to|pray|meditate|serve|help|support|provide|share|contribute)/i);
  if (actionMatch) {
    const action = actionMatch[1].toLowerCase();
    const rest = trimmed.substring(actionMatch[0].length).trim();
    
    // Build pain-first structure: Why issue exists → Why remedy helps → What to expect
    // For now, keep it simple and supportive
    return `When ${action}${rest ? ' ' + rest : ''}, this may help restore balance. Results may take time.`;
  }
  
  // If it's a list (comma-separated actions), format supportively
  if (trimmed.includes(',') && trimmed.length > 30) {
    const actions = trimmed.split(',').map(s => s.trim()).filter(s => s.length > 0);
    if (actions.length >= 2) {
      const lastAction = actions.pop();
      const actionList = actions.join(', ');
      const connector = lastAction.toLowerCase().startsWith('or ') ? '' : 'or ';
      return `When practicing ${actionList}, ${connector}${lastAction}, this may help restore balance. Results may take time.`;
    }
  }
  
  // Default: make it supportive and add expectation
  return `${trimmed} This may help restore balance. Results may take time.`;
}

/**
 * Deduplicate remedies by normalized text (case-insensitive, whitespace normalized)
 */
function deduplicateRemedies(remedies) {
  const seen = new Set();
  const unique = [];
  
  for (const remedy of remedies) {
    // Normalize: lowercase, trim, remove extra whitespace
    const normalized = remedy.description
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' '); // Normalize whitespace
    
    if (!seen.has(normalized)) {
      seen.add(normalized);
      unique.push(remedy);
    }
  }
  
  return unique;
}

/**
 * Extract and filter actionable remedies from rule
 */
function extractRemediesFromRule(rule) {
  const remedies = [];
  
  // Check effect_json for remedies
  if (rule.effect_json && rule.effect_json.remedies) {
    const remedyList = Array.isArray(rule.effect_json.remedies) 
      ? rule.effect_json.remedies 
      : [rule.effect_json.remedies];
    
    remedyList.forEach((remedy, index) => {
      const description = typeof remedy === 'string' ? remedy : (remedy?.description || '');
      
      if (description && isActionableRemedy(description)) {
        remedies.push({
          number: remedy.number || index + 1,
          description: formatRemedyForUX(description.trim())
        });
      }
    });
  }
  
  // Check canonical_meaning for remedy patterns
  if (rule.canonical_meaning && remedies.length === 0) {
    const remedyPattern = /\((\d+)\)\s*([^\n(]+)/g;
    let match;
    while ((match = remedyPattern.exec(rule.canonical_meaning)) !== null) {
      const description = match[2].trim();
      if (isActionableRemedy(description)) {
        remedies.push({
          number: parseInt(match[1]),
          description: formatRemedyForUX(description)
        });
      }
    }
  }
  
  // Deduplicate and return
  return deduplicateRemedies(remedies);
}

/**
 * Extract actionable remedy from descriptive text
 * If text contains actionable verbs, extract them into actionable format
 */
function extractActionableFromDescriptive(text) {
  if (!text || typeof text !== 'string') return null;
  
  const lowerText = text.toLowerCase();
  
  // Action verbs that indicate actionable remedy
  const actionVerbs = [
    'donate', 'donation', 'give', 'offer', 'contribute',
    'feed', 'feeding', 'serve food', 'provide food',
    'chant', 'chanting', 'jap', 'mantra', 'recite', 'repeat',
    'meditate', 'meditation', 'pray', 'prayer',
    'fast', 'fasting', 'abstain',
    'wear', 'install', 'place', 'keep',
    'avoid', 'refrain', 'do not',
    'perform', 'practice', 'do', 'follow',
    'help', 'serve', 'service', 'assist',
    'maintain', 'keep', 'observe', 'adhere',
    'visit', 'go to', 'attend'
  ];
  
  // Find first actionable verb in text
  for (const verb of actionVerbs) {
    const index = lowerText.indexOf(verb);
    if (index >= 0 && index < 200) {
      // Extract from action verb onwards
      const extracted = text.substring(index).trim();
      // Clean up: remove trailing "may help", "tends to", etc.
      const cleaned = extracted
        .replace(/\s+may\s+(help|support|balance).*$/i, '')
        .replace(/\s+tends?\s+to.*$/i, '')
        .replace(/\s+such\s+as.*$/i, '')
        .trim();
      
      // Capitalize first letter
      if (cleaned.length > 10) {
        return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
      }
    }
  }
  
  return null;
}

/**
 * Query remedies from database for planet+house combination
 * REGRESSION FIX: Restore remedy attachment - extract actionable remedies
 */
async function queryRemediesForPlanetHouse(planet, house) {
  const planetId = PLANET_IDS[planet.toUpperCase()];
  if (planetId === undefined) return [];
  
  try {
    // Query remedies that target this planet
    // Also check if remedy description mentions house or house-related themes
    const houseThemes = HOUSE_DOMAINS[house]?.areas || [];
    const themePattern = houseThemes.slice(0, 2).join('|');
    
    const remediesRes = await query(
      `SELECT 
        id,
        name,
        type,
        description,
        target_planets,
        target_themes
      FROM remedies
      WHERE is_active = TRUE
        AND (
          $1 = ANY(target_planets)
          OR description ILIKE ANY(ARRAY[$2, $3, $4])
        )
      ORDER BY 
        CASE WHEN $1 = ANY(target_planets) THEN 1 ELSE 2 END,
        id
      LIMIT 20`,
      [
        planetId,
        house ? `%${HOUSE_DOMAINS[house]?.primary || ''}%` : null,
        house ? `%${HOUSE_DOMAINS[house]?.secondary || ''}%` : null,
        themePattern ? `%${themePattern}%` : null
      ]
    );
    
    // REGRESSION FIX: Extract actionable remedies from DB
    // First try direct actionable check, then try extraction from descriptive text
    const actionable = [];
    
    for (const r of remediesRes.rows) {
      if (!r.description || r.description.trim().length < 10) continue;
      
      // Check if directly actionable
      if (isActionableRemedy(r.description)) {
        actionable.push({
          number: actionable.length + 1,
          description: formatRemedyForUX(r.description.trim())
        });
      } else {
        // Try to extract actionable part from descriptive text
        const extracted = extractActionableFromDescriptive(r.description);
        if (extracted && extracted.length > 10) {
          actionable.push({
            number: actionable.length + 1,
            description: formatRemedyForUX(extracted)
          });
        }
      }
      
      // Stop at 2 remedies
      if (actionable.length >= 2) break;
    }
    
    // Deduplicate and return (max 2)
    return deduplicateRemedies(actionable).slice(0, 2);
  } catch (err) {
    console.error(`[LalkitabPrediction] Error querying remedies:`, err);
    return [];
  }
}

/**
 * Generate Lal Kitab Prediction data
 */
export async function generateLalkitabPrediction(windowId) {
  // Input validation
  if (!windowId || Number.isNaN(Number(windowId))) {
    throw new Error('WINDOW_ID missing or invalid');
  }

  const windowIdNum = Number(windowId);

  // Load window
  const windowRes = await query(
    'SELECT id, scope, start_at, end_at, user_id, chart_id FROM prediction_windows WHERE id = $1',
    [windowIdNum]
  );
  
  if (windowRes.rowCount === 0) {
    throw new Error(`Window not found: ${windowId}`);
  }
  
  const window = windowRes.rows[0];
  
  // Load astro snapshot
  const astroRes = await query(
    'SELECT * FROM astro_state_snapshots WHERE window_id = $1',
    [windowIdNum]
  );
  
  if (astroRes.rowCount === 0) {
    throw new Error(`Astro snapshot not found for window_id=${windowId}`);
  }
  
  const astroSnapshot = astroRes.rows[0];
  
  // Normalize astro state
  const astroNormalized = normalizeAstroState(astroSnapshot);
  
  // Get planet positions with sign information
  const planetPositions = [];
  for (const [planetName, planetData] of Object.entries(astroNormalized.planetsByName)) {
    if (planetData && planetData.house) {
      // Get sign for this planet (handle Rahu/Ketu)
      let sign = planetData.sign || null;
      let signName = null;
      
      if (sign) {
        signName = getSignName(sign);
      } else {
        // Try to derive sign from longitude if available
        if (planetData.longitude) {
          const signNum = Math.floor(planetData.longitude / 30) + 1;
          if (signNum >= 1 && signNum <= 12) {
            sign = signNum;
            signName = getSignName(signNum);
          }
        }
      }
      
      planetPositions.push({
        planet: planetName.toUpperCase(),
        house: planetData.house,
        sign: sign,
        signName: signName
      });
    }
  }
  
  // Query Lal Kitab BASE rules
  let rulesRes;
  try {
    rulesRes = await query(
      `SELECT 
        id,
        rule_id,
        rule_type,
        condition_tree,
        effect_json,
        canonical_meaning,
        source_book,
        source_unit_id
      FROM rules
      WHERE is_active = TRUE
        AND source_book = 'lalkitab'
        AND rule_type = 'BASE'
        AND (engine_status = 'READY' OR engine_status IS NULL)
      ORDER BY id ASC`
    );
  } catch (err) {
    console.log(`[LalkitabPrediction] Rules query failed: ${err.message}`);
    rulesRes = await query(
      `SELECT 
        id,
        rule_id,
        rule_type,
        condition_tree,
        effect_json,
        canonical_meaning,
        source_book,
        source_unit_id
      FROM rules
      WHERE is_active = TRUE
        AND (rule_id LIKE 'lalkitab%' OR rule_id LIKE 'lal_kitab%')
        AND (rule_type = 'BASE' OR rule_type IS NULL)
        AND (engine_status = 'READY' OR engine_status IS NULL)
      ORDER BY id ASC
      LIMIT 200`
    );
  }
  
  const lalkitabRules = rulesRes.rows;
  
  console.log(`[LalkitabPrediction] Window ${windowId}: Found ${lalkitabRules.length} Lal Kitab rules`);
  
  // Match rules with planet positions
  const predictions = [];
  const seenPlanets = new Set(); // Prevent duplicates
  
  // Planet order for display
  const planetOrder = ['SUN', 'MOON', 'MARS', 'MERCURY', 'JUPITER', 'VENUS', 'SATURN', 'RAHU', 'KETU'];
  
  for (const planetPos of planetPositions) {
    const planetName = planetPos.planet.toUpperCase();
    
    // Skip if not in traditional order or already processed
    if (!planetOrder.includes(planetName) || seenPlanets.has(planetName)) {
      continue;
    }
    
    seenPlanets.add(planetName);
    
    // Find matching lalkitab rule for this planet × house combination
    let matchingRule = null;
    
    for (const rule of lalkitabRules) {
      try {
        const matches = evalNode(rule.condition_tree, astroNormalized);
        if (matches) {
          // Verify this rule matches our specific planet+house
          const ct = rule.condition_tree;
          if (ct?.planet_in_house) {
            const rulePlanets = ct.planet_in_house.planet_in || [];
            const ruleHouses = ct.planet_in_house.house_in || [];
            
            const matchesPlanet = rulePlanets.length === 0 || rulePlanets.includes(planetName);
            const matchesHouse = ruleHouses.length === 0 || ruleHouses.includes(planetPos.house);
            
            if (matchesPlanet && matchesHouse) {
              matchingRule = rule;
              break;
            }
          } else {
            // If no specific planet_in_house, use first match
            matchingRule = rule;
            break;
          }
        }
      } catch (err) {
        console.error(`Error evaluating rule ${rule.rule_id}:`, err);
        continue;
      }
    }
    
    // Generate narrative (always planet+house specific)
    let narrative;
    if (matchingRule) {
      const ruleMeaning = matchingRule.canonical_meaning || 
        matchingRule.effect_json?.narrative || 
        matchingRule.effect_json?.description ||
        null;
      
      narrative = generatePlanetHouseNarrative(planetName, planetPos.house, ruleMeaning);
    } else {
      // Even without matching rule, generate specific narrative
      narrative = generatePlanetHouseNarrative(planetName, planetPos.house);
    }
    
    // Quality guardrail: Ensure narrative is not generic
    if (narrative.includes('planetary configuration creates specific influences') ||
        narrative.includes('Planetary positions reflect karmic patterns')) {
      // Regenerate without rule meaning
      narrative = generatePlanetHouseNarrative(planetName, planetPos.house);
    }
    
    // Extract remedies from rule
    let remedies = [];
    if (matchingRule) {
      remedies = extractRemediesFromRule(matchingRule);
    }
    
    // Query DB remedies if rule remedies not found
    if (remedies.length === 0) {
      remedies = await queryRemediesForPlanetHouse(planetName, planetPos.house);
    }
    
    // REGRESSION FIX: Ensure at least 1-2 remedies when available in DB
    if (remedies.length === 0) {
      // Try broader search - just by planet (without house filter)
      const planetId = PLANET_IDS[planetName];
      if (planetId !== undefined) {
        try {
          const broaderRes = await query(
            `SELECT description FROM remedies
             WHERE is_active = TRUE
               AND $1 = ANY(target_planets)
             ORDER BY id
             LIMIT 20`,
            [planetId]
          );
          
          // Extract actionable remedies (direct or from descriptive text)
          const actionable = [];
          for (const r of broaderRes.rows) {
            if (!r.description || r.description.trim().length < 10) continue;
            
            if (isActionableRemedy(r.description)) {
              actionable.push({
                number: actionable.length + 1,
                description: formatRemedyForUX(r.description.trim())
              });
            } else {
              const extracted = extractActionableFromDescriptive(r.description);
              if (extracted && extracted.length > 10) {
                actionable.push({
                  number: actionable.length + 1,
                  description: formatRemedyForUX(extracted)
                });
              }
            }
            
            if (actionable.length >= 2) break;
          }
          
          remedies = deduplicateRemedies(actionable);
        } catch (err) {
          console.error(`[LalkitabPrediction] Error in broader remedy search:`, err);
        }
      }
    }
    
    // UX Polish: Max 2 meaningful remedies per planet
    const finalRemedies = remedies.slice(0, 2);
    
    // REGRESSION FIX: Ensure remedies is never null when remedies exist
    predictions.push({
      planet: planetName,
      house: planetPos.house,
      narrative: narrative,
      remedies: finalRemedies.length > 0 ? finalRemedies : null
    });
  }
  
  // Sort by planet order
  predictions.sort((a, b) => {
    const indexA = planetOrder.indexOf(a.planet);
    const indexB = planetOrder.indexOf(b.planet);
    return indexA - indexB;
  });
  
  // Final quality check: Ensure no duplicate narratives and validate output
  const narrativeSet = new Set();
  const uniquePredictions = [];
  
  for (const pred of predictions) {
    // Quality guardrails
    // 1. Ensure narrative is not generic
    if (pred.narrative && (
      pred.narrative.includes('planetary configuration creates specific influences') ||
      pred.narrative.includes('Planetary positions reflect karmic patterns')
    )) {
      // Regenerate without generic text
      pred.narrative = generatePlanetHouseNarrative(pred.planet, pred.house);
    }
    
    // 2. Ensure no null/unknown values in narrative
    if (pred.narrative && (pred.narrative.includes('null') || pred.narrative.includes('Unknown'))) {
      pred.narrative = pred.narrative.replace(/null|Unknown/gi, '').trim();
    }
    
    // 3. Ensure narrative is not empty
    if (!pred.narrative || pred.narrative.trim().length < 20) {
      pred.narrative = generatePlanetHouseNarrative(pred.planet, pred.house);
    }
    
    // 4. Check for duplicates
    const narrativeKey = `${pred.planet}_${pred.house}_${pred.narrative.substring(0, 50)}`;
    if (!narrativeSet.has(narrativeKey)) {
      narrativeSet.add(narrativeKey);
      uniquePredictions.push(pred);
    }
  }
  
  return {
    meta: {
      window_id: String(windowId),
      generated_at: new Date().toISOString()
    },
    predictions: uniquePredictions
  };
}

