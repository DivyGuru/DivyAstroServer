/**
 * Kundli Generation Service
 * 
 * Orchestrates the complete pipeline:
 * 1. Signal Aggregation Layer
 * 2. Time Patch Engine
 * 3. Narrative Composer
 * 4. Remedy Hook Generator
 * 5. Remedy Resolver
 * 
 * Returns kundli-ready JSON format for frontend consumption.
 * 
 * API CONTRACT (FROZEN):
 * {
 *   meta: {
 *     window_id: string (MANDATORY),
 *     generated_at: string ISO timestamp (MANDATORY),
 *     overall_confidence: number 0.0-1.0 (MANDATORY)
 *   },
 *   sections: Array<{
 *     domain: string (MANDATORY),
 *     summary_metrics: {
 *       pressure: "low"|"medium"|"high" (MANDATORY),
 *       support: "low"|"medium"|"high" (MANDATORY),
 *       stability: "low"|"medium"|"high" (MANDATORY),
 *       confidence: number 0.0-1.0 (MANDATORY)
 *     },
 *     time_windows: {
 *       years: Array<{from: number, to: number, nature: string}> (MANDATORY, can be empty),
 *       months: Array<{from: string, to: string, nature: string}> (MANDATORY, can be empty)
 *     },
 *     narrative: string (MANDATORY, non-empty),
 *     remedy_hook?: {message: string, cta: string} (OPTIONAL, only if confidence >= 0.6),
 *     remedies?: Array<{type, title, description, frequency?, duration?}> (OPTIONAL, only if remedy_hook exists)
 *   }>
 * }
 * 
 * SAFETY GUARANTEES:
 * - Always returns valid JSON
 * - Empty arrays for time_windows are valid
 * - remedy_hook and remedies are optional (null-safe)
 * - Same input → same output (deterministic)
 * - Graceful degradation on errors
 */

import { query } from '../../config/db.js';
import { aggregateSignals } from './signalAggregation.js';
import { applyTimePatches, extractDashaTimeline, extractTransitWindows } from './timePatchEngine.js';
import { composeNarrative } from './narrativeComposer.js';
import { generateRemedyHook } from './remedyHookGenerator.js';
import { resolveRemedies } from './remedyResolver.js';

/**
 * Generates complete kundli for a prediction window
 * 
 * @param {number} windowId - Prediction window ID
 * @returns {Promise<Object>} Kundli-ready JSON response
 */
