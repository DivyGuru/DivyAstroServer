/**
 * Signal Aggregation Layer
 * 
 * Combines applicable rules for a user into domain-wise structured signals.
 * 
 * This layer:
 * - Queries rules from database
 * - Evaluates condition_tree against astro snapshot
 * - Aggregates effects per life domain
 * - Computes summary metrics (pressure, support, stability, confidence)
 * - Tracks rule trace (which rules were applied)
 * 
 * This layer DOES NOT:
 * - Generate narrative text
 * - Use LLM language generation
 * - Create exact dates
 * - Over-weight a single rule
 */

import { query } from '../../config/db.js';
import { normalizeAstroState, evalNode } from '../engine/ruleEvaluator.js';
import { THEMES } from '../config/problemTaxonomy.js';

/**
 * Maps effect_json theme to problem taxonomy theme
 */
function mapThemeToDomain(theme) {
  const themeMap = {
    'money': THEMES.MONEY_FINANCE,
    'career': THEMES.CAREER_DIRECTION,
    'relationship': THEMES.RELATIONSHIPS,
    'health': THEMES.HEALTH_BODY,
    'spirituality': THEMES.SPIRITUAL_GROWTH,
    'general': null, // General rules apply to all domains
    'family': THEMES.FAMILY_HOME,
    'mental': THEMES.MENTAL_STATE,
  };
  
  return themeMap[theme] || null;
}

/**
 * Computes pressure level from intensity and trend
 */
function computePressure(intensity, trend) {
  if (intensity == null) return 'medium';
  
  const numIntensity = typeof intensity === 'number' ? intensity : 0.5;
  
  if (trend === 'down' || trend === 'negative') {
    if (numIntensity >= 0.7) return 'high';
    if (numIntensity >= 0.4) return 'medium';
    return 'low';
  }
  
  if (trend === 'up' || trend === 'positive') {
    return 'low'; // Positive trends = low pressure
  }
  
  // Mixed or neutral
  if (numIntensity >= 0.7) return 'high';
  if (numIntensity >= 0.4) return 'medium';
  return 'low';
}

/**
 * Computes support level from intensity and trend
 */
function computeSupport(intensity, trend) {
  if (intensity == null) return 'medium';
  
  const numIntensity = typeof intensity === 'number' ? intensity : 0.5;
  
  if (trend === 'up' || trend === 'positive') {
    if (numIntensity >= 0.7) return 'high';
    if (numIntensity >= 0.4) return 'medium';
    return 'low';
  }
  
  if (trend === 'down' || trend === 'negative') {
    return 'low'; // Negative trends = low support
  }
  
  // Mixed or neutral
  if (numIntensity >= 0.7) return 'high';
  if (numIntensity >= 0.4) return 'medium';
  return 'low';
}

/**
 * Computes stability from effect_json
 */
function computeStability(effectJson) {
  // Check for stability indicators in effect_json
  if (effectJson.stability) {
    const s = effectJson.stability.toLowerCase();
    if (s === 'high' || s === 'stable') return 'high';
    if (s === 'low' || s === 'unstable') return 'low';
    return 'medium';
  }
  
  // Infer from trend
  const trend = effectJson.trend;
  if (trend === 'stable' || trend === 'neutral') return 'high';
  if (trend === 'volatile' || trend === 'mixed') return 'low';
  
  return 'medium';
}

/**
 * Aggregates signals for a single domain
 * 
 * 5-LAYER COMPATIBILITY:
 * - BASE rules form the core signal
 * - NAKSHATRA rules fine-tune themes & confidence
 * - DASHA rules mark long-term sensitivity
 * - TRANSIT rules mark short-term sensitivity
 * - STRENGTH/YOGA rules modify intensity & stability
 * - PENDING_OPERATOR rules tracked but not computed
 * - Empty layers are handled gracefully (layer_status = inactive)
 */
