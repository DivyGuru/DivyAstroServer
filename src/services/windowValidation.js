/**
 * Window Validation
 * 
 * Validation functions to ensure time patches work correctly
 * for different window scopes.
 */

import { query } from '../../config/db.js';

/**
 * Validates that a window has the correct scope for time patches
 * 
 * @param {number} windowId - Window ID
 * @param {string} expectedScope - Expected scope ('daily', 'monthly', 'yearly')
 * @returns {Promise<Object>} { valid: boolean, scope: string, message?: string }
 */
export async function validateWindowScope(windowId, expectedScope) {
  try {
    const windowRes = await query(
      'SELECT scope FROM prediction_windows WHERE id = $1',
      [windowId]
    );
    
    if (windowRes.rowCount === 0) {
      return {
        valid: false,
        scope: null,
        message: `Window not found: ${windowId}`
      };
    }
    
    const actualScope = windowRes.rows[0].scope;
    
    if (actualScope !== expectedScope) {
      return {
        valid: false,
        scope: actualScope,
        message: `Window scope mismatch. Expected: ${expectedScope}, Found: ${actualScope}`
      };
    }
    
    return {
      valid: true,
      scope: actualScope
    };
  } catch (error) {
    return {
      valid: false,
      scope: null,
      message: `Validation error: ${error.message}`
    };
  }
}

/**
 * Validates that time patches are appropriate for window scope
 * 
 * @param {Object} kundliResponse - Kundli response with sections
 * @param {string} windowScope - Window scope ('daily', 'monthly', 'yearly')
 * @returns {Object} { valid: boolean, warnings: string[] }
 */
export function validateTimePatchesForScope(kundliResponse, windowScope) {
  const warnings = [];
  
  if (!kundliResponse || !kundliResponse.sections) {
    return {
      valid: false,
      warnings: ['Invalid kundli response structure']
    };
  }
  
  // For daily windows, empty time_windows is expected and valid
  if (windowScope === 'daily') {
    // This is valid - daily windows may have empty time_windows
    return {
      valid: true,
      warnings: []
    };
  }
  
  // For monthly/yearly windows, check if time patches exist
  const sectionsWithTimePatches = kundliResponse.sections.filter(section => {
    const hasYearPatches = section.time_windows?.years?.length > 0;
    const hasMonthPatches = section.time_windows?.months?.length > 0;
    return hasYearPatches || hasMonthPatches;
  });
  
  if (windowScope === 'monthly') {
    // Monthly windows should ideally have month patches
    if (sectionsWithTimePatches.length === 0) {
      warnings.push('Monthly window has no time patches. This may be expected if dasha/transit data is not available.');
    }
  }
  
  if (windowScope === 'yearly') {
    // Yearly windows should ideally have year patches
    if (sectionsWithTimePatches.length === 0) {
      warnings.push('Yearly window has no time patches. This may be expected if dasha data is not available.');
    }
  }
  
  return {
    valid: true,
    warnings
  };
}

