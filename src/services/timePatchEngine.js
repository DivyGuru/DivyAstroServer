/**
 * Time Patch Engine
 * 
 * Converts aggregated domain signals into meaningful time-based patches
 * that explain WHEN a life area needs attention or offers opportunity.
 * 
 * This layer:
 * - Populates time_windows field in domain signals
 * - Creates year-level patches from dasha data
 * - Creates month-level patches from transit data
 * - Conservative approach (empty time_windows is valid)
 * 
 * This layer DOES NOT:
 * - Generate narrative text
 * - Create exact dates
 * - Over-predict timing
 */

/**
 * Determines nature of year patch based on metrics and dasha
 */
function determineYearPatchNature(pressure, support, stability, dashaType) {
  // High pressure + low stability = restructuring
  if (pressure === 'high' && stability === 'low') {
    return 'restructuring';
  }
  
  // High support + high stability = consolidation
  if (support === 'high' && stability === 'high') {
    return 'consolidation';
  }
  
  // High support + medium stability = growth
  if (support === 'high' && stability === 'medium') {
    return 'growth';
  }
  
  // High pressure + medium stability = sensitive
  if (pressure === 'high' && stability === 'medium') {
    return 'sensitive';
  }
  
  // Medium pressure + low stability = transition
  if (pressure === 'medium' && stability === 'low') {
    return 'transition';
  }
  
  // Default: stabilization
  return 'stabilization';
}

/**
 * Determines nature of month patch based on metrics and transit
 */
function determineMonthPatchNature(pressure, support, stability) {
  // High pressure = decision_sensitive or caution_required
  if (pressure === 'high') {
    if (stability === 'low') {
      return 'caution_required';
    }
    return 'decision_sensitive';
  }
  
  // High support = supportive
  if (support === 'high') {
    return 'supportive';
  }
  
  // Low stability = volatile
  if (stability === 'low') {
    return 'volatile';
  }
  
  // Default: decision_sensitive
  return 'decision_sensitive';
}

/**
 * Creates year patches from dasha timeline
 * 
 * @param {Object} domainSignal - Domain signal with metrics
 * @param {Object} dashaTimeline - Dasha timeline data
 * @returns {Array} Array of year patches (0-3 max)
 */
function createYearPatches(domainSignal, dashaTimeline) {
  const patches = [];
  
  // Only create patches if dasha timeline exists
  if (!dashaTimeline || !dashaTimeline.periods || dashaTimeline.periods.length === 0) {
    return patches;
  }
  
  const { pressure, support, stability } = domainSignal.summary_metrics;
  
  // Filter to relevant periods (only if pressure/support is sustained)
  // Conservative: only create patches if metrics indicate significant activity
  const isSignificant = 
    pressure === 'high' || 
    support === 'high' || 
    (pressure === 'medium' && stability === 'low');
  
  if (!isSignificant) {
    return patches;
  }
  
  // Get up to 3 most relevant periods
  const relevantPeriods = dashaTimeline.periods
    .filter(p => p.from_year && p.to_year)
    .slice(0, 3);
  
  for (const period of relevantPeriods) {
    const nature = determineYearPatchNature(pressure, support, stability, period.dasha_type);
    
    patches.push({
      from: period.from_year,
      to: period.to_year,
      nature
    });
  }
  
  return patches;
}

/**
 * Creates month patches from transit windows
 * 
 * @param {Object} domainSignal - Domain signal with metrics
 * @param {Object} transitWindows - Transit window data
 * @returns {Array} Array of month patches (0-2 max)
 */
function createMonthPatches(domainSignal, transitWindows) {
  const patches = [];
  
  // Only create patches if transit windows exist
  if (!transitWindows || !transitWindows.periods || transitWindows.periods.length === 0) {
    return patches;
  }
  
  const { pressure, support, stability } = domainSignal.summary_metrics;
  
  // Only create patches if there's significant activity or sensitivity
  const isSignificant = 
    pressure === 'high' || 
    support === 'high' || 
    stability === 'low' ||
    domainSignal.rule_trace.pending_rules.length > 0; // Sensitivity from pending rules
  
  if (!isSignificant) {
    return patches;
  }
  
  // Get up to 2 most relevant periods
  const relevantPeriods = transitWindows.periods
    .filter(p => p.from_month && p.to_month)
    .slice(0, 2);
  
  for (const period of relevantPeriods) {
    const nature = determineMonthPatchNature(pressure, support, stability);
    
    patches.push({
      from: period.from_month, // Expected format: "YYYY-MM"
      to: period.to_month,
      nature
    });
  }
  
  return patches;
}

