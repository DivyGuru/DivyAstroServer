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
import { resolveRemediesForPlanets } from './remedyResolver.js';

function getMahadashaThemesByHouse(house) {
  const h = Number(house);
  if (!Number.isFinite(h)) return ['general'];

  // DB enum themes: 'money','career','relationship','health','spirituality','general','travel','education','family'
  const map = {
    1: ['general'],
    2: ['money'],
    3: ['travel'],
    4: ['family'],
    5: ['education'],
    6: ['health'],
    7: ['relationship'],
    8: ['general'],
    9: ['spirituality'],
    10: ['career'],
    11: ['money'],
    12: ['spirituality', 'general'],
  };

  return map[h] || ['general'];
}

function buildMahadashaRemedyHook(planetUpper) {
  const planet = String(planetUpper || '').toUpperCase();
  const planetName = planet.charAt(0) + planet.slice(1).toLowerCase();
  return {
    message: `During ${planetName} Mahadasha, supportive practices can help steady the mind and reduce the strain of this long-running phase.`,
    cta: 'View supportive remedies',
  };
}

const PLANET_NAME_TO_ID = {
  SUN: 0,
  MOON: 1,
  MARS: 2,
  MERCURY: 3,
  JUPITER: 4,
  VENUS: 5,
  SATURN: 6,
  RAHU: 7,
  KETU: 8,
};

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
  const ordinal = getOrdinal(house);
  const signRef = signName ? ` (${signName})` : '';
  
  // House domain mapping for contextual, astrologer-style narrative
  const houseDomains = {
    1: 'self-identity, confidence, and how you carry yourself',
    2: 'money, savings, speech, and family responsibilities',
    3: 'effort, courage, communication, and siblings',
    4: 'home, mother, emotional security, and property matters',
    5: 'education, creativity, children, and decision-making',
    6: 'health routines, service, debts, and daily pressure',
    7: 'relationships, partnership dynamics, and agreements',
    8: 'sudden changes, hidden pressure, trust, and deep transformation',
    9: 'belief, guidance, learning, and inner purpose',
    10: 'career direction, reputation, responsibilities, and visibility',
    11: 'gains, networks, long-term hopes, and support from others',
    12: 'expenses, isolation, sleep, inner burden, and letting go'
  };
  
  const planetThemes = {
    'SUN': {
      essence: 'self-respect, authority, and visibility',
      shadow: 'ego clashes, image pressure, and authority tension',
      lived: 'you feel the need to prove yourself and be taken seriously'
    },
    'MOON': {
      essence: 'emotional tides, intuition, and inner security',
      shadow: 'mood swings, over-sensitivity, and mental restlessness',
      lived: 'your feelings become louder and your peace becomes harder to maintain'
    },
    'MARS': {
      essence: 'drive, courage, and decisive action',
      shadow: 'impulsiveness, arguments, and burnout',
      lived: 'you may act quickly, or feel irritated when things move slowly'
    },
    'MERCURY': {
      essence: 'thinking, communication, and practical choices',
      shadow: 'overthinking, mixed signals, and scattered focus',
      lived: 'your mind stays busy and decisions require more mental effort'
    },
    'JUPITER': {
      essence: 'guidance, growth, and faith in the long view',
      shadow: 'over-confidence or careless spending',
      lived: 'you look for meaning and try to grow through whatever life brings'
    },
    'VENUS': {
      essence: 'love, comfort, harmony, and enjoyment',
      shadow: 'attachment, indulgence, and blurred boundaries',
      lived: 'relationships and comforts become a strong emotional focus'
    },
    'SATURN': {
      essence: 'duty, delay, discipline, and karmic responsibility',
      shadow: 'pressure, isolation, and long waiting periods',
      lived: 'effort feels heavy and results can feel delayed, even when you are sincere'
    },
    'RAHU': {
      essence: 'restlessness, ambition, and unconventional desire',
      shadow: 'confusion, anxiety, and unstable choices',
      lived: 'you may feel hungry for change, but unsure which direction is clean'
    },
    'KETU': {
      essence: 'detachment, sharp inner perception, and withdrawal',
      shadow: 'distance, dissatisfaction, and lack of interest in surface goals',
      lived: 'you may feel disconnected from people or outcomes that used to matter'
    }
  };
  
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
    // Convert long paragraph to 7–8 readable lines for UI
    const parts = String(specificNarrative)
      .split('.')
      .map(s => s.trim())
      .filter(Boolean)
      .map(s => (s.endsWith('.') ? s : `${s}.`));
    
    const header = `${planetName} Mahadasha in your ${ordinal} house${signRef}.`;
    const domainLine = `Focus centers on ${houseDomains[house] || `themes of the ${ordinal} house`}.`;
    const themed = planetThemes[planetName] || null;
    const themeLine = themed ? `Core tone: ${themed.essence}.` : null;
    
    const lines = [header, domainLine, themeLine, ...parts].filter(Boolean);
    return lines.slice(0, 8).join('\n');
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

  const domain = houseDomains[house] || `themes of the ${ordinal} house`;
  const themed = planetThemes[planetName] || null;
  
  // 7–8 line astrologer-style narrative (no dates, no fear)
  const lines = [];
  lines.push(`${planetDisplayName} Mahadasha in your ${ordinal} house${signRef}.`);
  lines.push(`This period brings ${themed ? themed.essence : 'a distinct life emphasis'} to the surface.`);
  lines.push(`The focus naturally moves toward ${domain}.`);
  lines.push(`In daily life, ${themed ? themed.lived : 'you may notice the same themes repeating until handled clearly'}.`);
  if (themed?.shadow) {
    lines.push(`The difficult side can be: ${themed.shadow}.`);
  } else {
    lines.push(`The difficult side can be: delays, mixed signals, or pressure that builds slowly.`);
  }
  lines.push(`This is a period where choices carry longer consequences, so steady decisions work better than rushed ones.`);
  lines.push(`If stress rises, it usually shows first in ${domain}.`);
  lines.push(`With time, this period becomes easier when your approach in this area becomes disciplined and consistent.`);
  
  return lines.slice(0, 8).join('\n');
}

