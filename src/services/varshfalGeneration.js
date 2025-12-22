/**
 * Varshfal Generation Service
 * 
 * Generates Varshfal-style (Annual Predictions) data for yearly windows.
 * Similar to sample PDF structure: Muntha + Year Timeline with Dasha Periods.
 * 
 * API CONTRACT:
 * {
 *   meta: {
 *     window_id: string,
 *     generated_at: string ISO timestamp,
 *     year: number
 *   },
 *   details: {
 *     birth_date: string,
 *     year_date: string,
 *     lagna: { sign, signName },
 *     moon: { sign, signName, nakshatra },
 *     // ... other details if available
 *   },
 *   muntha: {
 *     house: number,
 *     narrative: string
 *   } | null,
 *   timeline_periods: [
 *     {
 *       from: string (ISO date),
 *       to: string (ISO date),
 *       dasha_planet: string,
 *       bhav: number,
 *       narrative: string
 *     }
 *   ]
 * }
 */

import { query } from '../../config/db.js';
import { generateKundli } from './kundliGeneration.js';
import { composeNarrative } from './narrativeComposer.js';

/**
 * Format a JS Date into YYYY-MM-DD in a given IANA timezone.
 * Uses Intl (no external deps).
 */
function formatISODateInTZ(date, timezone = 'Asia/Kolkata') {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const y = parts.find(p => p.type === 'year')?.value;
  const m = parts.find(p => p.type === 'month')?.value;
  const d = parts.find(p => p.type === 'day')?.value;
  if (!y || !m || !d) return null;
  return `${y}-${m}-${d}`;
}

function normalizeToISODate(value, timezone = 'Asia/Kolkata') {
  if (!value) return null;
  if (typeof value === 'string') {
    const s = value.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s; // already ISO date
    const dt = new Date(s);
    if (!Number.isNaN(dt.getTime())) return formatISODateInTZ(dt, timezone);
    return null;
  }
  if (value instanceof Date) return formatISODateInTZ(value, timezone);
  // numeric timestamp
  if (typeof value === 'number') {
    const dt = new Date(value);
    if (!Number.isNaN(dt.getTime())) return formatISODateInTZ(dt, timezone);
  }
  return null;
}

function normalizeVarshaphalPeriod(raw, timezone = 'Asia/Kolkata') {
  if (!raw || typeof raw !== 'object') return null;

  const fromRaw =
    raw.from ?? raw.start ?? raw.startDate ?? raw.fromDate ?? raw.begin ?? raw.beginDate;
  const toRaw =
    raw.to ?? raw.end ?? raw.endDate ?? raw.toDate ?? raw.finish ?? raw.finishDate;

  const from = normalizeToISODate(fromRaw, timezone);
  const to = normalizeToISODate(toRaw, timezone);
  if (!from || !to) return null;
  if (from > to) return null; // invalid range

  const planetRaw =
    raw.planet ?? raw.dasha_planet ?? raw.dashaPlanet ?? raw.lord ?? raw.planetName;
  const dasha_planet = planetRaw ? String(planetRaw).toUpperCase() : null;

  const bhavRaw = raw.bhav ?? raw.house ?? raw.bhava ?? raw.bhavNo;
  const bhav = bhavRaw == null ? null : Number(bhavRaw);

  const narrativeRaw = raw.description ?? raw.narrative ?? raw.text;
  const narrative = narrativeRaw ? String(narrativeRaw) : null;

  return { from, to, dasha_planet, bhav, narrative };
}

function maxISODate(a, b) {
  return a > b ? a : b;
}

function minISODate(a, b) {
  return a < b ? a : b;
}

/**
 * Extract varshaphal data from chart_data (if provided in snapshot metadata)
 */
function extractVarshaphalData(astroSnapshot) {
  // Check if varshaphal data was stored in snapshot metadata
  // Metadata is stored in houses_state._metadata when window was created
  let metadata = null;
  
  if (astroSnapshot.houses_state) {
    let houses = astroSnapshot.houses_state;
    
    // Parse if string
    if (typeof houses === 'string') {
      try {
        houses = JSON.parse(houses);
      } catch (e) {
        // If parsing fails, return null
        return null;
      }
    }
    
    // Check for metadata
    if (houses && typeof houses === 'object') {
      if (houses._metadata) {
        metadata = houses._metadata;
      } else if (Array.isArray(houses) && houses.length === 0) {
        // Empty array, no metadata
        return null;
      }
    }
  }
  
  if (!metadata || !metadata.varshaphal) {
    return null;
  }
  
  const varshaphal = metadata.varshaphal;
  
  return {
    muntha: varshaphal.muntha || null,
    dashaPeriods: varshaphal.dashaPeriods || [],
    year: varshaphal.year || null,
  };
}