export async function generateKundli(windowId) {
  // Input validation
  if (!windowId || Number.isNaN(Number(windowId))) {
    throw new Error('WINDOW_ID missing or invalid');
  }

  const windowIdNum = Number(windowId);

  // Load astro snapshot with error handling
  let astroSnapshot;
  try {
    const astroRes = await query(
      'SELECT * FROM astro_state_snapshots WHERE window_id = $1',
      [windowIdNum]
    );
    
    if (astroRes.rowCount === 0) {
      throw new Error(`astro_state_snapshot not found for window_id=${windowId}`);
    }
    
    astroSnapshot = astroRes.rows[0];
  } catch (error) {
    // Re-throw with context
    throw new Error(`Failed to load astro snapshot: ${error.message}`);
  }

  // Step 1: Signal Aggregation Layer (with error handling)
  let domainSignals;
  try {
    domainSignals = await aggregateSignals(astroSnapshot);
  } catch (error) {
    throw new Error(`Signal aggregation failed: ${error.message}`);
  }
  
  // Safety: Ensure domainSignals is an array
  if (!Array.isArray(domainSignals)) {
    domainSignals = [];
  }

  // Step 2: Extract timing data (safe defaults)
  // Get window scope and dates for time patch context
  let windowScope = 'daily';
  let currentYear;
  let windowStartAt = null;
  
  try {
    const windowRes = await query(
      'SELECT scope, start_at FROM prediction_windows WHERE id = $1',
      [windowIdNum]
    );
    
    if (windowRes.rowCount > 0) {
      windowScope = windowRes.rows[0].scope || 'daily';
      windowStartAt = windowRes.rows[0].start_at;
      currentYear = windowStartAt
        ? new Date(windowStartAt).getFullYear()
        : new Date().getFullYear();
    } else {
      currentYear = new Date().getFullYear();
    }
  } catch (error) {
    // Fallback to current year on error
    currentYear = new Date().getFullYear();
  }
  
  // Safety: Ensure currentYear is valid
  if (Number.isNaN(currentYear) || currentYear < 1900 || currentYear > 2100) {
    currentYear = new Date().getFullYear();
  }
  
  // Extract timing data (dasha timeline and transit windows)
  // For daily windows, these may be empty (which is valid)
  // For monthly/yearly windows, these should be populated if dasha/transit data exists
  const dashaTimeline = extractDashaTimeline(astroSnapshot) || null;
  const transitWindows = extractTransitWindows(astroSnapshot) || null;

  // Step 3: Time Patch Engine (with error handling)
  let signalsWithPatches;
  try {
    signalsWithPatches = applyTimePatches(domainSignals, {
      dashaTimeline,
      transitWindows,
      currentYear
    });
  } catch (error) {
    // Fallback: use original signals without patches
    console.warn('Time patch engine failed, using original signals:', error.message);
    signalsWithPatches = domainSignals.map(s => ({
      ...s,
      time_windows: { years: [], months: [] }
    }));
  }
  
  // Safety: Ensure signalsWithPatches is an array
  if (!Array.isArray(signalsWithPatches)) {
    signalsWithPatches = [];
  }

  // Step 4: Narrative Composer (with error handling)
  let narrativeBlocks;
  try {
    narrativeBlocks = composeNarrative(signalsWithPatches);
  } catch (error) {
    throw new Error(`Narrative composition failed: ${error.message}`);
  }
  
  // Safety: Ensure narrativeBlocks is an array
  if (!Array.isArray(narrativeBlocks)) {
    narrativeBlocks = [];
  }

  // Step 5: Compute overall confidence (safe calculation)
  const overallConfidence = computeOverallConfidence(signalsWithPatches);
  
  // 5-LAYER COMPATIBILITY: Generate system status diagnostics (internal only, not exposed to API)
  const systemDiagnostics = generateSystemDiagnostics(signalsWithPatches);
  
  // Log diagnostics for developer visibility (not in API response)
  if (process.env.NODE_ENV === 'development' || process.env.DEBUG_LAYERS === 'true') {
    console.log('\n📊 5-LAYER SYSTEM DIAGNOSTICS:');
    console.log('  Active layers:', Object.entries(systemDiagnostics.layers_active)
      .filter(([_, status]) => status === 'active')
      .map(([layer, _]) => layer)
      .join(', ') || 'BASE only');
    console.log('  Inactive layers:', systemDiagnostics.layers_inactive.join(', ') || 'none');
    console.log('  Layer counts:', systemDiagnostics.layer_counts);
    if (systemDiagnostics.rules_skipped.length > 0) {
      console.log('  Skipped rules (PENDING_OPERATOR):', systemDiagnostics.rules_skipped.length);
    }
    if (systemDiagnostics.engine_limitations.length > 0) {
      console.log('  Engine limitations:', systemDiagnostics.engine_limitations.join(', '));
    }
    console.log('');
  }

  // Step 6: Build final response (normalize to ensure consistent format)
  // Process sections with error handling for each
  const sections = await Promise.all(
    narrativeBlocks.map(async (block) => {
      try {
        // Normalize and validate block data
        const domain = String(block.domain || 'unknown');
        const metrics = block.summary_metrics || {};
        
        // Validate and normalize metrics
        const pressure = ['low', 'medium', 'high'].includes(metrics.pressure) 
          ? metrics.pressure 
          : 'medium';
        const support = ['low', 'medium', 'high'].includes(metrics.support) 
          ? metrics.support 
          : 'medium';
        const stability = ['low', 'medium', 'high'].includes(metrics.stability) 
          ? metrics.stability 
          : 'medium';
        const confidence = typeof metrics.confidence === 'number' 
          ? Math.max(0, Math.min(1, metrics.confidence)) // Clamp 0-1
          : 0.0;
        
        // Normalize time_windows (ensure arrays, validate structure)
        const years = Array.isArray(block.time_windows?.years) 
          ? block.time_windows.years.filter(y => 
              typeof y.from === 'number' && 
              typeof y.to === 'number' && 
              typeof y.nature === 'string'
            )
          : [];
        const months = Array.isArray(block.time_windows?.months) 
          ? block.time_windows.months.filter(m => 
              typeof m.from === 'string' && 
              typeof m.to === 'string' && 
              typeof m.nature === 'string'
            )
          : [];
        
        // Ensure narrative is non-empty string
        const narrative = typeof block.text === 'string' && block.text.trim().length > 0
          ? block.text.trim()
          : '';
        
        // Skip sections with empty narrative (should not happen, but safety check)
        if (!narrative) {
          return null;
        }
        
        const section = {
          domain,
          summary_metrics: {
            pressure,
            support,
            stability,
            confidence: Math.round(confidence * 100) / 100 // Round to 2 decimals
          },
          time_windows: {
            years,
            months
          },
          narrative
        };
        
        // Step 7: Generate remedy hook (optional, soft, non-pushy)
        // Only if confidence >= 0.6 (threshold enforced in generateRemedyHook)
        let remedyHook = null;
        try {
          remedyHook = generateRemedyHook(section);
        } catch (error) {
          // Non-critical: log and continue without hook
          console.warn(`Remedy hook generation failed for ${domain}:`, error.message);
        }
        
        if (remedyHook) {
          section.remedy_hook = remedyHook;
          
          // Step 8: Resolve actual remedies (only if hook exists)
          // Graceful degradation: if remedy resolution fails, continue without remedies
          try {
            const remedies = await resolveRemedies(section);
            if (Array.isArray(remedies) && remedies.length > 0) {
              // Validate and normalize remedy structure
              const validRemedies = remedies
                .filter(r => r && typeof r.type === 'string' && typeof r.title === 'string')
                .map(r => ({
                  type: r.type,
                  title: String(r.title || ''),
                  description: String(r.description || ''),
                  frequency: r.frequency || null,
                  duration: r.duration || null
                }))
                .slice(0, 3); // Enforce max 3 remedies
              
              if (validRemedies.length > 0) {
                section.remedies = validRemedies;
              }
            }
          } catch (error) {
            // Non-critical: log and continue without remedies
            console.warn(`Remedy resolution failed for ${domain}:`, error.message);
          }
        }
        
        return section;
      } catch (error) {
        // Critical error in section processing: log and skip this section
        console.error(`Failed to process section for domain ${block.domain}:`, error);
        return null;
      }
    })
  );
  
  // Filter out null sections (from errors or empty narratives)
  const validSections = sections.filter(s => s !== null);
  
  // Build final response with guaranteed structure
  const response = {
    meta: {
      window_id: String(windowIdNum),
      generated_at: new Date().toISOString(),
      overall_confidence: Math.round(overallConfidence * 100) / 100 // Round to 2 decimals
    },
    sections: validSections
  };
  
  // Final safety check: ensure response is JSON-serializable
  try {
    JSON.stringify(response);
  } catch (error) {
    throw new Error(`Response is not JSON-serializable: ${error.message}`);
  }
  
  return response;
}

