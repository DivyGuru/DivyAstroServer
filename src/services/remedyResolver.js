/**
 * Remedy Resolution Layer
 * 
 * Resolves actual remedies from Remedies_DB based on domain, metrics, and timing.
 * 
 * Principles:
 * - Remedies are guidance, not guarantees
 * - Calm, supportive, respectful tone
 * - Optional, not forced
 * - Follows Rules_DB constraints (no food/dress restrictions, no caste, no violence)
 */

import { query } from '../../config/db.js';
import { THEMES } from '../config/problemTaxonomy.js';

// Planet name to ID mapping (0=SUN, 1=MOON, 2=MARS, 3=MERCURY, 4=JUPITER, 5=VENUS, 6=SATURN, 7=RAHU, 8=KETU)
const PLANET_NAME_TO_ID = {
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
 * Maps domain to prediction themes for remedy matching
 * Note: Database enum uses simple names: 'money', 'career', 'relationship', 'health', 'spirituality', 'general', 'travel', 'education', 'family'
 * We need to map our domain names to these enum values
 */
const DOMAIN_TO_DB_THEMES = {
  money_finance: ['money'], // Database enum: 'money'
  career_direction: ['career'], // Database enum: 'career'
  relationships: ['relationship'], // Database enum: 'relationship'
  family_home: ['family'], // Database enum: 'family'
  health_body: ['health'], // Database enum: 'health'
  mental_state: ['general'], // Database enum: 'general' (closest match)
  spiritual_growth: ['spirituality'], // Database enum: 'spirituality'
  timing_luck: ['general'], // Database enum: 'general' (closest match)
  events_changes: ['general'], // Database enum: 'general' (closest match)
  self_identity: ['general'] // Database enum: 'general' (closest match)
};

/**
 * Preferred remedy types (in order of preference)
 * Note: Database enum uses 'mantra' not 'jap'
 */
const PREFERRED_REMEDY_TYPES = ['meditation', 'mantra', 'donation', 'feeding_beings', 'puja', 'fast'];

/**
 * Maps remedy type to user-friendly title format
 */
function formatRemedyTitle(name, type) {
  // If name already looks good, use it
  if (name && name.length > 0 && !name.match(/^\[/)) {
    return name;
  }
  
  // Otherwise format from type
  const typeMap = {
    'meditation': 'Meditation Practice',
    'mantra': 'Mantra Practice',
    'jap': 'Mantra Practice', // Alias for backward compatibility
    'donation': 'Donation Practice',
    'feeding_beings': 'Feeding Practice',
    'puja': 'Puja Practice',
    'fast': 'Fasting Practice'
  };
  
  return typeMap[type] || 'Supportive Practice';
}

/**
 * Query matching rules for astrological context
 * ASTROLOGICAL CONTEXT: Extract rule meaning from actual rules in DB
 */
async function queryMatchingRulesForContext({ planetId = null, planetName = null, house = null, theme = null, limit = 2 } = {}) {
  if (!planetId && !planetName && !house && !theme) {
    return [];
  }

  try {
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    // Query rules that match planet/house/theme
    // Use JSONB operators to check condition_tree
    if (planetName) {
      const planetUpper = String(planetName).toUpperCase();
      // Check if planet_in array contains this planet
      conditions.push(`(condition_tree->'planet_in_house'->'planet_in' @> $${paramIndex}::jsonb)`);
      params.push(JSON.stringify([planetUpper]));
      paramIndex++;
    }

    if (house !== null) {
      const houseNum = Number(house);
      if (Number.isFinite(houseNum)) {
        // Check if house_in array contains this house
        conditions.push(`(condition_tree->'planet_in_house'->'house_in' @> $${paramIndex}::jsonb)`);
        params.push(JSON.stringify([houseNum]));
        paramIndex++;
      }
    }

    // Build query
    let queryText = `
      SELECT 
        id,
        rule_id,
        canonical_meaning,
        effect_json,
        source_book,
        condition_tree
      FROM rules
      WHERE is_active = TRUE
        AND engine_status = 'READY'
        AND (canonical_meaning IS NOT NULL OR effect_json IS NOT NULL)
        AND condition_tree IS NOT NULL
        AND condition_tree->'planet_in_house' IS NOT NULL
    `;

    if (conditions.length > 0) {
      queryText += ` AND (${conditions.join(' OR ')})`;
    }

    queryText += `
      ORDER BY 
        CASE WHEN source_book = 'lalkitab' THEN 1 ELSE 2 END,
        id ASC
      LIMIT $${paramIndex}
    `;
    params.push(limit);

    const result = await query(queryText, params);
    
    if (!result || !result.rows || result.rowCount === 0) {
      return [];
    }

    return result.rows.map(row => ({
      id: row.id,
      rule_id: row.rule_id,
      canonical_meaning: row.canonical_meaning,
      effect_json: row.effect_json,
      source_book: row.source_book
    }));
  } catch (error) {
    console.error('[RemedyResolver] Error querying matching rules:', error.message);
    return [];
  }
}

/**
 * Extract astrological context from rule meaning
 * ASTROLOGICAL CONTEXT: Creates context from actual rule canonical_meaning
 */
function extractAstrologicalContextFromRule(rule) {
  if (!rule) return null;

  // Priority: canonical_meaning > effect_json.narrative > effect_json.description
  let ruleText = rule.canonical_meaning;
  
  if (!ruleText && rule.effect_json) {
    ruleText = rule.effect_json.narrative || rule.effect_json.description || null;
  }

  if (!ruleText || typeof ruleText !== 'string' || ruleText.trim().length < 20) {
    return null;
  }

  // Extract key sentence (first meaningful sentence, max 150 chars)
  const sentences = ruleText.split(/[.!?]+/).filter(s => s.trim().length > 20);
  
  if (sentences.length === 0) {
    return null;
  }

  // Take first meaningful sentence, clean it up
  let context = sentences[0].trim();
  
  // Remove generic phrases
  context = context.replace(/^(This|These|When|If|The way this influence manifests).*?/i, '');
  context = context.replace(/As with all astrological influences.*$/i, '');
  context = context.replace(/individual circumstances.*$/i, '');
  context = context.trim();

  // Limit length
  if (context.length > 150) {
    context = context.substring(0, 147) + '...';
  }

  // Only return if meaningful (not too generic)
  if (context.length < 30 || 
      context.toLowerCase().includes('depends on the overall chart') ||
      context.toLowerCase().includes('individual circumstances')) {
    return null;
  }

  return context;
}

/**
 * Generate astrological context from rules
 * ASTROLOGICAL CONTEXT: Uses actual rules from both books to create meaningful context
 */
async function generateAstrologicalContextFromRules({ planetId = null, planetName = null, house = null, theme = null, domain = null } = {}) {
  // Query matching rules from both books
  const matchingRules = await queryMatchingRulesForContext({
    planetId,
    planetName,
    house,
    theme,
    limit: 3 // Get 3 rules, use best one
  });

  if (matchingRules.length === 0) {
    return null;
  }

  // Try to extract context from rules (prefer lalkitab, then BParasharHoraShastra)
  const sortedRules = matchingRules.sort((a, b) => {
    if (a.source_book === 'lalkitab' && b.source_book !== 'lalkitab') return -1;
    if (a.source_book !== 'lalkitab' && b.source_book === 'lalkitab') return 1;
    return 0;
  });

  for (const rule of sortedRules) {
    const context = extractAstrologicalContextFromRule(rule);
    if (context) {
      return context;
    }
  }

  return null;
}

/**
 * Generate micro-context line for remedy enrichment
 * MICRO-CONTEXT ENRICHMENT: Adds 1 contextual line based on Mahadasha, theme, pressure
 * Goal: Transform generic remedies (YELLOW) to personalized (GREEN) without DB changes
 * 
 * UPDATED: Now tries astrological context from rules first, then falls back to generic
 */
async function generateMicroContext({ mahadasha = null, theme = null, pressure = null, domain = null, planetId = null, planetName = null, house = null } = {}) {
  // PRIORITY 1: Try astrological context from actual rules (both books)
  const astroContext = await generateAstrologicalContextFromRules({
    planetId,
    planetName,
    house,
    theme,
    domain
  });

  if (astroContext) {
    return astroContext;
  }

  // PRIORITY 2: Fallback to Mahadasha-based context (generic but still useful)
  if (mahadasha) {
    const planet = String(mahadasha).toUpperCase();
    const mahadashaContext = {
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
    
    if (mahadashaContext[planet]) {
      return mahadashaContext[planet];
    }
  }
  
  // PRIORITY 3: Theme-based context (generic)
  if (!mahadasha && theme) {
    const themeContext = {
      'money': 'Helps maintain discipline around resources and financial stability.',
      'career': 'Supports steady progress when work feels challenging or recognition is delayed.',
      'relationship': 'Useful when relationships feel strained or communication is difficult.',
      'health': 'Supports physical and mental well-being during stressful periods.',
      'family': 'Helpful when family responsibilities feel heavy or home life is unsettled.',
      'spirituality': 'Supports inner peace and spiritual growth during transformative phases.'
    };
    
    if (themeContext[theme]) {
      return themeContext[theme];
    }
  }
  
  // PRIORITY 4: Pressure-based context (generic)
  if (!mahadasha && !theme && pressure) {
    if (pressure === 'high' || pressure === 'medium') {
      return 'This is especially helpful during phases where effort feels heavy and progress is slow.';
    }
  }
  
  return null;
}

/**
 * Formats remedy description to be calm and supportive
 * MICRO-CONTEXT ENRICHMENT: Optionally adds contextual line for top remedies
 */
function formatRemedyDescription(description, type, frequency, duration, microContext = null) {
  let formatted = description || '';
  
  // Ensure description doesn't contain fear-based language
  const fearPatterns = [
    /must\s+(do|perform|complete)/gi,
    /required/gi,
    /mandatory/gi,
    /failure/gi,
    /will\s+(die|suffer|fail)/gi
  ];
  
  for (const pattern of fearPatterns) {
    formatted = formatted.replace(pattern, (match) => {
      // Replace with softer language
      if (match.toLowerCase().includes('must')) return 'can help';
      if (match.toLowerCase().includes('required')) return 'supportive';
      if (match.toLowerCase().includes('mandatory')) return 'beneficial';
      return match;
    });
  }
  
  // MICRO-CONTEXT ENRICHMENT: Add contextual line for top remedies
  if (microContext && typeof microContext === 'string' && microContext.trim().length > 0) {
    formatted += ' ' + microContext.trim();
  }
  
  // Add frequency/duration info if available
  const details = [];
  if (frequency) {
    details.push(frequency);
  }
  if (duration) {
    details.push(`${duration} minutes`);
  }
  
  if (details.length > 0) {
    formatted += ` Recommended: ${details.join(', ')}.`;
  }
  
  return formatted;
}

async function queryRemediesByThemes({
  themes,
  preferLongTerm = false,
  preferShortTerm = false,
  preferDisciplined = false,
  limit = 3,
}) {
  if (!Array.isArray(themes) || themes.length === 0) return [];

  const remediesQuery = `
    SELECT 
      id,
      name,
      type,
      description,
      min_duration_days,
      recommended_frequency,
      safety_notes
    FROM remedies
    WHERE is_active = TRUE
      AND target_themes && $1::prediction_theme[]
      AND type IN ('meditation', 'mantra', 'donation', 'feeding_beings', 'puja', 'fast')
    ORDER BY
      CASE 
        WHEN $2::boolean = true AND type IN ('meditation', 'puja') THEN 1
        WHEN $3::boolean = true AND type IN ('mantra', 'donation') THEN 2
        WHEN $4::boolean = true AND type IN ('meditation', 'fast') THEN 3
        WHEN type = 'meditation' THEN 4
        WHEN type = 'mantra' THEN 5
        WHEN type = 'donation' THEN 6
        WHEN type = 'feeding_beings' THEN 7
        WHEN type = 'puja' THEN 8
        WHEN type = 'fast' THEN 9
        ELSE 10
      END,
      id ASC
    LIMIT ${Number.isFinite(Number(limit)) ? Number(limit) : 3}
  `;

  const result = await query(remediesQuery, [
    themes,
    preferLongTerm,
    preferShortTerm,
    preferDisciplined,
  ]);

  if (!result || !result.rows || result.rowCount === 0) return [];

  return result.rows
    .filter(row => row && typeof row.type === 'string' && typeof row.name === 'string')
    .map((row) => {
      const type = String(row.type || '');
      const title = formatRemedyTitle(row.name, type);
      const description = formatRemedyDescription(
        row.description || '',
        type,
        row.recommended_frequency || null,
        null
      );

      return {
        type,
        title: String(title || ''),
        description: String(description || ''),
        frequency: row.recommended_frequency || null,
        duration: row.min_duration_days || null,
        safety_notes: row.safety_notes || null,
      };
    });
}

/**
 * Resolve remedies directly by DB prediction themes (no rule_trace required).
 * Useful for “mode-based” guidance like current Mahadasha, when we still want DB-backed remedies.
 *
 * @param {Object} params
 * @param {Array<string>} params.themes - DB enum themes like 'career', 'money', 'relationship', ...
 * @param {boolean} params.preferLongTerm
 * @param {boolean} params.preferShortTerm
 * @param {boolean} params.preferDisciplined
 * @param {number} params.limit
 * @returns {Promise<Array>} remedies (can be empty)
 */
export async function resolveRemediesForThemes({
  themes,
  preferLongTerm = true,
  preferShortTerm = false,
  preferDisciplined = false,
  limit = 2,
} = {}) {
  try {
    const rows = await queryRemediesByThemes({
      themes,
      preferLongTerm,
      preferShortTerm,
      preferDisciplined,
      limit,
    });

    // Hide safety_notes from response (internal only), keep formatting stable
    return rows
      .map(r => ({
        type: r.type,
        title: r.title,
        description: r.description,
        frequency: r.frequency,
        duration: r.duration,
      }))
      .slice(0, Math.max(1, Number(limit) || 2));
  } catch (err) {
    // Graceful degradation
    return [];
  }
}

function isLikelyActionable(text) {
  if (!text || typeof text !== 'string') return false;
  const t = text.toLowerCase();
  
  // Reject generic/descriptive phrases that are clearly NOT remedies
  // These are rule-like descriptions, not actionable remedies
  // FIXED: Check anywhere in text, not just at start
  const rejectPatterns = [
    /planetary configuration creates specific influences/,
    /creates specific influences that shape/,
    /shapes life experiences and events/,
    /planetary configuration/,
    /planetary positions reflect/,
    /this placement affects/,
    /configuration affects/,
    /tends to concentrate around/,
    /^this astrological/,
    /^astrological configuration/,
    /remedial practices such as donation, chanting, wearing gemstones, or installing yantras may help balance planetary influences/i,
    /^remedial practices such as/i,
    /may help balance planetary influences$/i,
    /may help restore balance\. results may take time\. planetary configuration/i
  ];
  
  // If text contains ANY reject pattern, it's definitely not a remedy
  for (const pattern of rejectPatterns) {
    if (pattern.test(t)) return false;
  }
  
  // Reject if description is too generic (lists multiple remedy types without specifics)
  // Generic multi-type descriptions like "donation, chanting, wearing gemstones, or installing yantras"
  const isGenericMultiType = /(donation|chanting|wearing gemstones|installing yantras).*(donation|chanting|wearing gemstones|installing yantras)/i.test(t);
  if (isGenericMultiType && t.length < 200) {
    // If it mentions multiple types in a short description, it's likely generic
    return false;
  }
  
  // Must contain action verbs (remedies must describe actions)
  // Check if text contains actionable verbs anywhere
  const hasAction = /(donate|feed|chant|recite|offer|serve|help|practice|avoid|give|visit|pray|meditate|fast|wear|install|place|keep|maintain|observe|adhere|attend)/i.test(t);
  
  // If it has action verbs AND doesn't contain reject patterns, it's likely actionable
  return hasAction;
}

/**
 * Resolve remedies by target_planets (planet IDs stored in remedies.target_planets).
 * This is required for strict ingestions where target_themes may be null.
 *
 * @param {Object} params
 * @param {Array<number>} params.planetIds - 0..8 planet IDs (SUN..KETU)
 * @param {boolean} params.preferLongTerm
 * @param {boolean} params.preferShortTerm
 * @param {boolean} params.preferDisciplined
 * @param {number} params.limit
 * @returns {Promise<Array>} remedies (can be empty)
 */
export async function resolveRemediesForPlanets({
  planetIds,
  planetName = null,
  preferLongTerm = true,
  preferShortTerm = false,
  preferDisciplined = false,
  limit = 2,
} = {}) {
  if (!Array.isArray(planetIds) || planetIds.length === 0) return [];

  const ids = planetIds
    .map(n => Number(n))
    .filter(n => Number.isFinite(n));
  if (ids.length === 0) return [];

  const planetText = planetName && typeof planetName === 'string' && planetName.trim()
    ? `%${planetName.trim()}%`
    : null;

  // Use same pattern as Lal Kitab (which works correctly)
  // For Mahadasha, we typically have one planet, so use first planet ID
  const primaryPlanetId = ids[0];
  
  // Build query with correct parameter numbering
  const hasPlanetText = planetText && planetText.trim().length > 0;
  
  const remediesQuery = `
    SELECT 
      id,
      name,
      type,
      description,
      min_duration_days,
      recommended_frequency,
      safety_notes
    FROM remedies
    WHERE is_active = TRUE
      AND (
        -- Primary: planet-targeted remedies (same pattern as Lal Kitab)
        $1 = ANY(target_planets)
        ${hasPlanetText ? `-- Fallback: text mentions the planet
        OR (name ILIKE $5 OR description ILIKE $5)` : ''}
      )
      AND type IN ('meditation', 'mantra', 'donation', 'feeding_beings', 'puja', 'fast')
    ORDER BY
      CASE 
        -- Prefer planet-targeted
        WHEN $1 = ANY(target_planets) THEN 0
        -- Then prefer by type based on preferences
        WHEN $2::boolean = true AND type IN ('meditation', 'puja') THEN 1
        WHEN $3::boolean = true AND type IN ('mantra', 'donation') THEN 2
        WHEN $4::boolean = true AND type IN ('meditation', 'fast') THEN 3
        WHEN type = 'meditation' THEN 4
        WHEN type = 'mantra' THEN 5
        WHEN type = 'donation' THEN 6
        WHEN type = 'feeding_beings' THEN 7
        WHEN type = 'puja' THEN 8
        WHEN type = 'fast' THEN 9
        ELSE 10
      END,
      id ASC
    LIMIT 20
  `;

  try {
    const queryParams = [primaryPlanetId, preferLongTerm, preferShortTerm, preferDisciplined];
    if (hasPlanetText) queryParams.push(planetText);
    
    let result = await query(remediesQuery, queryParams);

    // If no results with type filter, try broader search (like Lal Kitab does)
    if (!result || !result.rows || result.rowCount === 0) {
      const broaderQuery = `
        SELECT 
          id,
          name,
          type,
          description,
          min_duration_days,
          recommended_frequency,
          safety_notes
        FROM remedies
        WHERE is_active = TRUE
          AND (
            $1 = ANY(target_planets)
            ${hasPlanetText ? `OR (name ILIKE $2 OR description ILIKE $2)` : ''}
          )
        ORDER BY
          CASE 
            WHEN $1 = ANY(target_planets) THEN 0
            ELSE 1
          END,
          id ASC
        LIMIT 20
      `;
      
      const broaderParams = [primaryPlanetId];
      if (hasPlanetText) broaderParams.push(planetText);
      result = await query(broaderQuery, broaderParams);
    }

    if (!result || !result.rows || result.rowCount === 0) return [];

    // ASTROLOGICAL CONTEXT: Extract planet/house from rule_trace if available
    // For planet-based remedies, we can query matching rules
    const planetId = planetName ? PLANET_NAME_TO_ID[String(planetName).toUpperCase()] : primaryPlanetId;
    
    const formatted = await Promise.all(
      result.rows
        .filter(row => row && typeof row.type === 'string' && typeof row.name === 'string')
        .map(async (row, index) => {
          const type = String(row.type || '');
          const title = formatRemedyTitle(row.name, type);
          
          // MICRO-CONTEXT ENRICHMENT: Only enrich top 2 remedies (index 0, 1)
          // ASTROLOGICAL CONTEXT: Query rules to get actual astrological meaning
          const shouldEnrich = index < 2;
          const microContext = shouldEnrich ? await generateMicroContext({
            mahadasha: planetName,
            theme: null, // Planet-based, no theme context
            pressure: null,
            domain: null,
            planetId: planetId,
            planetName: planetName,
            house: null // House not available in planet-based lookup
          }) : null;
          
          const description = formatRemedyDescription(
            row.description || '',
            type,
            row.recommended_frequency || null,
            null,
            microContext // Add micro-context for top 2 remedies
          );
          return {
            type,
            title: String(title || ''),
            description: String(description || ''),
            frequency: row.recommended_frequency || null,
            duration: row.min_duration_days || null,
            _actionable: isLikelyActionable(description),
          };
        })
    );

    // ONLY return actionable remedies (no fallback to non-actionable)
    const actionableOnly = formatted
      .filter(r => r._actionable)
      .map(({ _actionable, ...r }) => r);
    
    // Deduplicate by description (normalized)
    // FIXED: Remove micro-context and generic phrases before comparing to catch duplicates
    const normalizeDescription = (desc) => {
      if (!desc || typeof desc !== 'string') return '';
      // Remove micro-context (usually added at the end)
      // Remove generic phrases
      return desc
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .replace(/planetary configuration creates specific influences that shape life experiences and events/gi, '')
        .replace(/\.\s*especially helpful during.*$/i, '')
        .replace(/\.\s*useful when.*$/i, '')
        .replace(/\.\s*supports.*$/i, '')
        .replace(/\.\s*helpful when.*$/i, '')
        .trim();
    };
    
    const seen = new Set();
    const unique = [];
    for (const remedy of actionableOnly) {
      // Normalize description for comparison (remove micro-context and generic phrases)
      const normalizedDesc = normalizeDescription(remedy.description);
      const key = `${remedy.type}|${normalizedDesc}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(remedy);
        if (unique.length >= Math.max(1, Number(limit) || 2)) break;
      }
    }

    // If DB remedies are insufficient (or too generic), fill with curated planet remedies
    if (unique.length < Math.max(1, Number(limit) || 2)) {
      const curated = getCuratedPlanetRemedies(planetName);
      const normalizeDescription = (desc) =>
        String(desc || '')
          .toLowerCase()
          .replace(/\s+/g, ' ')
          .replace(/planetary configuration creates specific influences that shape life experiences and events/gi, '')
          .replace(/\.\s*especially helpful during.*$/i, '')
          .replace(/\.\s*useful when.*$/i, '')
          .replace(/\.\s*supports.*$/i, '')
          .replace(/\.\s*helpful when.*$/i, '')
          .trim();

      for (const c of curated) {
        if (unique.length >= Math.max(1, Number(limit) || 2)) break;
        const key = `${c.type}|${normalizeDescription(c.description)}`;
        const already = unique.some((u) => `${u.type}|${normalizeDescription(u.description)}` === key);
        if (!already) {
          unique.push(c);
        }
      }
    }

    return unique.slice(0, Math.max(1, Number(limit) || 2));
  } catch (err) {
    return [];
  }
}

/**
 * Curated fallback remedies when DB/book content is missing or too generic.
 * English-only.
 */
function getCuratedPlanetRemedies(planetName) {
  const p = String(planetName || '').toUpperCase();
  const map = {
    SATURN: [
      {
        type: 'donation',
        title: 'Donate black sesame or mustard oil (Saturday)',
        description: 'Donate black sesame or a small amount of mustard oil on Saturday. This supports steadiness during long, effort-heavy phases.',
        frequency: 'Once a week (Saturday)',
        duration: null,
      },
      {
        type: 'feeding_beings',
        title: 'Feed crows (Saturday)',
        description: 'Feed crows with cooked rice on Saturday morning. This helps soften isolation and mental heaviness patterns.',
        frequency: 'Once a week (Saturday)',
        duration: null,
      },
      {
        type: 'mantra',
        title: 'Shani mantra (108x)',
        description: 'Chant "Om Sham Shanicharaya Namah" 108 times daily for 40 days. This builds patience and reduces repeated friction.',
        frequency: 'Daily',
        duration: '40 days',
      },
      {
        type: 'puja',
        title: 'Sesame-oil lamp (Saturday evening)',
        description: 'Light a sesame-oil lamp on Saturday evening. This supports stability and can improve sleep-restlessness tendencies.',
        frequency: 'Once a week (Saturday)',
        duration: null,
      },
      {
        type: 'meditation',
        title: 'Breath-counting meditation (10 minutes)',
        description: 'Do 10 minutes of slow breath-counting meditation before sleep. This calms the mind when pressure feels constant.',
        frequency: 'Daily',
        duration: '10 minutes',
      },
    ],
  };
  return map[p] || [];
}

/**
 * Resolves remedies for a domain section
 * 
 * 5-LAYER COMPATIBILITY:
 * - Can associate remedies with BASE issues (core signal)
 * - Can associate with STRENGTH/YOGA intensity (modifiers)
 * - Can associate with DASHA periods (long-term sensitivity)
 * - Can associate with TRANSIT sensitivity (short-term sensitivity)
 * - Can associate with NAKSHATRA tendencies (future)
 * - If layer data missing, gracefully falls back to BASE only
 * - Never forces remedies
 * 
 * SAFETY & EDGE CASES:
 * - Returns empty array if confidence < 0.6
 * - Returns empty array if domain not found
 * - Returns empty array if no themes match
 * - Returns empty array on database errors (graceful degradation)
 * - Limits to max 3 remedies
 * - Validates remedy structure before returning
 * 
 * DETERMINISTIC:
 * - Same input → same output
 * - Remedy ordering is stable (by type priority, then id)
 * 
 * @param {Object} section - Domain section with domain, summary_metrics, time_windows, rule_trace
 * @returns {Promise<Array>} Array of resolved remedies (max 3, can be empty)
 */
export async function resolveRemedies(section) {
  // Input validation
  if (!section || typeof section !== 'object') {
    return [];
  }
  
  const { domain, summary_metrics, time_windows, rule_trace } = section;
  
  // 5-LAYER COMPATIBILITY: Check active layers for remedy association
  const hasBaseRules = rule_trace?.base_rules_applied?.length > 0;
  const hasStrengthYoga = (rule_trace?.strength_rules_applied?.length > 0 || 
                           rule_trace?.yoga_rules_applied?.length > 0);
  const hasDasha = rule_trace?.dasha_rules_applied?.length > 0;
  const hasTransit = rule_trace?.transit_rules_applied?.length > 0;
  const hasNakshatra = rule_trace?.nakshatra_rules_applied?.length > 0;
  
  // 5-LAYER COMPATIBILITY: If no BASE rules, gracefully fall back (no remedies)
  // BASE rules form the foundation - remedies are associated with BASE issues
  if (!hasBaseRules) {
    return []; // No BASE rules = no remedies (graceful fallback)
  }
  
  // Validate domain
  if (!domain || typeof domain !== 'string') {
    return [];
  }
  
  // Validate and extract confidence
  const confidence = summary_metrics?.confidence;
  if (typeof confidence !== 'number' || confidence < 0.6) {
    return [];
  }
  
  // Get database enum themes for this domain
  const themes = DOMAIN_TO_DB_THEMES[domain] || [];
  if (!Array.isArray(themes) || themes.length === 0) {
    return [];
  }
  
  // Extract metrics from summary_metrics
  const pressure = summary_metrics?.pressure;
  const support = summary_metrics?.support;
  const stability = summary_metrics?.stability;
  
  // 5-LAYER COMPATIBILITY: Adjust remedy selection based on active layers
  // STRENGTH/YOGA intensity → may prefer more disciplined remedies
  // DASHA periods → may prefer longer-term remedies
  // TRANSIT sensitivity → may prefer shorter-term remedies
  // NAKSHATRA tendencies → future enhancement (not used yet)
  
  // Determine remedy intensity preference based on layers
  let preferLongTerm = hasDasha; // DASHA → prefer longer-term remedies
  let preferShortTerm = hasTransit; // TRANSIT → prefer shorter-term remedies
  let preferDisciplined = hasStrengthYoga; // STRENGTH/YOGA → prefer disciplined practice
  
  // 5-LAYER COMPATIBILITY: Build query with layer-aware preferences
  // Match by target_themes (array overlap) and prefer remedies based on active layers
  // Use ANY to check if any theme in target_themes matches our themes
  const remediesQuery = `
    SELECT 
      id,
      name,
      type,
      description,
      min_duration_days,
      recommended_frequency,
      safety_notes
    FROM remedies
    WHERE is_active = TRUE
      AND target_themes && $1::prediction_theme[]
      AND type IN ('meditation', 'mantra', 'donation', 'feeding_beings', 'puja', 'fast')
    ORDER BY
      -- 5-LAYER COMPATIBILITY: Prefer remedies based on active layers
      CASE 
        -- DASHA (long-term) → prefer meditation, puja (sustained practices)
        WHEN $2::boolean = true AND type IN ('meditation', 'puja') THEN 1
        -- TRANSIT (short-term) → prefer mantra, donation (quick practices)
        WHEN $3::boolean = true AND type IN ('mantra', 'donation') THEN 2
        -- STRENGTH/YOGA (disciplined) → prefer meditation, fast (disciplined practices)
        WHEN $4::boolean = true AND type IN ('meditation', 'fast') THEN 3
        -- Default priority by type
        WHEN type = 'meditation' THEN 4
        WHEN type = 'mantra' THEN 5
        WHEN type = 'donation' THEN 6
        WHEN type = 'feeding_beings' THEN 7
        WHEN type = 'puja' THEN 8
        WHEN type = 'fast' THEN 9
        ELSE 10
      END,
      id ASC
    LIMIT 3
  `;
  
  try {
    // 5-LAYER COMPATIBILITY: Pass layer preferences to query
    // Pass themes as array + layer flags for preference ordering
    const result = await query(remediesQuery, [
      themes, // $1: themes array
      preferLongTerm, // $2: hasDasha (prefer long-term remedies)
      preferShortTerm, // $3: hasTransit (prefer short-term remedies)
      preferDisciplined // $4: hasStrengthYoga (prefer disciplined remedies)
    ]);
    
    if (!result || !result.rows || result.rowCount === 0) {
      return [];
    }
    
    // Extract context for micro-enrichment
    // Try to get Mahadasha from section's _mahadasha_context (added by kundliGeneration)
    const mahadasha = section._mahadasha_context?.current_mahadasha || null;
    const dominantTheme = themes && themes.length > 0 ? themes[0] : null;
    const pressure = summary_metrics?.pressure || null;
    const domainTheme = DOMAIN_TO_DB_THEMES[domain]?.[0] || null;
    
    // ASTROLOGICAL CONTEXT: Extract planet/house from rule_trace
    // Try to get planet/house from base rules that were applied
    let planetId = null;
    let planetName = null;
    let house = null;
    
    if (rule_trace?.base_rules_applied && rule_trace.base_rules_applied.length > 0) {
      // Query first base rule to get planet/house info
      try {
        const firstRuleId = rule_trace.base_rules_applied[0];
        const ruleRes = await query(
          `SELECT condition_tree FROM rules WHERE rule_id = $1 AND is_active = TRUE LIMIT 1`,
          [firstRuleId]
        );
        
        if (ruleRes.rows.length > 0) {
          const conditionTree = ruleRes.rows[0].condition_tree;
          if (conditionTree?.planet_in_house) {
            const planets = conditionTree.planet_in_house.planet_in || [];
            const houses = conditionTree.planet_in_house.house_in || [];
            
            if (planets.length > 0) {
              planetName = planets[0];
              planetId = PLANET_NAME_TO_ID[String(planetName).toUpperCase()] ?? null;
            }
            if (houses.length > 0) {
              house = houses[0];
            }
          }
        }
      } catch (err) {
        // Graceful degradation - continue without planet/house
        console.warn('[RemedyResolver] Could not extract planet/house from rule_trace:', err.message);
      }
    }
    
    // Format remedies for response with validation
    const remedies = await Promise.all(
      result.rows
        .filter(row => {
          // Validate row structure
          return row && 
                 row.type && 
                 typeof row.type === 'string' &&
                 row.name && 
                 typeof row.name === 'string';
        })
        .map(async (row, index) => {
          const type = String(row.type || '');
          const title = formatRemedyTitle(row.name, type);
          
          // MICRO-CONTEXT ENRICHMENT: Only enrich top 2 remedies (index 0, 1)
          // ASTROLOGICAL CONTEXT: Query rules to get actual astrological meaning
          const shouldEnrich = index < 2;
          const microContext = shouldEnrich ? await generateMicroContext({
            mahadasha: mahadasha,
            theme: dominantTheme || domainTheme,
            pressure: pressure,
            domain: domain,
            planetId: planetId,
            planetName: planetName,
            house: house
          }) : null;
          
          const description = formatRemedyDescription(
            row.description || '',
            type,
            row.recommended_frequency || null,
            null, // Don't convert duration to minutes, keep as days
            microContext // Add micro-context for top 2 remedies
          );
          
          // Build remedy object with validated fields
          const remedy = {
            type: type,
            title: String(title || ''),
            description: String(description || ''),
            frequency: row.recommended_frequency || null,
            duration: row.min_duration_days && typeof row.min_duration_days === 'number'
              ? `${row.min_duration_days} days`
              : null
          };
          
          // Ensure frequency is string or null
          if (remedy.frequency && typeof remedy.frequency !== 'string') {
            remedy.frequency = String(remedy.frequency);
          }
          
          return remedy;
        })
    );
    
    // Enforce max 3 remedies (deterministic limit)
    const limitedRemedies = remedies.slice(0, 3);
    
    return limitedRemedies;
  } catch (error) {
    // Graceful degradation: return empty array on error
    console.error(`Error resolving remedies for domain ${domain}:`, error.message);
    return [];
  }
}

