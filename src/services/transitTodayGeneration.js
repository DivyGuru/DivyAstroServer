/**
 * Transit Today Generation Service
 * 
 * Generates "Transit Today" data for a specific date.
 * Similar to sample PDF structure: Each planet's transit position with narrative.
 * 
 * API CONTRACT:
 * {
 *   meta: {
 *     window_id: string,
 *     generated_at: string ISO timestamp,
 *     date: string (ISO date: YYYY-MM-DD)
 *   },
 *   transits: [
 *     {
 *       planet: string,
 *       sign: number,
 *       signName: string,
 *       house: number,
 *       narrative: string
 *     }
 *   ]
 * }
 */

import { query } from '../../config/db.js';

/**
 * Get sign name from sign number
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
 * Generate transit narrative based on planet, sign, and house
 */
function generateTransitNarrative(planet, signName, house) {
  if (!planet || !house) {
    return null;
  }
  
  const planetName = getPlanetName(planet);
  const narratives = {
    'SUN_12_SCORPIO': "Don't try to be aggressive in nature because your aggressiveness can shove you into difficult situations. There will be difference of opinion, quarrels, and fighting with your friends. So, try to maintain good relations otherwise there is possibility of straining relations with them. There will be ups and downs financially. Lack of harmony and understanding is indicated in family life. There are possibilities of distress from spouse and mother. Care must be taken regarding health. The diseases that require immediate attention are headace, eye, abdominal disease, and swelling of the feet.",
    'MOON_1_SAGITTARIUS': "You will not be able to grab the chances coming your way though you will have a lot of opportunities but all in ruin. You may face problems related to your health or your parents so get good care of them as well as yours. Long distance travel is on your cards but would not be very beneficial and should be avoided. This is a period of mixed results for you. There can be dispute with the public and your colleagues. You will be prone to diseases like cold and fever. There will be mental worry without any visible causes.",
    'MARS_12_SCORPIO': "You should avoid complacency and easy-going attitudes, tone down the flashier side of your nature, and get back to old-fashioned hard-work in an attempt to succeed in life. Financially it will be a difficult period. You may have to confront theft, scandals and disputes during this period. You will find increased work-loads and heightened levels of responsibility at work. This is considered somewhat a bad period for health. You can face ear and eye troubles. Your life-partner can also have health issues. Your peace of mind will remain disturbed."
  };
  
  const key = `${planet.toUpperCase()}_${house}_${signName?.toUpperCase()}`;
  const specificNarrative = narratives[key];
  
  if (specificNarrative) {
    return specificNarrative;
  }
  
  // Fallback generic narrative
  const houseMeanings = {
    1: 'self, personality, and physical appearance',
    2: 'wealth, family, and speech',
    3: 'siblings, courage, and communication',
    4: 'mother, home, and property',
    5: 'children, education, and creativity',
    6: 'health, enemies, and service',
    7: 'spouse, partnerships, and marriage',
    8: 'longevity, transformation, and obstacles',
    9: 'father, fortune, and spirituality',
    10: 'career, reputation, and public standing',
    11: 'income, gains, and friendships',
    12: 'losses, expenses, and spirituality'
  };
  
  const houseMeaning = houseMeanings[house] || `the ${house}th house`;
  
  return `${planetName} is transiting through your ${house}th house (${signName || 'house'}), influencing areas related to ${houseMeaning}. This transit may bring changes and developments in these areas of your life. Be mindful of the opportunities and challenges that arise during this period.`;
}

/**
 * Extract transit data from astro snapshot
 */
function extractTransitData(astroSnapshot) {
  if (!astroSnapshot.transits_state) {
    return [];
  }
  
  let transits = astroSnapshot.transits_state;
  
  // Parse if string
  if (typeof transits === 'string') {
    try {
      transits = JSON.parse(transits);
    } catch (e) {
      return [];
    }
  }
  
  if (!Array.isArray(transits)) {
    // If object, convert to array
    if (transits && typeof transits === 'object') {
      transits = Object.entries(transits).map(([key, value]) => ({
        planet: key,
        ...value
      }));
    } else {
      return [];
    }
  }
  
  return transits;
}

/**
 * Generate Transit Today data
 */
export async function generateTransitToday(windowId, targetDate = null) {
  // Input validation
  if (!windowId || Number.isNaN(Number(windowId))) {
    throw new Error('WINDOW_ID missing or invalid');
  }

  const windowIdNum = Number(windowId);
  
  // Use targetDate if provided, otherwise use today
  const date = targetDate ? new Date(targetDate) : new Date();
  const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD

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
  
  // Extract transit data
  const transitData = extractTransitData(astroSnapshot);
  
  // Get birth chart planets to calculate house positions
  let birthPlanets = [];
  if (astroSnapshot.planets_state) {
    let planets = astroSnapshot.planets_state;
    
    if (typeof planets === 'string') {
      try {
        planets = JSON.parse(planets);
      } catch (e) {
        // ignore
      }
    }
    
    if (Array.isArray(planets)) {
      birthPlanets = planets;
    }
  }
  
  // Get lagna sign for house calculation
  const lagnaSign = astroSnapshot.lagna_sign || null;
  
  // Process transits
  const transits = [];
  
  // Planet order for display (as per traditional order)
  const planetOrder = ['SUN', 'MOON', 'MARS', 'MERCURY', 'JUPITER', 'VENUS', 'SATURN', 'RAHU', 'KETU'];
  
  for (const planetName of planetOrder) {
    // Find transit for this planet
    const transit = transitData.find(t => {
      const tPlanet = (t.planet || t.name || t.id || '').toUpperCase();
      return tPlanet === planetName.toUpperCase();
    });
    
    if (!transit) {
      continue; // Skip if transit not found
    }
    
    const sign = transit.sign || null;
    const signName = getSignName(sign);
    const longitude = transit.longitude || transit.degree || transit.position || null;
    
    // Calculate house from transit sign and lagna sign
    let house = transit.house || null;
    
    if (!house && sign && lagnaSign) {
      // Calculate house: (transit_sign - lagna_sign + 1) mod 12, but handle 0-based
      let houseNum = (sign - lagnaSign + 1);
      if (houseNum <= 0) houseNum += 12;
      if (houseNum > 12) houseNum -= 12;
      house = houseNum;
    }
    
    // If still no house, try to get from transit data directly
    if (!house) {
      house = transit.h || transit.houseNumber || null;
    }
    
    // Generate narrative
    const narrative = transit.description || transit.narrative || generateTransitNarrative(
      planetName,
      signName,
      house
    );
    
    transits.push({
      planet: planetName,
      sign: sign,
      signName: signName,
      house: house,
      longitude: longitude,
      narrative: narrative || null
    });
  }
  
  return {
    meta: {
      window_id: String(windowId),
      generated_at: new Date().toISOString(),
      date: dateStr
    },
    transits: transits
  };
}