function shouldUseGeneratedNarrative(existing) {
  if (!existing || typeof existing !== 'string') return true;
  const t = existing.trim();
  if (!t) return true;
  // If it already contains line breaks or is meaningfully long, keep it.
  if (t.includes('\n')) return false;
  if (t.length >= 160) return false;
  // Common short labels like "Saturn Mahadasha (19y)" should be replaced.
  if (/mahadasha\s*\(/i.test(t) && t.length < 60) return true;
  // Otherwise, prefer generated for richer output.
  return t.length < 120;
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
      const existingNarrative = period.description || period.narrative || null;
      const generatedNarrative = generateMahadashaNarrative(
        planet,
        planetPosition?.house || null,
        planetPosition?.signName || null
      );
      const narrative = shouldUseGeneratedNarrative(existingNarrative)
        ? (generatedNarrative || existingNarrative || null)
        : existingNarrative;
      
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

      // Attach remedies only for CURRENT Mahadasha (user intent: if Mahadasha is running, show remedies).
      // Backward-compatible: adds optional fields only when we have remedies.
      if (isCurrent) {
        const planetId = PLANET_NAME_TO_ID[String(planet || '').toUpperCase()];
        const remedies = await resolveRemediesForPlanets({
          planetIds: Number.isFinite(planetId) ? [planetId] : [],
          planetName: String(planet || '').toUpperCase(),
          preferLongTerm: true,
          preferShortTerm: false,
          preferDisciplined: true,
          limit: 5,
        });

        console.log(`[MahadashaPhal] Current ${planet} period: Found ${remedies?.length || 0} remedies`);
        if (remedies && remedies.length > 0) {
          console.log(`[MahadashaPhal] Attaching remedies to ${planet} period:`, remedies.map(r => r.type));
        }

        if (Array.isArray(remedies) && remedies.length > 0) {
          const last = mahadashaPeriods[mahadashaPeriods.length - 1];
          last.remedy_hook = buildMahadashaRemedyHook(last.planet);
          last.remedies = remedies;
        } else {
          console.log(`[MahadashaPhal] No remedies attached to ${planet} period (empty array or invalid)`);
        }
      }
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

      if (isCurrent) {
        const planetId = PLANET_NAME_TO_ID[String(planet || '').toUpperCase()];
        const remedies = await resolveRemediesForPlanets({
          planetIds: Number.isFinite(planetId) ? [planetId] : [],
          planetName: String(planet || '').toUpperCase(),
          preferLongTerm: true,
          preferShortTerm: false,
          preferDisciplined: true,
          limit: 2,
        });

        if (Array.isArray(remedies) && remedies.length > 0) {
          const last = mahadashaPeriods[mahadashaPeriods.length - 1];
          last.remedy_hook = buildMahadashaRemedyHook(last.planet);
          last.remedies = remedies;
        }
      }
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