/**
 * Creates year patches from long-term metrics (when no dasha data)
 * 
 * Only creates patches if metrics indicate sustained long-term activity
 */
function createYearPatchesFromMetrics(domainSignal, currentYear) {
  const patches = [];
  
  const { pressure, support, stability, confidence } = domainSignal.summary_metrics;
  
  // Only create if high confidence and significant metrics
  if (confidence < 0.7) {
    return patches;
  }
  
  // High pressure or high support with high stability = long-term patch
  const isLongTerm = 
    (pressure === 'high' && stability === 'high') ||
    (support === 'high' && stability === 'high');
  
  if (!isLongTerm) {
    return patches;
  }
  
  // Create a 2-3 year patch
  const nature = determineYearPatchNature(pressure, support, stability);
  const duration = pressure === 'high' ? 3 : 2;
  
  patches.push({
    from: currentYear,
    to: currentYear + duration - 1,
    nature
  });
  
  return patches;
}

/**
 * Main function: Apply time patches to domain signals
 * 
 * @param {Array} domainSignals - Array of domain signals from signal aggregation
 * @param {Object} timingData - Timing data object
 * @param {Object} timingData.dashaTimeline - Dasha timeline with periods
 * @param {Object} timingData.transitWindows - Transit windows with periods
 * @param {Number} timingData.currentYear - Current year (for fallback patches)
 * @returns {Array} Domain signals with populated time_windows
 */
export function applyTimePatches(domainSignals, timingData = {}) {
  const { dashaTimeline, transitWindows, currentYear } = timingData;
  
  // Default current year if not provided
  const year = currentYear || new Date().getFullYear();
  
  return domainSignals.map(signal => {
    const yearPatches = [];
    const monthPatches = [];
    
    // Create year patches from dasha timeline (preferred)
    if (dashaTimeline && dashaTimeline.periods && dashaTimeline.periods.length > 0) {
      yearPatches.push(...createYearPatches(signal, dashaTimeline));
    } else {
      // Fallback: create from metrics if significant
      yearPatches.push(...createYearPatchesFromMetrics(signal, year));
    }
    
    // Create month patches from transit windows
    if (transitWindows && transitWindows.periods && transitWindows.periods.length > 0) {
      monthPatches.push(...createMonthPatches(signal, transitWindows));
    }
    
    // Return signal with populated time_windows
    return {
      ...signal,
      time_windows: {
        years: yearPatches,
        months: monthPatches
      }
    };
  });
}

/**
 * Extract dasha timeline from astro snapshot
 * 
 * Helper function to extract dasha periods from astro snapshot
 * Returns null if no dasha data available
 */
export function extractDashaTimeline(astroSnapshot) {
  if (!astroSnapshot) return null;
  
  const mahadasha = astroSnapshot.running_mahadasha_planet;
  const antardasha = astroSnapshot.running_antardasha_planet;
  
  if (mahadasha == null && antardasha == null) {
    return null;
  }
  
  // For now, return a simple structure
  // In production, this would calculate actual dasha periods from birth data
  // This is a placeholder that indicates dasha data exists
  return {
    periods: [
      // Placeholder: would be populated from actual dasha calculations
      // {
      //   from_year: 2025,
      //   to_year: 2027,
      //   dasha_type: 'mahadasha',
      //   planet: mahadasha
      // }
    ]
  };
}

/**
 * Extract transit windows from astro snapshot
 * 
 * Helper function to extract transit periods from transits_state
 * Returns null if no transit data available
 */
export function extractTransitWindows(astroSnapshot) {
  if (!astroSnapshot) return null;
  
  const transits = astroSnapshot.transits_state || astroSnapshot.transits || null;
  
  if (!transits || (Array.isArray(transits) && transits.length === 0)) {
    return null;
  }
  
  // For now, return a simple structure
  // In production, this would calculate actual transit periods
  // This is a placeholder that indicates transit data exists
  return {
    periods: [
      // Placeholder: would be populated from actual transit calculations
      // {
      //   from_month: "2026-03",
      //   to_month: "2026-07",
      //   planet: "SATURN",
      //   house: 10
      // }
    ]
  };
}

