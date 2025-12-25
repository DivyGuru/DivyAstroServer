/**
 * Mahadasha Phal Generation Service
 * 
 * Generates Vimshottari Mahadasha Phal (Dasha Predictions) data.
 * Similar to sample PDF structure: All Mahadasha periods with planet positions and narratives.
 * 
 * API CONTRACT:
 * {
 *   meta: {
 *     window_id: string,
 *     generated_at: string ISO timestamp,
 *     birth_date: string
 *   },
 *   mahadasha_periods: [
 *     {
 *       planet: string,
 *       from: string (ISO date),
 *       to: string (ISO date),
 *       planet_position: {
 *         sign: number,
 *         signName: string,
 *         house: number
 *       },
 *       narrative: string,
 *       is_current: boolean
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
 * Extract dasha data from chart_data (if provided in snapshot metadata)
 */
function extractDashaData(astroSnapshot) {
  // Check if dasha data was stored in snapshot metadata
  let metadata = null;
  
  if (astroSnapshot.houses_state) {
    let houses = astroSnapshot.houses_state;
    
    // Parse if string
    if (typeof houses === 'string') {
      try {
        houses = JSON.parse(houses);
      } catch (e) {
        return null;
      }
    }
    
    // Check for metadata
    if (houses && typeof houses === 'object') {
      if (houses._metadata) {
        metadata = houses._metadata;
      }
    }
  }
  
  if (!metadata || !metadata.dasha) {
    return null;
  }
  
  return metadata.dasha;
}

/**
 * Generate Mahadasha narrative based on planet and house position
 */