function aggregateDomainSignals(domain, applicableRules, astroNormalized) {
  // 5-LAYER COMPATIBILITY: Track all rule types
  const baseRules = [];
  const nakshatraRules = [];
  const dashaRules = [];
  const transitRules = [];
  const strengthRules = [];
  const yogaRules = [];
  const pendingRules = [];
  
  const ruleIds = {
    base: [],
    nakshatra: [],
    dasha: [],
    transit: [],
    strength: [],
    yoga: [],
    pending: []
  };
  
  // Track layer status (for diagnostics)
  const layerStatus = {
    BASE: 'inactive',
    NAKSHATRA: 'inactive',
    DASHA: 'inactive',
    TRANSIT: 'inactive',
    STRENGTH: 'inactive',
    YOGA: 'inactive'
  };
  
  // First pass: Collect all matching rules by layer
  for (const rule of applicableRules) {
    // Evaluate condition_tree
    let matches = false;
    try {
      matches = evalNode(rule.condition_tree, astroNormalized);
    } catch (err) {
      // If evaluation fails, skip this rule (graceful degradation)
      continue;
    }
    
    if (!matches) continue;
    
    const effectJson = rule.effect_json || {};
    const ruleTheme = effectJson.theme || 'general';
    const mappedDomain = mapThemeToDomain(ruleTheme);
    
    // Check if rule applies to this domain
    if (mappedDomain && mappedDomain !== domain) continue;
    if (!mappedDomain && ruleTheme !== 'general') continue;
    
    // 5-LAYER COMPATIBILITY: Handle PENDING_OPERATOR rules
    // These are tracked as "potential influence" but not computed
    if (rule.engine_status === 'PENDING_OPERATOR') {
      pendingRules.push(rule);
      ruleIds.pending.push(rule.rule_id || rule.id);
      continue;
    }
    
    // 5-LAYER COMPATIBILITY: Route rules to appropriate layer
    const ruleType = rule.rule_type || 'BASE';
    
    if (ruleType === 'BASE') {
      baseRules.push(rule);
      ruleIds.base.push(rule.rule_id || rule.id);
      layerStatus.BASE = 'active';
    } else if (ruleType === 'NAKSHATRA' && rule.engine_status === 'READY') {
      nakshatraRules.push(rule);
      ruleIds.nakshatra.push(rule.rule_id || rule.id);
      layerStatus.NAKSHATRA = 'active';
    } else if (ruleType === 'DASHA' && rule.engine_status === 'READY') {
      dashaRules.push(rule);
      ruleIds.dasha.push(rule.rule_id || rule.id);
      layerStatus.DASHA = 'active';
    } else if (ruleType === 'TRANSIT' && rule.engine_status === 'READY') {
      transitRules.push(rule);
      ruleIds.transit.push(rule.rule_id || rule.id);
      layerStatus.TRANSIT = 'active';
    } else if (ruleType === 'STRENGTH' && rule.engine_status === 'READY') {
      strengthRules.push(rule);
      ruleIds.strength.push(rule.rule_id || rule.id);
      layerStatus.STRENGTH = 'active';
    } else if (ruleType === 'YOGA' && rule.engine_status === 'READY') {
      yogaRules.push(rule);
      ruleIds.yoga.push(rule.rule_id || rule.id);
      layerStatus.YOGA = 'active';
    }
  }
  
  // 5-LAYER COMPATIBILITY: BASE rules always form the core signal
  // Other layers modify signals if present, else are skipped gracefully
  
  // Second pass: Apply modifiers and compute metrics
  let totalIntensity = 0;
  let totalWeight = 0;
  const trends = [];
  const themes = new Set();
  
  // Process BASE rules (core signal)
  for (const baseRule of baseRules) {
    const effectJson = baseRule.effect_json || {};
    let intensity = effectJson.intensity || 0.5;
    const weight = baseRule.base_weight || 1.0;
    
    // 5-LAYER COMPATIBILITY: Apply NAKSHATRA refinements (fine-tune themes & confidence)
    // Nakshatra rules refine HOW base effects manifest, not WHAT they are
    for (const nakshatraRule of nakshatraRules) {
      let baseRuleIds = [];
      if (nakshatraRule.base_rule_ids) {
        if (Array.isArray(nakshatraRule.base_rule_ids)) {
          baseRuleIds = nakshatraRule.base_rule_ids;
        } else if (typeof nakshatraRule.base_rule_ids === 'string') {
          try {
            baseRuleIds = JSON.parse(nakshatraRule.base_rule_ids);
          } catch (e) {
            baseRuleIds = [];
          }
        }
      }
      const ruleId = baseRule.rule_id || String(baseRule.id);
      
      if (baseRuleIds.includes(ruleId)) {
        // Nakshatra refines intensity slightly (subtle refinement)
        const refinement = nakshatraRule.effect_json?.intensity_refinement || 1.0;
        intensity = intensity * refinement;
        // Add nakshatra-specific themes
        const nakshatraTheme = nakshatraRule.effect_json?.theme;
        if (nakshatraTheme) themes.add(nakshatraTheme);
      }
    }
    
    // 5-LAYER COMPATIBILITY: Apply STRENGTH modifiers (intensity modifiers)
    for (const strengthRule of strengthRules) {
      let baseRuleIds = [];
      if (strengthRule.base_rule_ids) {
        if (Array.isArray(strengthRule.base_rule_ids)) {
          baseRuleIds = strengthRule.base_rule_ids;
        } else if (typeof strengthRule.base_rule_ids === 'string') {
          try {
            baseRuleIds = JSON.parse(strengthRule.base_rule_ids);
          } catch (e) {
            baseRuleIds = [];
          }
        }
      }
      const ruleId = baseRule.rule_id || String(baseRule.id);
      
      if (baseRuleIds.includes(ruleId)) {
        const multiplier = strengthRule.effect_json?.intensity_multiplier || 1.0;
        intensity = intensity * multiplier;
      }
    }
    
    // 5-LAYER COMPATIBILITY: Apply YOGA modifiers (combination effects)
    for (const yogaRule of yogaRules) {
      let baseRuleIds = [];
      if (yogaRule.base_rule_ids) {
        if (Array.isArray(yogaRule.base_rule_ids)) {
          baseRuleIds = yogaRule.base_rule_ids;
        } else if (typeof yogaRule.base_rule_ids === 'string') {
          try {
            baseRuleIds = JSON.parse(yogaRule.base_rule_ids);
          } catch (e) {
            baseRuleIds = [];
          }
        }
      }
      const ruleId = baseRule.rule_id || String(baseRule.id);
      
      if (baseRuleIds.includes(ruleId)) {
        const multiplier = yogaRule.effect_json?.intensity_multiplier || 1.0;
        intensity = intensity * multiplier;
      }
    }
    
    totalIntensity += intensity * weight;
    totalWeight += weight;
    
    if (effectJson.trend) trends.push(effectJson.trend);
    const ruleTheme = effectJson.theme || 'general';
    if (ruleTheme) themes.add(ruleTheme);
  }
  
  // 5-LAYER COMPATIBILITY: DASHA and TRANSIT rules mark sensitivity but don't modify BASE intensity
  // They are handled by Time Patch Engine for time_windows
  // Here we just track them for diagnostics
  
  // Compute average intensity
  const avgIntensity = totalWeight > 0 ? totalIntensity / totalWeight : 0.5;
  
  // Determine dominant trend
  const trendCounts = {};
  for (const t of trends) {
    trendCounts[t] = (trendCounts[t] || 0) + 1;
  }
  const dominantTrend = Object.keys(trendCounts).reduce((a, b) => 
    trendCounts[a] > trendCounts[b] ? a : b, 'mixed'
  );
  
  // Compute metrics
  const pressure = computePressure(avgIntensity, dominantTrend);
  const support = computeSupport(avgIntensity, dominantTrend);
  
  // Compute stability from base rules
  let stability = 'medium';
  if (baseRules.length > 0) {
    const stabilityValues = baseRules.map(r => computeStability(r.effect_json || {}));
    const highCount = stabilityValues.filter(s => s === 'high').length;
    const lowCount = stabilityValues.filter(s => s === 'low').length;
    if (highCount > lowCount) stability = 'high';
    else if (lowCount > highCount) stability = 'low';
  }
  
  // 5-LAYER COMPATIBILITY: Compute confidence with layer awareness
  // BASE rules form core confidence
  // NAKSHATRA rules can slightly increase confidence (refinement)
  const ruleCount = baseRules.length;
  let confidence = 0.0;
  if (ruleCount === 0) confidence = 0.0;
  else if (ruleCount === 1) confidence = 0.3;
  else if (ruleCount <= 3) confidence = 0.5;
  else if (ruleCount <= 5) confidence = 0.7;
  else confidence = 0.9;
  
  // Nakshatra refinement slightly increases confidence (fine-tuning)
  if (nakshatraRules.length > 0 && confidence > 0) {
    confidence = Math.min(0.95, confidence + 0.05);
  }
  
  // Extract themes/keywords
  const themeKeywords = Array.from(themes);
  
  // 5-LAYER COMPATIBILITY: Return layer status for diagnostics
  return {
    domain,
    summary_metrics: {
      pressure,
      support,
      stability,
      confidence: Math.round(confidence * 100) / 100
    },
    themes: themeKeywords,
    time_windows: {
      years: [], // Populated by Time Patch Engine from DASHA rules
      months: []  // Populated by Time Patch Engine from TRANSIT rules
    },
    rule_trace: {
      base_rules_applied: ruleIds.base,
      nakshatra_rules_applied: ruleIds.nakshatra,
      dasha_rules_applied: ruleIds.dasha,
      transit_rules_applied: ruleIds.transit,
      strength_rules_applied: ruleIds.strength,
      yoga_rules_applied: ruleIds.yoga,
      pending_rules: ruleIds.pending
    },
    // 5-LAYER COMPATIBILITY: Internal diagnostics (not exposed to API)
    _layer_status: layerStatus,
    _layer_counts: {
      BASE: baseRules.length,
      NAKSHATRA: nakshatraRules.length,
      DASHA: dashaRules.length,
      TRANSIT: transitRules.length,
      STRENGTH: strengthRules.length,
      YOGA: yogaRules.length
    }
  };
}

