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
  const planetUpper = String(planet || '').toUpperCase();
  const planetName = getPlanetName(planetUpper) || String(planet || 'Planet');
  const houseDomain = HOUSE_DOMAINS[Number(house)];

  if (!planetUpper || !houseDomain) {
    const fallback = String(ruleMeaning || '').trim();
    if (fallback && fallback.length >= 40) return fallback;
    return `${planetName} in this house creates repeating themes connected to daily life.`;
  }

  const isDusthana = isDusthanaHouse(Number(house));
  const examples = Array.isArray(houseDomain.areas) ? houseDomain.areas : [];
  const exA = examples[0] || houseDomain.primary;
  const exB = examples[1] || houseDomain.secondary || houseDomain.primary;

  const safeRuleLine = (() => {
    const t = String(ruleMeaning || '').trim();
    if (!t || t.length < 40) return null;
    const bad = [
      'this planetary configuration creates specific influences',
      'planetary positions reflect karmic patterns',
      'this placement influences',
      'placement influences',
    ];
    const lower = t.toLowerCase();
    if (bad.some((b) => lower.includes(b))) return null;
    const first = t.split(/[.!?]\s+/)[0]?.trim();
    if (!first || first.length < 30) return null;
    return `Lal Kitab note: ${first}.`;
  })();

  // Lal Kitab voice target:
  // observation → repetition → life example → warning → guidance → calm close
  const lines = [];

  // Dusthana framing (6/8/12) should feel heavier
  if (isDusthana) {
    const s = getDusthanaStruggle(Number(house), planetName);
    if (s?.experience) lines.push(s.experience);
    lines.push(`In this house, matters of ${houseDomain.primary} rarely move in a straight line.`);
  }

  switch (planetUpper) {
    case 'SUN': {
      lines.push(`With Sun in the ${getOrdinal(Number(house))} house, self-respect becomes tied to ${houseDomain.primary}.`);
      lines.push(`You measure your worth through respect and position. That is why small insults feel big.`);
      lines.push(`In life it repeats as clashes with authority, or moments where your voice is tested in ${exA}.`);
      lines.push(`The pattern is simple: ego reacts first, then the situation hardens.`);
      lines.push(`The correction is not to become small—it is to become steady.`);
      lines.push(`Lead like responsibility, not like pride.`);
      lines.push(`When dignity stays calm, this placement starts giving cleaner outcomes in ${houseDomain.primary}.`);
      break;
    }
    case 'MOON': {
      lines.push(`With Moon in the ${getOrdinal(Number(house))} house, your mind searches for safety through ${houseDomain.primary}.`);
      lines.push(`If the inner base feels shaky, mood and decisions swing quickly.`);
      lines.push(`It shows as overthinking, emotional reactions, or attachment patterns around ${exA} and ${exB}.`);
      lines.push(`You may comfort-seek first, and only later ask: “What is actually stable here?”`);
      lines.push(`This Moon becomes better when routine becomes your shield.`);
      lines.push(`Keep one daily habit fixed—even when emotions change.`);
      lines.push(`When the mind feels held, relationships and gains stop becoming a roller-coaster.`);
      break;
    }
    case 'MARS': {
      lines.push(`With Mars in the ${getOrdinal(Number(house))} house, your action energy goes straight into ${houseDomain.primary}.`);
      lines.push(`Quick reactions. Strong words. A desire to prove yourself.`);
      lines.push(`It repeats as arguments, impulsive moves, or sudden breaks connected to ${exA}.`);
      lines.push(`If anger becomes a habit, courage turns into conflict.`);
      lines.push(`Your remedy is disciplined action: decide once, act cleanly, and stop re-fighting the same battle.`);
      lines.push(`Channel Mars into one goal—fitness, skill, or a focused project.`);
      lines.push(`When Mars is trained, it gives strong results instead of repeated damage.`);
      break;
    }
    case 'MERCURY': {
      lines.push(`With Mercury in the ${getOrdinal(Number(house))} house, life tests your clarity in ${houseDomain.primary}.`);
      lines.push(`The mind stays busy; communication becomes a major karma point.`);
      lines.push(`It repeats as misunderstandings, mixed signals, or over-analysis around ${exA}.`);
      lines.push(`When you speak too fast, people hear the wrong thing.`);
      lines.push(`Write before you speak. Plan before you promise.`);
      lines.push(`Mercury rewards structure: lists, boundaries, and one task at a time.`);
      lines.push(`As clarity grows, your results become consistent instead of scattered.`);
      break;
    }
    case 'JUPITER': {
      lines.push(`With Jupiter in the ${getOrdinal(Number(house))} house, your beliefs and judgement shape ${houseDomain.primary}.`);
      lines.push(`Jupiter gives hope—but it also tests excess optimism.`);
      lines.push(`It repeats as over-promising, trusting the wrong person, or spending confidence too early in ${exA}.`);
      lines.push(`When wisdom becomes a habit, luck follows. When shortcuts become a habit, Jupiter punishes through disappointment.`);
      lines.push(`Stay ethical and practical: verify before you commit.`);
      lines.push(`Take guidance from a mentor-like figure, but keep your own accountability.`);
      lines.push(`Then Jupiter starts giving support through clean growth, not inflated expectations.`);
      break;
    }
    case 'VENUS': {
      lines.push(`With Venus in the ${getOrdinal(Number(house))} house, desire and comfort strongly touch ${houseDomain.primary}.`);
      lines.push(`You want harmony—but you can also tolerate too much just to keep peace.`);
      lines.push(`It repeats as attachment, indulgence, or people-pleasing patterns around ${exA}.`);
      lines.push(`When pleasure becomes a coping tool, Venus starts creating regret.`);
      lines.push(`Your discipline is simple: enjoy, but do not lose standards.`);
      lines.push(`Choose one boundary and keep it—especially in relationships and spending.`);
      lines.push(`Balanced Venus gives sweetness without addiction to comfort.`);
      break;
    }
    case 'SATURN': {
      lines.push(`With Saturn in the ${getOrdinal(Number(house))} house, responsibility becomes a repeating life tone in ${houseDomain.primary}.`);
      lines.push(`Effort is real. Recognition arrives late.`);
      lines.push(`The same lesson repeats until discipline becomes natural, not forced.`);
      lines.push(`If you try shortcuts here, delays increase. If you stay consistent, stability grows quietly.`);
      lines.push(`Do not fight time—build structure.`);
      lines.push(`One fixed routine will protect you more than ten new plans.`);
      lines.push(`Saturn rewards mature choices: slow, clean, and durable.`);
      break;
    }
    case 'RAHU': {
      lines.push(`With Rahu in the ${getOrdinal(Number(house))} house, desire and restlessness pull you into ${houseDomain.primary}.`);
      lines.push(`The mind wants more—faster.`);
      lines.push(`It repeats as confusion, sudden changes, or chasing an image in ${exA}.`);
      lines.push(`Rahu’s trick is: it promises relief, then increases hunger.`);
      lines.push(`Your protection is grounding: slow decisions, clean habits, and fewer risks.`);
      lines.push(`If something feels “too easy”, verify twice.`);
      lines.push(`When Rahu is handled with discipline, ambition becomes constructive instead of chaotic.`);
      break;
    }
    case 'KETU': {
      lines.push(`With Ketu in the ${getOrdinal(Number(house))} house, detachment starts shaping ${houseDomain.primary}.`);
      lines.push(`You can lose interest suddenly—even in things you wanted strongly before.`);
      lines.push(`It repeats as withdrawal, silence, or cutting off too quickly around ${exA}.`);
      lines.push(`Ketu gives insight, but it can also create isolation.`);
      lines.push(`Do not burn bridges in one emotional wave.`);
      lines.push(`Keep routine and body-grounding practices strong—this stabilizes the mind.`);
      lines.push(`Then Ketu becomes spiritual clarity, not emptiness.`);
      break;
    }
    default: {
      lines.push(`With ${planetName} in the ${getOrdinal(Number(house))} house, ${houseDomain.primary} becomes a repeating theme.`);
      lines.push(`Life teaches through repeated situations until your response becomes clean.`);
      lines.push(`Watch patterns around ${exA} and ${exB}.`);
      lines.push(`Do not overreact; do not ignore—handle steadily.`);
      lines.push(`Small consistent steps work better than dramatic fixes.`);
      lines.push(`Over time, stability comes through maturity and repetition.`);
      break;
    }
  }

  if (safeRuleLine && !isSimilarSentence(safeRuleLine, lines[0])) {
    // Add one book-derived note (if it’s actually meaningful and non-generic)
    lines.splice(Math.min(3, lines.length), 0, safeRuleLine);
  }

  // Ensure 7–8 lines, varied rhythm, no template phrases
  const finalLines = lines
    .map((l) => String(l || '').trim())
    .filter(Boolean)
    .slice(0, 8);

  // If we ended up too short (rare), pad with grounded closing
  while (finalLines.length < 7) {
    finalLines.push(`Keep the response steady in ${houseDomain.primary}; repeated patterns soften when your reaction becomes disciplined.`);
  }

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
  
  const planet = String(planetNature?.planet || '').toLowerCase();
  const domain = String(houseDomain?.primary || '').toLowerCase();
  
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
  
  // Default: felt experience (avoid template words like "affected")
  const primary = houseDomain.primary || 'life';
  return `In ${primary}, things can feel unsettled until your response becomes steady.`;
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
 * Generate astrological context from matching rules (for Lal Kitab)
 * ASTROLOGICAL CONTEXT: Uses actual rules from both books
 */
