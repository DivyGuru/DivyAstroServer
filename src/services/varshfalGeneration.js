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
  
  // Muntha narratives (avoid generic "be mindful" / template voice)
  const munthaNarratives = {
    1: "Muntha in the 1st house makes the year personal.\nYour image, confidence, and the way people respond to you becomes a main theme.\nSituations repeat until you learn how to carry yourself calmly under attention.\nIf you rush to prove yourself, ego-clashes rise; if you stay steady, respect builds.",
    2: "Muntha in the 2nd house makes money and family responsibilities loud.\nIncome–expense balance becomes a repeating lesson.\nSpeech also becomes karma: one sharp sentence can create long tension.\nKeep finances simple; avoid impulsive commitments and careless borrowing.",
    3: "Muntha in the 3rd house pushes effort, communication, and short travel.\nYou may feel restless—doing many things but needing one clear direction.\nSibling / teammate dynamics can become sensitive.\nWin through consistent effort, not through arguments or impulsive moves.",
    4: "Muntha in the 4th house turns attention to home, mother, property, and inner peace.\nDomestic matters can demand time and emotional bandwidth.\nIf the mind feels unsettled, productivity drops even when work is fine.\nStability comes from fixing one thing at home—routine, space, or family boundaries.",
    5: "Muntha in the 5th house highlights learning, creativity, romance, and children.\nThis year tests judgement: where you take risks, and where you stay disciplined.\nOverconfidence creates avoidable losses.\nUse skill and planning; avoid gambling-like decisions and dramatic emotional choices.",
    6: "Muntha in the 6th house makes routine the battlefield.\nHealth, debts, workplace pressure, and small conflicts can repeat.\nIf you ignore the body, the body forces attention.\nWin through discipline: sleep, food, and a simple daily schedule.",
    7: "Muntha in the 7th house makes partnerships central.\nRelationship expectations, promises, and fairness get tested.\nIf ego enters, small misunderstandings grow.\nClear communication and balanced give-and-take keeps this year smoother.",
    8: "Muntha in the 8th house brings sudden shifts, hidden worries, and transformation.\nOld patterns return so you can end them properly.\nJoint finances and trust issues require clean handling.\nAvoid secrecy; keep paperwork and boundaries clear.",
    9: "Muntha in the 9th house brings dharma, beliefs, mentors, and long journeys into focus.\nFortune improves when ethics are clean.\nIf you try shortcuts, results become uneven.\nGood year for learning and structured spiritual practice—not blind faith.",
    10: "Muntha in the 10th house puts career and reputation on the stage.\nPeople notice your output more than your intentions.\nIf you stay consistent, visibility increases; if you cut corners, criticism rises.\nThis year rewards steady responsibility and long-term thinking.",
    11: "Muntha in the 11th house focuses gains, networks, and fulfilment of goals.\nFriend circles and collaborations become important.\nIf you chase every opportunity, energy scatters.\nPick one main target; gains come through the right people, not through noise.",
    12: "Muntha in the 12th house increases expenses, isolation, and inner work.\nSleep, overthinking, and mental fatigue can become themes.\nThis year asks for release—habits, people, or expectations that drain you.\nKeep expenses disciplined; protect rest and mental space."
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
  
  // Fallback narrative (avoid template voice; use planet-specific archetypes)
  const ordinal = getOrdinal(bhav);
  
  const houseDomains = {
    1: 'self-identity, personality, and personal confidence',
    2: 'wealth, family resources, and speech',
    3: 'communication, siblings, and courage',
    4: 'home, mother, and emotional foundations',
    5: 'creativity, children, and education',
    6: 'health, service, and daily routines',
    7: 'partnerships, marriage, and business relationships',
    8: 'transformation, longevity, and shared resources',
    9: 'spirituality, father, and higher learning',
    10: 'career, reputation, and public standing',
    11: 'gains, income, and friendships',
    12: 'losses, expenses, and spirituality'
  };
  
  const domain = houseDomains[bhav] || `areas associated with the ${ordinal} house`;

  const p = String(planet || '').toUpperCase();
  const lines = [];
  lines.push(`${planetName} period in the ${ordinal} house.`);
  lines.push(`Theme: ${domain}.`);

  // Planet-specific voice (short punch + longer cause/effect)
  switch (p) {
    case 'SUN':
      lines.push(`Respect and authority matters become louder than usual.`);
      lines.push(`If ego reacts first, conflicts repeat; if leadership stays calm, outcomes improve.`);
      break;
    case 'MOON':
      lines.push(`Mood and mental comfort becomes the deciding factor behind many choices.`);
      lines.push(`If insecurity rises, overthinking repeats; routine and emotional steadiness keeps it stable.`);
      break;
    case 'MARS':
      lines.push(`Action energy rises—so does impatience.`);
      lines.push(`Arguments and impulsive moves repeat if anger becomes a habit; discipline turns it into clean progress.`);
      break;
    case 'MERCURY':
      lines.push(`Communication and decision clarity becomes karma.`);
      lines.push(`Misunderstandings repeat when things are rushed—write, verify, and keep promises realistic.`);
      break;
    case 'JUPITER':
      lines.push(`Hope and expansion rises, but so can overconfidence.`);
      lines.push(`Results improve when ethics and judgement stay clean; shortcuts create disappointment.`);
      break;
    case 'VENUS':
      lines.push(`Desire for comfort and harmony increases.`);
      lines.push(`Attachment patterns repeat if boundaries are weak; balance gives sweetness without regret.`);
      break;
    case 'SATURN':
      lines.push(`Workload and responsibility feels heavier, with delayed rewards.`);
      lines.push(`Consistency is the only medicine here—structure first, emotion later.`);
      break;
    case 'RAHU':
      lines.push(`Restlessness and strong desire can pull you into messy choices.`);
      lines.push(`Confusion repeats when you chase quick wins; grounding and verification keeps it safer.`);
      break;
    case 'KETU':
      lines.push(`Detachment increases; interest can drop suddenly.`);
      lines.push(`Withdrawal repeats if you cut off too fast; stability comes from routine and patience.`);
      break;
    default:
      lines.push(`This phase repeats lessons until your response becomes steady.`);
      break;
  }

  return lines.join('\n');
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
  
  // Build details object with quality guardrails
  // Never output null or "Unknown" sign names
  const lagnaSign = astroSnapshot.lagna_sign;
  const moonSign = astroSnapshot.moon_sign;
  
  const details = {
    year: year,
    lagna: {
      sign: lagnaSign,
      signName: lagnaSign ? getSignName(lagnaSign) : null // null OK, not "Unknown"
    },
    moon: {
      sign: moonSign,
      signName: moonSign ? getSignName(moonSign) : null, // null OK, not "Unknown"
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