function generateMahadashaNarrative(planet, house, signName) {
  if (!planet || !house) {
    return null;
  }
  
  const planetName = planet.toUpperCase();
  const narratives = {
    'RAHU_4': "Volatility & some lack of direction in career will prevail as the period starts. You should avoid new projects or major changes in career during this time. You will not be able to cope well with your friends and relatives. Unwanted situations may arise, which can create fighting, troubles into your life. Don't adopt undesirable means for quick monetary gains. Working/service conditions shall not be satisfactory. There could be danger of accident/mishap. Try to build up your confidence to cope with awkward situations which will come in this period. You may have cough problems, asthmatic complaints or rheumatic pains.",
    'JUPITER_3': "There will be a strong influence from others to help you create more personal security in having your material needs met. Money will definitely be coming your way and will greatly influence your personal beliefs, dreams and philosophies. You will get recognition of your merits by the government and higher authorities. You have a friendly nature, and feel very comfortable enjoying the group dynamics of different social scenes; you may get disturb a bit due to health ailment. Personal transformation is far more appealing than outer changes.",
    'SATURN_12': "This is not a very satisfactory period for you. You may get indulge into sudden losses financially. Loss of money due to litigation and disputes is also possible. Failure in attempts will make you feel frustrated. You will have to slog as the work burden will be too much. Family life will also create tensions. Don't try to take risks in business matters as period is not very harmonious to you. Your enemies will try to tarnish your image. Loss of money will be quite evident.",
    'VENUS_11': "This period brings you success in all comings and goings. Some form of pleasant culmination in your professional life brings rewards and recognition. Happier period for recreation and romance. Your brother and sisters will flourish this year. There will be an increase in your income due to your own efforts. Family life shall be quite happy. An exciting job offer, reward, recognition, or promotion is very possible. You will buy gold items, and precious stones. In general, you will get on very well with friends/associates and people from different walks of life.",
    'SUN_1': "You will be confident and positive during this period. You will continue to wield power and authority either in government or public life. Short distance journeys are indicated which will prove to be beneficial. You will spend money freely. You and a close family member may suffer from ill health. Specifically it indicates sickness to your life partner, severe headache or eye complaints.",
    'MOON_11': "This is a period of financial stability for you. During this period you can work over your hopes and ambitions and give them a better shape. This is a favorable time for love and romance. You will develop new friendship which will be very rewarding and helpful. You will enjoy respect and honor from learned people and will be quite popular with the opposite sex. Long distance travel is also indicated.",
    'MARS_3': "Physically as well as mentally you will be very courageous during this period. This is a good phase for your relatives especially your brothers will grow. Go for attempts in your career life as the success is assured. Gain of material wealth and property is indicated."
  };
  
  const key = `${planetName}_${house}`;
  const specificNarrative = narratives[key];
  
  if (specificNarrative) {
    return specificNarrative;
  }
  
  // Fallback generic narrative
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
  
  const planetDisplayName = planetNames[planetName] || planet;
  
  // Fix ordinal grammar and improve narrative
  const ordinal = getOrdinal(house);
  const signRef = signName ? ` (${signName})` : '';
  
  // House domain mapping for specific narratives
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
  
  const domain = houseDomains[house] || `areas associated with the ${ordinal} house`;
  
  // Planet-specific themes for meaningful one-line descriptions
  const planetThemes = {
    'SUN': 'authority, leadership, and personal confidence',
    'MOON': 'emotional patterns, intuition, and inner security',
    'MARS': 'action, courage, and assertive energy',
    'MERCURY': 'communication, learning, and intellectual pursuits',
    'JUPITER': 'wisdom, expansion, and spiritual growth',
    'VENUS': 'relationships, beauty, and material comforts',
    'SATURN': 'responsibility, discipline, and long-term restructuring of life priorities',
    'RAHU': 'material desires, unconventional paths, and sudden changes',
    'KETU': 'detachment, spiritual focus, and karmic resolution'
  };
  
  const theme = planetThemes[planetName] || 'significant life developments';
  
  // Return concise, meaningful one-line description
  return `This phase emphasizes ${theme}.`;
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
 * Get planet position from astro snapshot
 */
function getPlanetPosition(astroSnapshot, planetName) {
  if (!astroSnapshot.planets_state) {
    return null;
  }
  
  let planets = astroSnapshot.planets_state;
  
  // Parse if string
  if (typeof planets === 'string') {
    try {
      planets = JSON.parse(planets);
    } catch (e) {
      return null;
    }
  }
  
  if (!Array.isArray(planets)) {
    return null;
  }
  
  // Find planet
  const planet = planets.find(p => {
    const pName = (p.planet || p.name || '').toUpperCase();
    return pName === planetName.toUpperCase();
  });
  
  if (!planet) {
    return null;
  }
  
  // Fix Rahu/Ketu sign handling - derive from longitude if sign missing
  let sign = planet.sign || null;
  let signName = getSignName(sign);
  
  if (!signName && planet.longitude !== null && planet.longitude !== undefined) {
    const signNum = Math.floor(planet.longitude / 30) + 1;
    if (signNum >= 1 && signNum <= 12) {
      sign = signNum;
      signName = getSignName(signNum);
    }
  }
  
  // Quality guardrail: Never return null or "Unknown" sign
  // If still no sign, return null (will be handled gracefully in narrative)
  
  // UX Polish: Omit signName field if null or empty
  const result = {
    sign: sign,
    house: planet.house || null
  };
  
  // Only include signName if it has a value
  if (signName && signName.trim().length > 0) {
    result.signName = signName;
  }
  
  return result;
}

/**
 * Generate Mahadasha Phal data
 */
export async function generateMahadashaPhal(windowId) {
  // Input validation
  if (!windowId || Number.isNaN(Number(windowId))) {
    throw new Error('WINDOW_ID missing or invalid');
  }

  const windowIdNum = Number(windowId);

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
  
  console.log(`[MahadashaPhal] Window ${windowId}: Starting generation`);
  
  // Extract dasha data from chart_data (if provided)
  const dashaData = extractDashaData(astroSnapshot);
  
  // Debug: Log extracted dasha data
  if (!dashaData) {
    console.log(`[MahadashaPhal] No dasha data found for window ${windowId}`);
    // Try to check what's in houses_state
    if (astroSnapshot.houses_state) {
      let houses = astroSnapshot.houses_state;
      if (typeof houses === 'string') {
        try {
          houses = JSON.parse(houses);
        } catch (e) {
          // ignore
        }
      }
      console.log(`[MahadashaPhal] houses_state type: ${typeof houses}, has _metadata: ${houses?._metadata ? 'yes' : 'no'}`);
      if (houses?._metadata) {
        console.log(`[MahadashaPhal] metadata keys: ${Object.keys(houses._metadata).join(', ')}`);
      }
    }
  } else {
    console.log(`[MahadashaPhal] Found dasha data, mahadashaPeriods: ${dashaData.mahadashaPeriods?.length || 0}, mahadasha: ${dashaData.mahadasha ? 'yes' : 'no'}`);
  }
  
  // Get mahadasha periods
  let mahadashaPeriods = [];
  
  if (dashaData && dashaData.mahadashaPeriods && Array.isArray(dashaData.mahadashaPeriods) && dashaData.mahadashaPeriods.length > 0) {
    // Use provided mahadasha periods from chart_data
    const currentDate = new Date();
    
    for (const period of dashaData.mahadashaPeriods) {
      const fromDate = new Date(period.from || period.startDate || period.start);
      const toDate = new Date(period.to || period.endDate || period.end);
      const planet = period.planet || period.dashaPlanet || null;
      
      if (!planet || isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
        continue;
      }
      
      // Get planet position from snapshot
      const planetPosition = getPlanetPosition(astroSnapshot, planet);
      
      // Generate narrative
      const narrative = period.description || period.narrative || generateMahadashaNarrative(
        planet,
        planetPosition?.house || null,
        planetPosition?.signName || null
      );
      
      // Check if current
      const isCurrent = currentDate >= fromDate && currentDate <= toDate;
      
      // UX Polish: Clean planet_position - omit signName if null/empty
      let cleanedPlanetPosition = null;
      if (planetPosition) {
        cleanedPlanetPosition = {
          sign: planetPosition.sign,
          house: planetPosition.house
        };
        if (planetPosition.signName && planetPosition.signName.trim().length > 0) {
          cleanedPlanetPosition.signName = planetPosition.signName;
        }
      }
      
      mahadashaPeriods.push({
        planet: planet.toUpperCase(),
        from: fromDate.toISOString().split('T')[0],
        to: toDate.toISOString().split('T')[0],
        planet_position: cleanedPlanetPosition,
        narrative: narrative || null,
        is_current: isCurrent
      });
    }
  } else if (dashaData && dashaData.mahadasha) {
    // If only current mahadasha is provided, create a single period
    const mahadasha = dashaData.mahadasha;
    const planet = mahadasha.planet || null;
    const startDate = mahadasha.startDate ? new Date(mahadasha.startDate) : null;
    const endDate = mahadasha.endDate ? new Date(mahadasha.endDate) : null;
    
    if (planet && startDate && endDate && !isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
      const planetPosition = getPlanetPosition(astroSnapshot, planet);
      const currentDate = new Date();
      const isCurrent = currentDate >= startDate && currentDate <= endDate;
      
      // UX Polish: Clean planet_position - omit signName if null/empty
      let cleanedPlanetPosition = null;
      if (planetPosition) {
        cleanedPlanetPosition = {
          sign: planetPosition.sign,
          house: planetPosition.house
        };
        if (planetPosition.signName && planetPosition.signName.trim().length > 0) {
          cleanedPlanetPosition.signName = planetPosition.signName;
        }
      }
      
      mahadashaPeriods.push({
        planet: planet.toUpperCase(),
        from: startDate.toISOString().split('T')[0],
        to: endDate.toISOString().split('T')[0],
        planet_position: cleanedPlanetPosition,
        narrative: generateMahadashaNarrative(
          planet,
          cleanedPlanetPosition?.house || null,
          cleanedPlanetPosition?.signName || null
        ),
        is_current: isCurrent
      });
    }
  }
  
  // If no periods found, return empty array (graceful degradation)
  // In production, you might want to calculate mahadasha periods from birth data
  
  // Get birth date from chart (if available in metadata)
  let birthDate = null;
  if (astroSnapshot.houses_state) {
    let houses = astroSnapshot.houses_state;
    if (typeof houses === 'string') {
      try {
        houses = JSON.parse(houses);
      } catch (e) {
        // ignore
      }
    }
    if (houses && typeof houses === 'object' && houses._metadata) {
      birthDate = houses._metadata.birthDate || houses._metadata.birth_date || null;
    }
  }
  
  return {
    meta: {
      window_id: String(windowId),
      generated_at: new Date().toISOString(),
      birth_date: birthDate
    },
    mahadasha_periods: mahadashaPeriods
  };
}