async function generateAstrologicalContextForPlanetHouse(planetName, house) {
  if (!planetName) return null;
  
  try {
    // Query matching rules for this planet+house combination
    const rulesRes = await query(
      `SELECT canonical_meaning, effect_json, source_book
       FROM rules
        WHERE is_active = TRUE
          AND engine_status = 'READY'
          AND condition_tree->'planet_in_house'->'planet_in' @> $1::jsonb
          AND condition_tree->'planet_in_house'->'house_in' @> $2::jsonb
          AND (canonical_meaning IS NOT NULL OR effect_json IS NOT NULL)
        ORDER BY 
          CASE WHEN source_book = 'lalkitab' THEN 1 ELSE 2 END,
          id ASC
        LIMIT 3`,
      [JSON.stringify([String(planetName).toUpperCase()]), JSON.stringify([Number(house)])]
    );
    
    if (!rulesRes || !rulesRes.rows || rulesRes.rowCount === 0) {
      return null;
    }
    
    // Extract context from first meaningful rule
    for (const rule of rulesRes.rows) {
      let ruleText = rule.canonical_meaning;
      if (!ruleText && rule.effect_json) {
        ruleText = rule.effect_json.narrative || rule.effect_json.description || null;
      }
      
      if (ruleText && typeof ruleText === 'string' && ruleText.trim().length > 30) {
        // Extract first meaningful sentence
        const sentences = ruleText.split(/[.!?]+/).filter(s => s.trim().length > 20);
        if (sentences.length > 0) {
          let context = sentences[0].trim();
          // Clean generic phrases
          context = context.replace(/^(This|These|When|If|The way this influence manifests).*?/i, '');
          context = context.replace(/As with all astrological influences.*$/i, '');
          context = context.trim();
          
          if (context.length >= 30 && context.length <= 150) {
            return context;
          }
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error(`[LalkitabPrediction] Error generating astrological context:`, error.message);
    return null;
  }
}

/**
 * Generate micro-context line for remedy enrichment (planet-based)
 * MICRO-CONTEXT ENRICHMENT: Adds 1 contextual line based on planet
 * UPDATED: Now tries astrological context from rules first
 */
async function generateMicroContextForPlanet(planetName, house = null) {
  if (!planetName) return null;
  
  // PRIORITY 1: Try astrological context from actual rules
  if (house !== null) {
    const astroContext = await generateAstrologicalContextForPlanetHouse(planetName, house);
    if (astroContext) {
      return astroContext;
    }
  }
  
  // PRIORITY 2: Fallback to generic planet context
  const planet = String(planetName).toUpperCase();
  const planetContext = {
    'SATURN': 'Especially helpful during long, effort-heavy phases where progress feels slow.',
    'RAHU': 'Useful when the mind feels scattered or unstable, or when desires create confusion.',
    'KETU': 'Supports clarity during periods of detachment or spiritual seeking.',
    'SUN': 'Helpful when leadership responsibilities feel heavy or when recognition is delayed.',
    'MOON': 'Supports emotional calm and inner steadiness during sensitive periods.',
    'MARS': 'Useful when energy feels blocked or when conflicts create stress.',
    'MERCURY': 'Supports clear communication and mental focus during busy or scattered times.',
    'JUPITER': 'Helpful when wisdom or guidance feels needed, or when expansion feels blocked.',
    'VENUS': 'Supports harmony in relationships and material comfort during challenging periods.'
  };
  
  return planetContext[planet] || null;
}

/**
 * Format remedy description following PAIN-FIRST UX structure:
 * Why issue exists → Why remedy helps → What to expect
 * Remedies should feel optional, supportive, and non-judgmental
 */
function formatRemedyForUX(description) {
  if (!description || typeof description !== 'string') return description;
  
  let trimmed = description.trim();
  
  // FIXED: Remove generic phrases BEFORE formatting
  const genericPhrases = [
    /planetary configuration creates specific influences that shape life experiences and events/gi,
    /planetary configuration creates specific influences/gi,
    /planetary positions reflect karmic patterns/gi,
    /this planetary configuration/gi,
    /remedial practices such as donation, chanting, wearing gemstones, or installing yantras may help balance planetary influences/gi,
    /may help balance planetary influences/gi,
    /\.\s*planetary configuration/gi,
    /\.\s*results may take time\.\s*planetary configuration/gi
  ];
  
  for (const pattern of genericPhrases) {
    trimmed = trimmed.replace(pattern, '').trim();
  }
  
  // Clean up multiple spaces and periods
  trimmed = trimmed.replace(/\s+/g, ' ').replace(/\.\s*\./g, '.').trim();

  // Fix common extraction artifacts
  trimmed = trimmed.replace(/\bwear\s+ing\b/gi, 'wearing');
  trimmed = trimmed.replace(/\binstall\s+ing\b/gi, 'installing');
  trimmed = trimmed.replace(/\bwear\s+ing\s+gemstones\b/gi, 'wearing gemstones');

  // HARD GUARDRAIL: if generic phrases still remain, do not emit this remedy at all
  if (/planetary configuration creates specific influences/i.test(trimmed) ||
      /one may assess/i.test(trimmed) ||
      /remedial practices such as/i.test(trimmed)) {
    return '';
  }
  
  // If already follows pain-first structure, return as-is (after cleaning)
  if (/^(this|these|when|because|since|as|due to|when you|if you)/i.test(trimmed)) {
    return trimmed;
  }
  
  // If it's already an imperative remedy ("Donate...", "Chant...", "Feed..."), keep it as-is.
  // We do NOT want to convert it into a generic template sentence.
  if (/^(donate|feed|chant|wear|install|perform|practice|avoid|give|offer|visit|go to|pray|meditate|serve)\b/i.test(trimmed)) {
    return trimmed;
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
  
  // Default: return cleaned text (avoid adding generic filler lines)
  return trimmed;
}

/**
 * Curated fallback remedies (book + AI mix).
 * Used when DB/book text is generic or multi-type (gemstones/yantras/etc. in one sentence).
 * English-only output.
 */
function getCuratedRemediesForPlanet(planetName) {
  const p = String(planetName || '').toUpperCase();

  const byPlanet = {
    SUN: [
      `Offer water to the Sun at sunrise for 11 days (if culturally appropriate for you). This supports confidence and steadier self-respect.`,
      `Donate wheat or jaggery once a week. This supports stability around authority and recognition themes.`,
      `Chant "Om Suryaya Namah" 108 times daily for 21 days. This supports clarity in direction and leadership decisions.`,
      `Avoid ego-driven arguments for 14 days. This reduces repeated conflicts with authority or senior figures.`,
      `Do 10 minutes of posture-and-breath meditation daily. This supports confidence and mental steadiness.`
    ],
    SATURN: [
      `Donate black sesame or a small amount of mustard oil on Saturday. This supports steadiness during slow, effort-heavy phases.`,
      `Feed crows with cooked rice on Saturday morning. This helps soften isolation and mental heaviness patterns.`,
      `Light a sesame-oil lamp on Saturday evening. This supports stability and can improve sleep-restlessness tendencies.`,
      `Chant "Om Sham Shanicharaya Namah" 108 times daily for 40 days. This builds patience and reduces repeated friction.`,
      `Do 10 minutes of slow breath-counting meditation before sleep. This calms the mind when pressure feels constant.`
    ],
    MOON: [
      `Donate milk or white rice on Monday. This supports emotional steadiness when moods fluctuate.`,
      `Chant "Om Som Somaya Namah" 108 times daily for 21 days. This supports mental calm and better decision clarity.`,
      `Spend 10 minutes in a quiet body-scan meditation daily. This reduces emotional reactivity and inner restlessness.`,
      `Offer water to a Shivling on Monday (if culturally appropriate for you). This supports peace of mind and stability.`,
      `Avoid harsh speech during emotional peaks for 7 days. This reduces conflict patterns tied to mood swings.`
    ],
    MARS: [
      `Donate red lentils once a week. This helps reduce reactive conflict patterns and supports calmer action.`,
      `Chant "Om Mangalaaya Namah" 108 times daily for 21 days. This supports disciplined energy and fewer impulsive decisions.`,
      `Do 10 minutes of fast-then-slow breathing practice daily (safe pace). This releases agitation and restores focus.`,
      `Avoid unnecessary confrontations for 14 days. This reduces repeated friction and regret cycles.`,
      `Support a sibling or colleague in a practical way once a week. This balances Mars-linked competitiveness into cooperation.`
    ],
    MERCURY: [
      `Donate green gram once a week. This supports clearer thinking and smoother communication patterns.`,
      `Chant "Om Budhaya Namah" 108 times daily for 21 days. This supports focus and reduces scattered attention.`,
      `Do 10 minutes of single-point concentration meditation daily. This improves mental steadiness in busy phases.`,
      `Avoid gossip and rushed messaging for 14 days. This reduces misunderstandings and unnecessary conflict.`,
      `Write a daily 5-minute planning note. This supports Mercury by turning thoughts into structure.`
    ],
    JUPITER: [
      `Donate turmeric or simple educational supplies once a week. This supports guidance, ethics, and long-view stability.`,
      `Chant "Om Gurave Namah" 108 times daily for 21 days. This supports wisdom and reduces confusion in decisions.`,
      `Spend 10 minutes daily in gratitude meditation. This stabilizes faith and reduces inner doubt during slow phases.`,
      `Offer support to a teacher/mentor figure (practically, not emotionally). This strengthens positive Jupiter pathways.`,
      `Avoid over-promising for 14 days. This prevents disappointment cycles and builds credibility.`
    ],
    VENUS: [
      `Donate white sweets or clean clothing once a week. This supports harmony in relationships and emotional softness.`,
      `Chant "Om Shukraya Namah" 108 times daily for 21 days. This supports balance in love, comfort, and desire.`,
      `Do 10 minutes of loving-kindness meditation daily. This reduces bitterness and improves relational ease.`,
      `Avoid secretive temptations for 14 days. This reduces Venus-linked regret patterns.`,
      `Create one small beauty/cleanliness routine daily. This supports Venus through disciplined comfort.`
    ],
    RAHU: [
      `Donate a dark blanket or basic essentials to someone in need. This helps reduce confusion and sudden swings in focus.`,
      `Feed stray dogs with simple food once a week. This supports steadiness when desires feel uncontrolled.`,
      `Chant "Om Bhram Bhreem Bhroum Sah Rahave Namah" 108 times daily for 40 days. This supports mental clarity.`,
      `Practice 10 minutes of "label-the-thought" meditation daily. This reduces scattered attention and compulsive thinking.`,
      `Avoid shortcuts and risky decisions for 21 days. This reduces the chance of sudden reversals.`
    ],
    KETU: [
      `Donate a simple meal to someone quietly (without seeking credit). This supports clarity during detachment phases.`,
      `Chant "Om Kem Ketave Namah" 108 times daily for 40 days. This supports inner stability and grounded focus.`,
      `Practice 10 minutes of silent sitting meditation daily. This supports calm during isolation or withdrawal patterns.`,
      `Keep your routine simple and consistent for 14 days. This reduces sudden drops in motivation.`,
      `Avoid impulsive exits from relationships or work during intense detachment moods. This prevents regret cycles.`
    ],
  };

  return byPlanet[p] || [
    `Pick one simple remedy and follow it consistently for 21 days. Consistency works better than mixing many remedies.`,
    `A short daily meditation (10 minutes) stabilizes the mind when life feels uneven.`,
    `A small weekly donation supports balance when pressure feels persistent.`
  ];
}

function isActionableRemedyTextForUI(text) {
  const t = String(text || '').trim();
  if (t.length < 10) return false;
  // Must start with a clear action (so UI can map to a concrete CTA)
  return /^(when you\s+|donate|feed|chant|offer|avoid|practice|do|light|spend|write|keep|support)\b/i.test(t);
}

/**
 * Deduplicate remedies by normalized text (case-insensitive, whitespace normalized)
 * FIXED: Remove micro-context and generic phrases before comparing to catch duplicates
 */
function deduplicateRemedies(remedies) {
  const seen = new Set();
  const unique = [];
  
  // Normalize description for comparison (remove micro-context and generic phrases)
  const normalizeDescription = (desc) => {
    if (!desc || typeof desc !== 'string') return '';
    return desc
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/planetary configuration creates specific influences that shape life experiences and events/gi, '')
      .replace(/planetary configuration creates specific influences/gi, '')
      .replace(/\.\s*especially helpful during.*$/i, '')
      .replace(/\.\s*useful when.*$/i, '')
      .replace(/\.\s*supports.*$/i, '')
      .replace(/\.\s*helpful when.*$/i, '')
      .replace(/\.\s*results may take time\.\s*planetary configuration/gi, '')
      .trim();
  };
  
  for (const remedy of remedies) {
    // Normalize: lowercase, trim, remove extra whitespace, remove micro-context
    const normalized = normalizeDescription(remedy.description);
    
    if (!seen.has(normalized) && normalized.length > 10) {
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

  // Hard reject: "assessment" / generic advisory sentences are not remedies
  if (/one may assess|assess the potential effectiveness|as with all astrological|this planetary configuration/i.test(text)) {
    return null;
  }
  
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
      let extracted = text.substring(index).trim();
      // Clean up: remove trailing "may help", "tends to", etc.
      extracted = extracted
        .replace(/planetary configuration creates specific influences that shape life experiences and events/gi, '')
        .replace(/planetary positions reflect karmic patterns/gi, '')
        .replace(/\bone may assess\b.*$/i, '')
        .replace(/\s+may\s+(help|support|balance).*$/i, '')
        .replace(/\s+tends?\s+to.*$/i, '')
        .replace(/\s+such\s+as.*$/i, '')
        .trim();

      // Fix extraction artifacts
      extracted = extracted.replace(/\bwear\s+ing\b/gi, 'wearing');
      extracted = extracted.replace(/\binstall\s+ing\b/gi, 'installing');

      // Reject mixed multi-type lines (we'll use curated fallback instead)
      if (/gemstones?\s+or\s+installing\s+yantras?|wearing\s+gemstones/i.test(extracted)) {
        return null;
      }

      // Cut at first sentence boundary to avoid mixed clauses
      extracted = extracted.split(/[.!?]/)[0].trim();
      
      // Capitalize first letter
      if (extracted.length > 10) {
        return extracted.charAt(0).toUpperCase() + extracted.slice(1);
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
    const MAX_REMEDIES = 5;
    
    for (const r of remediesRes.rows) {
      if (!r.description || r.description.trim().length < 10) continue;
      
      // MICRO-CONTEXT ENRICHMENT: Only enrich top 2 remedies
      // ASTROLOGICAL CONTEXT: Query rules to get actual astrological meaning
      const shouldEnrich = actionable.length < 2;
      const microContext = shouldEnrich ? await generateMicroContextForPlanet(planet.toUpperCase(), house) : null;
      
      let remedyDescription = '';
      if (isActionableRemedy(r.description)) {
        remedyDescription = formatRemedyForUX(r.description.trim());
      } else {
        // Try to extract actionable part from descriptive text
        const extracted = extractActionableFromDescriptive(r.description);
        if (extracted && extracted.length > 10) {
          remedyDescription = formatRemedyForUX(extracted);
        } else {
          continue; // Skip if not actionable
        }
      }
      
      // Add micro-context if available
      if (microContext && remedyDescription) {
        remedyDescription += ' ' + microContext;
      }

      // HARD GUARDRAIL: never emit empty or generic-mixed remedies
      if (!remedyDescription || String(remedyDescription).trim().length < 10) {
        continue;
      }
      
      actionable.push({
        number: actionable.length + 1,
        description: remedyDescription
      });
      
      // Stop at max remedies
      if (actionable.length >= MAX_REMEDIES) break;
    }
    
    let final = deduplicateRemedies(actionable).slice(0, MAX_REMEDIES);

    // If empty (generic/mixed DB text), use curated fallback
    if (final.length === 0) {
      const curated = getCuratedRemediesForPlanet(planet).slice(0, MAX_REMEDIES);
      final = curated.map((d, idx) => ({ number: idx + 1, description: formatRemedyForUX(d) }));
    }

    return final;
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
            
            // MICRO-CONTEXT ENRICHMENT: Only enrich top 2 remedies
            // ASTROLOGICAL CONTEXT: Query rules to get actual astrological meaning
            const shouldEnrich = actionable.length < 2;
            const microContext = shouldEnrich ? await generateMicroContextForPlanet(planetName, planetPos.house) : null;
            
            let remedyDescription = '';
            if (isActionableRemedy(r.description)) {
              remedyDescription = formatRemedyForUX(r.description.trim());
            } else {
              const extracted = extractActionableFromDescriptive(r.description);
              if (extracted && extracted.length > 10) {
                remedyDescription = formatRemedyForUX(extracted);
              } else {
                continue; // Skip if not actionable
              }
            }
            
            // Add micro-context if available
            if (microContext && remedyDescription) {
              remedyDescription += ' ' + microContext;
            }
            
            actionable.push({
              number: actionable.length + 1,
              description: remedyDescription
            });
            
            if (actionable.length >= 2) break;
          }
          
          remedies = deduplicateRemedies(actionable);
        } catch (err) {
          console.error(`[LalkitabPrediction] Error in broader remedy search:`, err);
        }
      }
    }
    
    // UX Polish: Max 4 meaningful remedies per planet (strongest first)
    const MAX_REMEDIES_PER_PLANET = 4;
    let finalRemedies = (Array.isArray(remedies) ? remedies : []).slice(0, MAX_REMEDIES_PER_PLANET);

    // Final cleanup: enforce formatting + ban generic/mixed content
    finalRemedies = finalRemedies
      .map((r) => ({
        ...r,
        description: formatRemedyForUX(r?.description || ''),
      }))
      .filter((r) => r && typeof r.description === 'string' && isActionableRemedyTextForUI(r.description));

    // If still empty (generic rule/DB content), use curated per-planet fallback
    if (finalRemedies.length === 0) {
      const curated = getCuratedRemediesForPlanet(planetName).slice(0, MAX_REMEDIES_PER_PLANET);
      finalRemedies = curated.map((d, idx) => ({
        number: idx + 1,
        description: formatRemedyForUX(d),
      }));
    }
    
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

