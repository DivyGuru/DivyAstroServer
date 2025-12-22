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

/**
 * Resolves remedies for a domain section
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
 * @param {Object} section - Domain section with domain, summary_metrics, time_windows
 * @returns {Promise<Array>} Array of resolved remedies (max 3, can be empty)
 */
export async function resolveRemedies(section) {
  // Input validation
  if (!section || typeof section !== 'object') {
    return [];
  }
  
  const { domain, summary_metrics, time_windows } = section;
  
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
  
  // Determine intensity based on metrics (currently not used in query, but kept for future use)
  // let intensityFilter = '';
  // if (pressure === 'high' || support === 'high') {
  //   // High intensity - prefer more impactful remedies
  //   intensityFilter = '';
  // } else {
  //   // Medium/low intensity - prefer gentler remedies
  //   intensityFilter = '';
  // }
  
  // Build query to find matching remedies
  // Match by target_themes (array overlap) and prefer meditation, mantra, donation, feeding_beings
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
      CASE type
        WHEN 'meditation' THEN 1
        WHEN 'mantra' THEN 2
        WHEN 'donation' THEN 3
        WHEN 'feeding_beings' THEN 4
        WHEN 'puja' THEN 5
        WHEN 'fast' THEN 6
        ELSE 7
      END,
      id ASC
    LIMIT 3
  `;
  
  try {
    // Pass themes as array for array overlap operator
    const result = await query(remediesQuery, [themes]);
    
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

