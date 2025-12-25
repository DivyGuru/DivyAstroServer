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
 * Formats remedy description to be calm and supportive
 */
function formatRemedyDescription(description, type, frequency, duration) {
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
  const rejectPatterns = [
    /^this planetary configuration/,
    /^creates specific influences/,
    /^shapes life experiences/,
    /^tends to/,
    /^this placement affects/,
    /^configuration affects/,
    /^astrological/,
    /^planetary positions reflect/
  ];
  
  // If text STARTS with a reject pattern, it's definitely not a remedy
  for (const pattern of rejectPatterns) {
    if (pattern.test(t)) return false;
  }
  
  // Must contain action verbs (remedies must describe actions)
  // Check if text contains actionable verbs anywhere
  const hasAction = /(donate|feed|chant|recite|offer|serve|help|practice|avoid|give|visit|pray|meditate|fast|wear|install|place|keep|maintain|observe|adhere|attend)/i.test(t);
  
  // If it has action verbs AND doesn't start with reject patterns, it's likely actionable
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

    const formatted = result.rows
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
          _actionable: isLikelyActionable(description),
        };
      });

    // ONLY return actionable remedies (no fallback to non-actionable)
    const actionableOnly = formatted
      .filter(r => r._actionable)
      .map(({ _actionable, ...r }) => r);
    
    // Deduplicate by description (normalized)
    const seen = new Set();
    const unique = [];
    for (const remedy of actionableOnly) {
      const key = `${remedy.type}|${(remedy.description || '').trim().toLowerCase()}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(remedy);
        if (unique.length >= Math.max(1, Number(limit) || 2)) break;
      }
    }

    return unique;
  } catch (err) {
    return [];
  }
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
    
    // Format remedies for response with validation
    const remedies = result.rows
      .filter(row => {
        // Validate row structure
        return row && 
               row.type && 
               typeof row.type === 'string' &&
               row.name && 
               typeof row.name === 'string';
      })
      .map((row) => {
        const type = String(row.type || '');
        const title = formatRemedyTitle(row.name, type);
        const description = formatRemedyDescription(
          row.description || '',
          type,
          row.recommended_frequency || null,
          null // Don't convert duration to minutes, keep as days
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
      .slice(0, 3); // Enforce max 3 remedies (deterministic limit)
    
    return remedies;
  } catch (error) {
    // Graceful degradation: return empty array on error
    console.error(`Error resolving remedies for domain ${domain}:`, error.message);
    return [];
  }
}