/**
 * Main aggregation function
 * 
 * @param {Object} astroSnapshot - Astro state snapshot (from astro_state_snapshots table)
 * @returns {Array} Array of domain signals
 */
export async function aggregateSignals(astroSnapshot) {
  // Normalize astro snapshot
  const astroNormalized = normalizeAstroState(astroSnapshot);
  
  // Fetch all READY rules from database
  const rulesResult = await query(`
    SELECT 
      id,
      rule_id,
      rule_type,
      condition_tree,
      effect_json,
      base_rule_ids,
      engine_status,
      base_weight,
      planet,
      strength_state,
      yoga_name,
      planets
    FROM rules
    WHERE is_active = TRUE
      AND (engine_status = 'READY' OR engine_status = 'PENDING_OPERATOR')
    ORDER BY rule_type, id
  `);
  
  const allRules = rulesResult.rows;
  
  // Also fetch PENDING_OPERATOR rules for transparency
  const pendingResult = await query(`
    SELECT r.id, r.rule_id, r.rule_type
    FROM rules r
    WHERE r.is_active = TRUE
      AND r.engine_status = 'PENDING_OPERATOR'
  `);
  
  // Get all domains from problem taxonomy
  const domains = Object.values(THEMES);
  
  // Aggregate signals for each domain
  const domainSignals = [];
  
  for (const domain of domains) {
    const signal = aggregateDomainSignals(domain, allRules, astroNormalized);
    domainSignals.push(signal);
  }
  
  return domainSignals;
}