/**
 * Generate Muntha narrative from house number
 */
function generateMunthaNarrative(house) {
  if (!house || house < 1 || house > 12) {
    return null;
  }
  
  // Simple Muntha narratives based on house
  const munthaNarratives = {
    1: "This year brings focus on your personal identity and self-expression. You may experience significant changes in how you present yourself to the world. This is a time for self-discovery and building confidence.",
    2: "Financial matters and material resources take center stage this year. There may be fluctuations in income or expenses. Focus on building stability and avoiding unnecessary risks in money matters.",
    3: "Communication, siblings, and short journeys are highlighted. You may find yourself more active in social circles or taking on new learning opportunities. Be mindful of hasty decisions in communication.",
    4: "Home, family, and emotional foundations are emphasized. There may be changes or developments in your domestic life. This period encourages creating a stable and nurturing environment.",
    5: "Creativity, children, and speculative matters come into focus. This year may bring opportunities for creative expression or new learning. Be cautious with investments and avoid overconfidence.",
    6: "Health, service, and daily routines require attention. You may need to focus on maintaining good health habits and managing work-related stress. This period encourages discipline and routine.",
    7: "Partnerships, marriage, and relationships are highlighted. This year may bring significant developments in your personal or business partnerships. Focus on cooperation and mutual understanding.",
    8: "Transformation, shared resources, and hidden matters come into focus. This period may bring deep changes or insights. Be cautious with joint finances and avoid unnecessary risks.",
    9: "Higher learning, philosophy, and long journeys are emphasized. This year may bring opportunities for spiritual growth or educational pursuits. Travel, especially for learning purposes, may be beneficial.",
    10: "Career, reputation, and public standing take center stage. This year may bring significant developments in your professional life. Focus on building a strong foundation for long-term success.",
    11: "Friendships, goals, and social networks are highlighted. This period may bring new connections or opportunities through friends. Focus on building meaningful relationships and working toward your aspirations.",
    12: "Spirituality, solitude, and hidden matters come into focus. This year encourages introspection and letting go of what no longer serves you. Be mindful of health and avoid unnecessary expenses."
  };
  
  return munthaNarratives[house] || null;
}

/**
 * Generate narrative for a dasha period
 */