/**
 * Generates system diagnostics for 5-layer compatibility
 * 
 * 5-LAYER COMPATIBILITY: Internal diagnostics (not exposed to API)
 * - Which layers are active for this window
 * - Which layers had zero rules
 * - Which rules were skipped due to engine limitations
 * 
 * This is developer visibility only, not user-facing.
 */
function generateSystemDiagnostics(signals) {
  if (!Array.isArray(signals) || signals.length === 0) {
    return {
      layers_active: {},
      layers_inactive: [],
      rules_skipped: [],
      engine_limitations: []
    };
  }
  
  // Aggregate layer status across all domains
  const layerCounts = {
    BASE: 0,
    NAKSHATRA: 0,
    DASHA: 0,
    TRANSIT: 0,
    STRENGTH: 0,
    YOGA: 0
  };
  
  const layerStatus = {
    BASE: 'inactive',
    NAKSHATRA: 'inactive',
    DASHA: 'inactive',
    TRANSIT: 'inactive',
    STRENGTH: 'inactive',
    YOGA: 'inactive'
  };
  
  const skippedRules = [];
  const engineLimitations = [];
  
  for (const signal of signals) {
    // Check layer counts from _layer_counts (internal diagnostics)
    if (signal._layer_counts) {
      for (const [layer, count] of Object.entries(signal._layer_counts)) {
        if (layerCounts.hasOwnProperty(layer)) {
          layerCounts[layer] += count;
          if (count > 0) {
            layerStatus[layer] = 'active';
          }
        }
      }
    }
    
    // Check layer status from _layer_status
    if (signal._layer_status) {
      for (const [layer, status] of Object.entries(signal._layer_status)) {
        if (layerStatus.hasOwnProperty(layer) && status === 'active') {
          layerStatus[layer] = 'active';
        }
      }
    }
    
    // Track pending rules (engine limitations)
    if (signal.rule_trace?.pending_rules?.length > 0) {
      skippedRules.push(...signal.rule_trace.pending_rules);
    }
    
    // Track time patch reasons (engine limitations)
    if (signal._time_patch_reasons) {
      engineLimitations.push(...signal._time_patch_reasons);
    }
  }
  
  // Determine inactive layers
  const inactiveLayers = Object.entries(layerStatus)
    .filter(([_, status]) => status === 'inactive')
    .map(([layer, _]) => layer);
  
  return {
    layers_active: layerStatus,
    layers_inactive: inactiveLayers,
    layer_counts: layerCounts,
    rules_skipped: [...new Set(skippedRules)], // Unique rule IDs
    engine_limitations: [...new Set(engineLimitations)], // Unique reason codes
    total_domains: signals.length
  };
}

function computeOverallConfidence(signals) {
  if (!signals || !Array.isArray(signals) || signals.length === 0) {
    return 0.0;
  }
  
  const confidences = signals
    .map(s => {
      const conf = s?.summary_metrics?.confidence;
      return typeof conf === 'number' ? Math.max(0, Math.min(1, conf)) : null;
    })
    .filter(c => c !== null && c > 0);
  
  if (confidences.length === 0) {
    return 0.0;
  }
  
  // Average confidence across all domains
  const sum = confidences.reduce((a, b) => a + b, 0);
  const avg = sum / confidences.length;
  
  // Round to 2 decimal places and clamp to 0-1
  return Math.max(0.0, Math.min(1.0, Math.round(avg * 100) / 100));
}