function generateDashaPeriodNarrative(planet, bhav, fromDate, toDate) {
  if (!planet || !bhav) {
    return null;
  }
  
  const planetNames = {
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
  
  const planetName = planetNames[planet.toUpperCase()] || planet;
  
  // Simple narratives based on planet + house combination
  // In production, this would be more sophisticated
  const narratives = {
    'SUN_1': "You will be confident and positive during this period. You will continue to wield power and authority either in government or public life. Short distance journeys are indicated which will prove to be beneficial.",
    'MOON_4': "It should turn out to be a prosperous period for you. You will receive many surprises, mostly pleasant. There will be happiness through spouse and your relatives. There will be success in disputes and litigations.",
    'MERCURY_12': "This is not a very satisfactory period for you. You may get indulge into sudden losses financially. Failure in attempts will make you feel frustrated. You will have to slog as the work burden will be too much.",
    'KETU_9': "This is a good time for self-expression and the use of your creative abilities in various fields. Some auspicious ceremony may be celebrated in your family. The most unexpected changes could be expected in your work area.",
    'VENUS_1': "This period is fabulous for you for many reasons. Your ambience is just so great, that things just seem to be sorting themselves out. All your household affairs are going around their respective orbits with perfect harmony.",
    'RAHU_3': "You will get full co-operation from superiors or people in responsible or influential positions. You can make great progress professionally. Business/trade prospects will be very good, a promotion should be anticipated if employed somewhere.",
    'JUPITER_7': "Your deep awareness of keeping track of your health and taking better care of yourself and your own needs will help you harness some of your active energy. Your life-partner will contribute to your happiness and success.",
    'SATURN_4': "Some restlessness is likely, mainly because of a deep feeling of wanderlust. You don't like to get backed into a corner, so this can cause some strain. The period will begin with a phase of volatility and pressure in career."
  };
  
  const key = `${planet.toUpperCase()}_${bhav}`;
  const specificNarrative = narratives[key];
  
  if (specificNarrative) {
    return specificNarrative;
  }
  
  // Fallback generic narrative
  return `During this period, ${planetName} influences your ${bhav}th house, bringing its unique energies to areas of life associated with this house. This is a time to be mindful of the opportunities and challenges that arise, and to act with wisdom and patience.`;
}

/**
 * Generate Varshfal data for a yearly window
 */
export async function generateVarshfal(windowId) {
  // Input validation
  if (!windowId || Number.isNaN(Number(windowId))) {
    throw new Error('WINDOW_ID missing or invalid');
  }

  const windowIdNum = Number(windowId);

  // Load window to verify scope
  const windowRes = await query(
    'SELECT id, scope, start_at, end_at, timezone, user_id, chart_id FROM prediction_windows WHERE id = $1',
    [windowIdNum]
  );
  
  if (windowRes.rowCount === 0) {
    throw new Error(`Window not found: ${windowId}`);
  }
  
  const window = windowRes.rows[0];
  
  // Varshfal is only for yearly windows
  if (window.scope !== 'yearly') {
    throw new Error(`Varshfal is only available for yearly windows. Found scope: ${window.scope}`);
  }
  
  // Extract year from window
  const year = window.start_at ? new Date(window.start_at).getFullYear() : new Date().getFullYear();
  
  // Load astro snapshot
  const astroRes = await query(
    'SELECT * FROM astro_state_snapshots WHERE window_id = $1',
    [windowIdNum]
  );
  
  if (astroRes.rowCount === 0) {
    throw new Error(`Astro snapshot not found for window_id=${windowId}`);
  }
  
  const astroSnapshot = astroRes.rows[0];
  
  // Try to extract varshaphal data from chart_data (if stored)
  const varshaphalData = extractVarshaphalData(astroSnapshot);
  
  // Build details object
  const details = {
    year: year,
    lagna: {
      sign: astroSnapshot.lagna_sign,
      signName: getSignName(astroSnapshot.lagna_sign)
    },
    moon: {
      sign: astroSnapshot.moon_sign,
      signName: getSignName(astroSnapshot.moon_sign),
      nakshatra: astroSnapshot.moon_nakshatra
    }
  };
  
  // Generate Muntha (if varshaphal data has it, use it; otherwise calculate from year)
  let muntha = null;
  if (varshaphalData && varshaphalData.muntha) {
    muntha = {
      house: varshaphalData.muntha.house,
      narrative: varshaphalData.muntha.description || generateMunthaNarrative(varshaphalData.muntha.house)
    };
  } else {
    // Calculate Muntha from year (simplified: year % 12 + 1)
    const munthaHouse = ((year % 12) + 1);
    const munthaNarrative = generateMunthaNarrative(munthaHouse);
    if (munthaNarrative) {
      muntha = {
        house: munthaHouse,
        narrative: munthaNarrative
      };
    }
  }
  
  // Generate timeline periods
  // IMPORTANT: Always use window.start_at as the starting point, not birth date
  const windowStartDate = new Date(window.start_at);
  const windowEndDate = new Date(window.end_at);
  const windowTimezone = window.timezone || 'Asia/Kolkata';
  
  // Validate window dates
  if (isNaN(windowStartDate.getTime()) || isNaN(windowEndDate.getTime())) {
    throw new Error(`Invalid window dates: start_at=${window.start_at}, end_at=${window.end_at}`);
  }
  
  const windowStartISO = formatISODateInTZ(windowStartDate, windowTimezone);
  const windowEndISO = formatISODateInTZ(windowEndDate, windowTimezone);
  const todayISO = formatISODateInTZ(new Date(), windowTimezone);
  // If window starts in the future, "current" is the window start; otherwise "current" is today.
  const checkISO = todayISO && windowStartISO && todayISO > windowStartISO ? todayISO : windowStartISO;

  let timelinePeriods = [];
  
  if (varshaphalData && varshaphalData.dashaPeriods && varshaphalData.dashaPeriods.length > 0) {
    // Normalize + sort periods (timezone-safe, supports multiple key variants)
    const normalized = varshaphalData.dashaPeriods
      .map(p => normalizeVarshaphalPeriod(p, windowTimezone))
      .filter(Boolean)
      .sort((a, b) => (a.from === b.from ? a.to.localeCompare(b.to) : a.from.localeCompare(b.from)));

    if (normalized.length > 0 && windowStartISO && windowEndISO && checkISO) {
      // Find the period that contains checkISO
      let currentIndex = normalized.findIndex(p => p.from <= checkISO && checkISO <= p.to);

      // If not found, start from the first period that hasn't ended before the window
      let startIndex = currentIndex;
      if (startIndex < 0) {
        startIndex = normalized.findIndex(p => p.to >= windowStartISO);
      }
      if (startIndex < 0) {
        startIndex = 0;
      }

      for (let i = startIndex; i < normalized.length; i++) {
        const p = normalized[i];
        // Stop once we're beyond window end
        if (p.from > windowEndISO) break;

        // Only include periods that overlap the window at all
        const overlaps = !(p.to < windowStartISO || p.from > windowEndISO);
        if (!overlaps) continue;

        const is_current = i === currentIndex || (currentIndex < 0 && i === startIndex);
        // IMPORTANT: do NOT clip the current bhav start if it began before the window.
        const from = is_current && p.from < windowStartISO ? p.from : maxISODate(p.from, windowStartISO);
        const to = minISODate(p.to, windowEndISO);

        timelinePeriods.push({
          from,
          to,
          dasha_planet: p.dasha_planet,
          bhav: p.bhav,
          narrative:
            p.narrative ||
            generateDashaPeriodNarrative(p.dasha_planet || '', p.bhav || 0, from, to),
          is_current,
        });

        if (to >= windowEndISO) break;
      }

      // Ensure we always have a current bhav
      if (!timelinePeriods.some(tp => tp.is_current) && timelinePeriods.length > 0) {
        timelinePeriods[0].is_current = true;
      }
    }
  }
  
  // If no periods generated from provided data, generate from window dates
  if (timelinePeriods.length === 0) {
    // Generate timeline from window dates (divide year into 6-8 periods)
    const yearDuration = windowEndDate.getTime() - windowStartDate.getTime();
    const periodCount = 8; // Divide year into 8 periods
    const periodDuration = yearDuration / periodCount;
    
    // Get planets from snapshot
    const planets = astroSnapshot.planets_state || [];
    const planetList = ['SUN', 'MOON', 'MARS', 'MERCURY', 'JUPITER', 'VENUS', 'SATURN', 'RAHU', 'KETU'];
    
    for (let i = 0; i < periodCount; i++) {
      const periodStart = new Date(windowStartDate.getTime() + (i * periodDuration));
      const periodEnd = new Date(windowStartDate.getTime() + ((i + 1) * periodDuration));
      
      // Ensure last period ends at window end
      if (i === periodCount - 1) {
        periodEnd.setTime(windowEndDate.getTime());
      }
      
      // Use planet from list (cycling through)
      const planet = planetList[i % planetList.length];
      
      // Calculate bhav (simplified: based on period index)
      const bhav = ((i % 12) + 1);
      
      timelinePeriods.push({
        from: periodStart.toISOString().split('T')[0],
        to: periodEnd.toISOString().split('T')[0],
        dasha_planet: planet,
        bhav: bhav,
        narrative: generateDashaPeriodNarrative(planet, bhav, periodStart.toISOString().split('T')[0], periodEnd.toISOString().split('T')[0]),
        is_current: false // Will be set in final validation
      });
    }
  }
  
  // Final validation: Ensure we cover the full window end boundary at least
  if (timelinePeriods.length > 0) {
    // Ensure last period ends at window end
    const lastPeriod = timelinePeriods[timelinePeriods.length - 1];
    if (windowEndISO && lastPeriod.to !== windowEndISO) {
      lastPeriod.to = windowEndISO;
    }
  }
  
  return {
    meta: {
      window_id: String(windowId),
      generated_at: new Date().toISOString(),
      year: year
    },
    details: details,
    muntha: muntha,
    timeline_periods: timelinePeriods
  };
}

/**
 * Helper: Get sign name from sign number
 */
function getSignName(signNumber) {
  if (!signNumber || signNumber < 1 || signNumber > 12) {
    return null;
  }
  
  const signs = [
    'Aries',
    'Taurus',
    'Gemini',
    'Cancer',
    'Leo',
    'Virgo',
    'Libra',
    'Scorpio',
    'Sagittarius',
    'Capricorn',
    'Aquarius',
    'Pisces'
  ];
  
  return signs[signNumber - 1] || null;
}

