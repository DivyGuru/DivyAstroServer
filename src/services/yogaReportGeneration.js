/**
 * Yoga Report Generation (Phase-Yoga v1)
 *
 * Produces user-facing yoga information from a single birth chart snapshot.
 *
 * Notes:
 * - English-only output.
 * - Uses deterministic, explicit rules; traditions vary, so we expose indicators + confidence.
 * - Yogas are generally "support patterns" (not problems). Remedies are framed as strengthening practices.
 */

import { query } from '../../config/db.js';
import { computeVimshottariMahadashaPeriods } from './vimshottariDasha.js';

const YEAR_DAYS = 365.2425;
const DAY_MS = 24 * 60 * 60 * 1000;

const PLANET_CANON = [
  'SUN',
  'MOON',
  'MARS',
  'MERCURY',
  'JUPITER',
  'VENUS',
  'SATURN',
  'RAHU',
  'KETU',
];

const ENGINE_ID_TO_PLANET = {
  1: 'SUN',
  2: 'MOON',
  3: 'MARS',
  4: 'MERCURY',
  5: 'JUPITER',
  6: 'VENUS',
  7: 'SATURN',
  8: 'RAHU',
  9: 'KETU',
};

// Sign ownership (Vedic standard, 1..12 Aries..Pisces)
const SIGN_LORD = {
  1: 'MARS',     // Aries
  2: 'VENUS',    // Taurus
  3: 'MERCURY',  // Gemini
  4: 'MOON',     // Cancer
  5: 'SUN',      // Leo
  6: 'MERCURY',  // Virgo
  7: 'VENUS',    // Libra
  8: 'MARS',     // Scorpio
  9: 'JUPITER',  // Sagittarius
  10: 'SATURN',  // Capricorn
  11: 'SATURN',  // Aquarius
  12: 'JUPITER', // Pisces
};

// Exaltations (simplified sign mapping)
const EXALTATION_SIGN = {
  SUN: 1,      // Aries
  MOON: 2,     // Taurus
  MARS: 10,    // Capricorn
  MERCURY: 6,  // Virgo
  JUPITER: 4,  // Cancer
  VENUS: 12,   // Pisces
  SATURN: 7,   // Libra
};

const OWN_SIGNS = {
  SUN: [5],
  MOON: [4],
  MARS: [1, 8],
  MERCURY: [3, 6],
  JUPITER: [9, 12],
  VENUS: [2, 7],
  SATURN: [10, 11],
};

function safeParseJson(val) {
  if (val == null) return val;
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch { return val; }
  }
  return val;
}

function norm360(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return null;
  return ((n % 360) + 360) % 360;
}

function angularDistance(aLon, bLon) {
  const a = norm360(aLon);
  const b = norm360(bLon);
  if (a == null || b == null) return null;
  let d = Math.abs(a - b);
  if (d > 180) d = 360 - d;
  return d;
}

function conjWithin(aLon, bLon, orbDeg = 8) {
  const d = angularDistance(aLon, bLon);
  return d != null && d <= Number(orbDeg);
}

function normalizePlanetName(raw) {
  const s = String(raw || '').trim().toUpperCase();
  if (!s) return null;
  if (s === 'NORTH_NODE') return 'RAHU';
  if (s === 'SOUTH_NODE') return 'KETU';
  const t = s.replace(/[^A-Z]/g, '');
  if (PLANET_CANON.includes(t)) return t;
  return null;
}

function planetsByNameFromSnapshot(astroSnapshot) {
  const planetsRaw = safeParseJson(astroSnapshot?.planets_state ?? null);
  const arr = Array.isArray(planetsRaw) ? planetsRaw : [];
  const map = new Map();
  for (const p of arr) {
    const name = normalizePlanetName(p?.planet ?? p?.name ?? p?.id);
    if (!name) continue;
    const lon = Number(p?.degree ?? p?.longitude ?? p?.long ?? null);
    const sign = Number(p?.sign ?? null);
    const house = Number(p?.house ?? p?.h ?? null);
    map.set(name, {
      planet: name,
      longitude: Number.isFinite(lon) ? lon : null,
      sign: Number.isFinite(sign) ? sign : null,
      house: Number.isFinite(house) ? house : null,
    });
  }
  return map;
}

function ageYearsAt(birthUtc, isoYmd) {
  if (!(birthUtc instanceof Date) || Number.isNaN(birthUtc.getTime())) return null;
  const d = new Date(`${isoYmd}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return null;
  const days = (d.getTime() - birthUtc.getTime()) / DAY_MS;
  return Math.max(0, days / YEAR_DAYS);
}

function buildCurrentDashaContext(astroSnapshot) {
  const md = ENGINE_ID_TO_PLANET[Number(astroSnapshot?.running_mahadasha_planet)] || null;
  const ad = ENGINE_ID_TO_PLANET[Number(astroSnapshot?.running_antardasha_planet)] || null;
  const pd = ENGINE_ID_TO_PLANET[Number(astroSnapshot?.running_pratyantardasha_planet)] || null;
  const s = ENGINE_ID_TO_PLANET[Number(astroSnapshot?.running_sookshma_planet)] || null;
  return {
    mahadasha_planet: md,
    antardasha_planet: ad,
    pratyantardasha_planet: pd,
    sookshma_planet: s,
    sookshma_start: astroSnapshot?.running_sookshma_start ?? null,
    sookshma_end: astroSnapshot?.running_sookshma_end ?? null,
  };
}

function parseBirthDateTimeUtcFromSnapshotMetadata(astroSnapshot) {
  let houses = safeParseJson(astroSnapshot?.houses_state ?? null);
  const md = (houses && typeof houses === 'object' && houses._metadata && typeof houses._metadata === 'object')
    ? houses._metadata
    : null;
  if (!md) return null;

  const dtUtcRaw = md.birthDateTimeUtc ?? md.birth_datetime_utc ?? md.birthDateTimeUTC ?? null;
  if (dtUtcRaw) {
    const dt = new Date(String(dtUtcRaw));
    if (!Number.isNaN(dt.getTime())) return dt;
  }
  return null;
}

function buildActivationFromMahadasha({ birthUtc, moonLonSidereal, highlightPlanets = [] }) {
  if (!(birthUtc instanceof Date) || Number.isNaN(birthUtc.getTime())) return null;
  const moonLon = Number(moonLonSidereal);
  if (!Number.isFinite(moonLon)) return null;

  const mds = computeVimshottariMahadashaPeriods({
    birthDateTimeUtc: birthUtc,
    moonLongitudeSidereal: moonLon,
    minPeriods: 18,
  });

  const nowISO = new Date().toISOString().split('T')[0];
  const highlight = new Set(highlightPlanets.map(p => String(p || '').toUpperCase()));

  const periods = mds.map(p => ({
    planet: p.planet,
    from: p.from,
    to: p.to,
    from_age_years: ageYearsAt(birthUtc, p.from),
    to_age_years: ageYearsAt(birthUtc, p.to),
    is_current: p.from <= nowISO && nowISO <= p.to,
    is_highlight: highlight.has(p.planet),
  }));

  return { basis: 'vimshottari_mahadasha', periods };
}

function relFromSign(aSign, bSign) {
  const a = Number(aSign);
  const b = Number(bSign);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return ((b - a + 12) % 12) + 1; // 1..12
}

function isKendraPos(pos) {
  return pos === 1 || pos === 4 || pos === 7 || pos === 10;
}

function isTrineHouse(h) {
  return h === 1 || h === 5 || h === 9;
}

function signForHouseFromLagna(lagnaSign, houseNum) {
  const ls = Number(lagnaSign);
  const h = Number(houseNum);
  if (!Number.isFinite(ls) || !Number.isFinite(h)) return null;
  return ((ls - 1 + (h - 1)) % 12) + 1;
}

function getHouseLord(lagnaSign, houseNum) {
  const sign = signForHouseFromLagna(lagnaSign, houseNum);
  if (!sign) return null;
  return SIGN_LORD[sign] || null;
}

function ownsOrExalted(planet, sign) {
  const p = String(planet || '').toUpperCase();
  const s = Number(sign);
  if (!Number.isFinite(s)) return false;
  const own = Array.isArray(OWN_SIGNS[p]) ? OWN_SIGNS[p].includes(s) : false;
  const ex = EXALTATION_SIGN[p] ? EXALTATION_SIGN[p] === s : false;
  return own || ex;
}

function yogaStrengthPractices() {
  return [
    {
      type: 'routine',
      title: 'Consistency-first plan (30 days)',
      description: 'Pick one goal and follow a simple routine daily. Yogas strengthen with repetition more than intensity.',
      frequency: 'Daily',
      duration: '30 days',
      safety_notes: 'Keep it sustainable; avoid over-commitment.',
    },
    {
      type: 'service',
      title: 'Small weekly service act',
      description: 'Once a week, do a small act of service or charity. Keep it modest and consistent.',
      frequency: 'Weekly',
      duration: null,
      safety_notes: 'Do not donate beyond your means.',
    },
  ];
}

function computeGajakesari({ planetsByName }) {
  const moon = planetsByName.get('MOON');
  const jup = planetsByName.get('JUPITER');
  if (!moon?.sign || !jup?.sign) {
    return { code: 'GAJAKESARI_YOGA', name: 'Gajakesari Yoga', is_present: false, confidence: 0.2, reason: 'Moon/Jupiter sign missing.' };
  }
  const pos = relFromSign(moon.sign, jup.sign);
  const present = pos != null && isKendraPos(pos);
  return {
    code: 'GAJAKESARI_YOGA',
    name: 'Gajakesari Yoga',
    is_present: present,
    subtype_code: null,
    severity: !present ? null : 'moderate',
    confidence: present ? 0.75 : 0.2,
    definition: 'Gajakesari Yoga is commonly indicated when Jupiter is placed in a kendra (1st/4th/7th/10th) from the Moon.',
    effects_summary: 'When present, it often correlates with resilience, learning capacity, and support through guidance over time.',
    indicators: { moon_sign: moon.sign, jupiter_sign: jup.sign, jupiter_from_moon: pos },
    remedies: present ? yogaStrengthPractices() : [],
    related_planets_for_activation: ['MOON', 'JUPITER'],
  };
}

function computeBudhaditya({ planetsByName }) {
  const sun = planetsByName.get('SUN');
  const mer = planetsByName.get('MERCURY');
  if (!sun || !mer) {
    return { code: 'BUDHADITYA_YOGA', name: 'Budhaditya Yoga', is_present: false, confidence: 0.2, reason: 'Sun/Mercury missing.' };
  }
  const orb = (sun.longitude != null && mer.longitude != null) ? angularDistance(sun.longitude, mer.longitude) : null;
  const sameSign = sun.sign != null && mer.sign != null ? Number(sun.sign) === Number(mer.sign) : false;
  const present = (orb != null && orb <= 8) || sameSign;
  return {
    code: 'BUDHADITYA_YOGA',
    name: 'Budhaditya Yoga',
    is_present: present,
    subtype_code: orb != null && orb <= 8 ? 'CLOSE_CONJUNCTION' : sameSign ? 'SAME_SIGN' : null,
    severity: !present ? null : (orb != null && orb <= 5 ? 'strong' : 'moderate'),
    confidence: present ? 0.8 : 0.2,
    definition: 'Budhaditya Yoga is commonly discussed when Sun and Mercury are closely placed (often conjunct), supporting intellect and communication.',
    effects_summary: 'When present, it may support clarity, learning, and better decision articulation—especially with consistent discipline.',
    indicators: { sun_sign: sun.sign, mercury_sign: mer.sign, sun_mercury_orb_deg: orb },
    remedies: present ? yogaStrengthPractices() : [],
    related_planets_for_activation: ['SUN', 'MERCURY'],
  };
}

function computeChandraMangal({ planetsByName }) {
  const moon = planetsByName.get('MOON');
  const mars = planetsByName.get('MARS');
  if (!moon || !mars) {
    return { code: 'CHANDRA_MANGAL_YOGA', name: 'Chandra–Mangal Yoga', is_present: false, confidence: 0.2, reason: 'Moon/Mars missing.' };
  }
  const orb = (moon.longitude != null && mars.longitude != null) ? angularDistance(moon.longitude, mars.longitude) : null;
  const sameSign = moon.sign != null && mars.sign != null ? Number(moon.sign) === Number(mars.sign) : false;
  const present = (orb != null && orb <= 8) || sameSign;
  return {
    code: 'CHANDRA_MANGAL_YOGA',
    name: 'Chandra–Mangal Yoga',
    is_present: present,
    subtype_code: orb != null && orb <= 8 ? 'CLOSE_CONJUNCTION' : sameSign ? 'SAME_SIGN' : null,
    severity: !present ? null : 'moderate',
    confidence: present ? 0.75 : 0.2,
    definition: 'Chandra–Mangal Yoga is commonly indicated when Moon and Mars are closely placed, linking drive with emotional momentum.',
    effects_summary: 'When present, it may support decisive action and financial drive, but benefits most from emotional steadiness and clean routines.',
    indicators: { moon_sign: moon.sign, mars_sign: mars.sign, moon_mars_orb_deg: orb },
    remedies: present ? yogaStrengthPractices() : [],
    related_planets_for_activation: ['MOON', 'MARS'],
  };
}

function computePanchMahapurush({ planetsByName, lagna_sign }) {
  const out = [];
  const kendraHouses = new Set([1, 4, 7, 10]);
  const mapping = [
    { planet: 'MARS', code: 'RUCHAKA_YOGA', name: 'Ruchaka Yoga (Panch Mahapurush)' },
    { planet: 'MERCURY', code: 'BHADRA_YOGA', name: 'Bhadra Yoga (Panch Mahapurush)' },
    { planet: 'JUPITER', code: 'HAMSA_YOGA', name: 'Hamsa Yoga (Panch Mahapurush)' },
    { planet: 'VENUS', code: 'MALAVYA_YOGA', name: 'Malavya Yoga (Panch Mahapurush)' },
    { planet: 'SATURN', code: 'SHASHA_YOGA', name: 'Shasha Yoga (Panch Mahapurush)' },
  ];

  for (const m of mapping) {
    const p = planetsByName.get(m.planet);
    const h = Number(p?.house ?? null);
    const s = Number(p?.sign ?? null);
    const inKendra = Number.isFinite(h) && kendraHouses.has(h);
    const dignity = ownsOrExalted(m.planet, s);
    const present = Boolean(inKendra && dignity);
    out.push({
      code: m.code,
      name: m.name,
      is_present: present,
      subtype_code: dignity ? 'DIGNIFIED' : null,
      severity: !present ? null : 'strong',
      confidence: present ? 0.8 : 0.2,
      definition: 'Panch Mahapurush yogas are classically indicated when a key planet is in a kendra and strongly dignified (own sign or exaltation).',
      effects_summary: present
        ? 'When present, it may strongly support competence and results in the planet’s domain—especially with discipline and responsibility.'
        : 'Not detected by the current rule set.',
      indicators: {
        planet: m.planet,
        planet_house: Number.isFinite(h) ? h : null,
        planet_sign: Number.isFinite(s) ? s : null,
        in_kendra: inKendra,
        own_or_exalted: dignity,
      },
      remedies: present ? yogaStrengthPractices() : [],
      related_planets_for_activation: [m.planet],
    });
  }
  return out;
}

function computeAdhiYoga({ planetsByName }) {
  const moon = planetsByName.get('MOON');
  if (!moon?.sign) {
    return { code: 'ADHI_YOGA', name: 'Adhi Yoga', is_present: false, confidence: 0.2, reason: 'Moon sign missing.' };
  }
  const benefics = ['JUPITER', 'VENUS', 'MERCURY'];
  const hits = [];
  for (const b of benefics) {
    const p = planetsByName.get(b);
    if (!p?.sign) continue;
    const pos = relFromSign(moon.sign, p.sign);
    if (pos === 6 || pos === 7 || pos === 8) hits.push(b);
  }
  const present = hits.length >= 2; // moderate threshold
  const severity = !present ? null : (hits.length === 3 ? 'strong' : 'moderate');
  return {
    code: 'ADHI_YOGA',
    name: 'Adhi Yoga',
    is_present: present,
    subtype_code: hits.length ? `BENEFICS_${hits.length}` : null,
    severity,
    confidence: present ? 0.7 : 0.2,
    definition: 'Adhi Yoga is commonly assessed when benefic planets occupy the 6th/7th/8th positions from the Moon.',
    effects_summary: present
      ? 'When present, it may support practical resilience and stability under pressure, especially when routine stays consistent.'
      : 'Not detected by the current rule set.',
    indicators: { moon_sign: moon.sign, benefics_in_6_7_8_from_moon: hits },
    remedies: present ? yogaStrengthPractices() : [],
    related_planets_for_activation: ['MOON', ...hits],
  };
}

function computeDharmaKarmadhipati({ planetsByName, lagna_sign }) {
  const lagna = Number(lagna_sign);
  if (!Number.isFinite(lagna)) {
    return { code: 'DHARMA_KARMADHIPATI_YOGA', name: 'Dharma–Karmadhipati Yoga (Simplified)', is_present: false, confidence: 0.2, reason: 'Lagna sign missing.' };
  }
  const lord9 = getHouseLord(lagna, 9);
  const lord10 = getHouseLord(lagna, 10);
  if (!lord9 || !lord10) {
    return { code: 'DHARMA_KARMADHIPATI_YOGA', name: 'Dharma–Karmadhipati Yoga (Simplified)', is_present: false, confidence: 0.2, reason: 'Unable to compute 9th/10th lords.' };
  }
  const p9 = planetsByName.get(lord9);
  const p10 = planetsByName.get(lord10);
  const sameHouse = p9?.house != null && p10?.house != null ? Number(p9.house) === Number(p10.house) : false;
  const sameSign = p9?.sign != null && p10?.sign != null ? Number(p9.sign) === Number(p10.sign) : false;
  const present = sameHouse || sameSign;
  return {
    code: 'DHARMA_KARMADHIPATI_YOGA',
    name: 'Dharma–Karmadhipati Yoga (Simplified)',
    is_present: present,
    subtype_code: sameHouse ? 'SAME_HOUSE' : sameSign ? 'SAME_SIGN' : null,
    severity: !present ? null : 'moderate',
    confidence: present ? 0.65 : 0.2,
    definition: 'This yoga is often discussed when the 9th-house lord (dharma) and 10th-house lord (karma/career) are strongly connected. This implementation uses a conservative “same sign/house” association.',
    effects_summary: present
      ? 'When present, it may support alignment between purpose and work direction, improving with consistent effort and clean choices.'
      : 'Not detected by the current conservative association rule.',
    indicators: {
      lagna_sign: lagna,
      lord_9: lord9,
      lord_10: lord10,
      lord9_house: p9?.house ?? null,
      lord10_house: p10?.house ?? null,
      lord9_sign: p9?.sign ?? null,
      lord10_sign: p10?.sign ?? null,
    },
    remedies: present ? yogaStrengthPractices() : [],
    related_planets_for_activation: [lord9, lord10],
  };
}

function computeDhanaYogas({ planetsByName, lagna_sign }) {
  const lagna = Number(lagna_sign);
  if (!Number.isFinite(lagna)) {
    return [
      {
        code: 'DHANA_YOGA',
        name: 'Dhana Yoga (Wealth Potential, Simplified)',
        is_present: false,
        confidence: 0.2,
        reason: 'Lagna sign missing.',
      },
    ];
  }

  const lord2 = getHouseLord(lagna, 2);
  const lord11 = getHouseLord(lagna, 11);
  const lord1 = getHouseLord(lagna, 1);
  const lord9 = getHouseLord(lagna, 9);
  const lord5 = getHouseLord(lagna, 5);

  const p2 = lord2 ? planetsByName.get(lord2) : null;
  const p11 = lord11 ? planetsByName.get(lord11) : null;
  const p1 = lord1 ? planetsByName.get(lord1) : null;
  const p9 = lord9 ? planetsByName.get(lord9) : null;
  const p5 = lord5 ? planetsByName.get(lord5) : null;

  function assoc(pa, pb) {
    if (!pa || !pb) return { sameHouse: false, sameSign: false };
    const sameHouse = pa.house != null && pb.house != null ? Number(pa.house) === Number(pb.house) : false;
    const sameSign = pa.sign != null && pb.sign != null ? Number(pa.sign) === Number(pb.sign) : false;
    return { sameHouse, sameSign };
  }

  const a2_11 = assoc(p2, p11);
  const a1_2 = assoc(p1, p2);
  const a1_11 = assoc(p1, p11);
  const a9_2 = assoc(p9, p2);
  const a9_11 = assoc(p9, p11);
  const a5_2 = assoc(p5, p2);
  const a5_11 = assoc(p5, p11);

  // Conservative scoring: only count same-house or same-sign associations.
  const hits = [
    { key: '2_11', label: '2nd lord linked with 11th lord', assoc: a2_11, planets: [lord2, lord11] },
    { key: '1_2', label: '1st lord linked with 2nd lord', assoc: a1_2, planets: [lord1, lord2] },
    { key: '1_11', label: '1st lord linked with 11th lord', assoc: a1_11, planets: [lord1, lord11] },
    { key: '9_2', label: '9th lord linked with 2nd lord', assoc: a9_2, planets: [lord9, lord2] },
    { key: '9_11', label: '9th lord linked with 11th lord', assoc: a9_11, planets: [lord9, lord11] },
    { key: '5_2', label: '5th lord linked with 2nd lord', assoc: a5_2, planets: [lord5, lord2] },
    { key: '5_11', label: '5th lord linked with 11th lord', assoc: a5_11, planets: [lord5, lord11] },
  ].filter(h => h.planets.every(Boolean));

  const satisfied = hits.filter(h => h.assoc.sameHouse || h.assoc.sameSign);
  const present = satisfied.length > 0;

  // Strength add-on: if 2nd/11th lord is dignified (own/exalted), bump confidence.
  const dign2 = p2?.sign != null ? ownsOrExalted(lord2, p2.sign) : false;
  const dign11 = p11?.sign != null ? ownsOrExalted(lord11, p11.sign) : false;

  const baseConf = present ? 0.55 + 0.08 * Math.min(4, satisfied.length) : 0.2;
  const conf = present ? Math.min(0.85, baseConf + (dign2 ? 0.05 : 0) + (dign11 ? 0.05 : 0)) : 0.2;
  const severity = !present ? null : satisfied.length >= 3 ? 'strong' : satisfied.length >= 2 ? 'moderate' : 'mild';

  const indicators = {
    lagna_sign: lagna,
    lord_1: lord1,
    lord_2: lord2,
    lord_11: lord11,
    lord_5: lord5,
    lord_9: lord9,
    lords_positions: {
      lord1: { sign: p1?.sign ?? null, house: p1?.house ?? null },
      lord2: { sign: p2?.sign ?? null, house: p2?.house ?? null, dignified: dign2 },
      lord11: { sign: p11?.sign ?? null, house: p11?.house ?? null, dignified: dign11 },
      lord5: { sign: p5?.sign ?? null, house: p5?.house ?? null },
      lord9: { sign: p9?.sign ?? null, house: p9?.house ?? null },
    },
    satisfied_links: satisfied.map(s => ({
      key: s.key,
      label: s.label,
      same_house: s.assoc.sameHouse,
      same_sign: s.assoc.sameSign,
    })),
    rule_variant: 'lord_association_same_sign_or_house',
  };

  const related = [...new Set(satisfied.flatMap(s => s.planets).filter(Boolean).map(p => String(p).toUpperCase()))];

  return [
    {
      code: 'DHANA_YOGA',
      name: 'Dhana Yoga (Wealth Potential, Simplified)',
      is_present: present,
      subtype_code: satisfied.length ? `LINKS_${satisfied.length}` : null,
      severity,
      confidence: conf,
      definition:
        'Dhana Yogas are traditionally derived from connections between wealth houses (2nd/11th) and key lords. Definitions vary widely; this implementation uses a conservative “lord association” rule (same sign or same house).',
      effects_summary:
        present
          ? 'When present, it may support income/gains potential, especially when combined with disciplined planning and consistent effort. Outcomes still depend on timing and choices.'
          : 'No conservative wealth-lord association was detected by this rule set.',
      indicators,
      remedies: present ? [
        {
          type: 'routine',
          title: 'Savings discipline (8 weeks)',
          description: 'Pick one simple savings rule for 8 weeks (e.g., fixed % auto-save or weekly expense cap). Wealth patterns improve through consistency.',
          frequency: 'Weekly review',
          duration: '8 weeks',
          safety_notes: 'Do not follow financially risky advice. Keep it realistic.',
        },
        {
          type: 'learning',
          title: 'Practical skill investment (weekly)',
          description: 'Spend 60 minutes weekly improving one income-linked skill. The best “yoga” is disciplined compounding.',
          frequency: 'Weekly',
          duration: '12 weeks',
          safety_notes: 'Focus on one skill path; avoid scattered effort.',
        },
      ] : [],
      related_planets_for_activation: related,
    },
  ];
}

function computeLakshmiYoga({ planetsByName, lagna_sign }) {
  const lagna = Number(lagna_sign);
  if (!Number.isFinite(lagna)) {
    return { code: 'LAKSHMI_YOGA', name: 'Lakshmi Yoga (Simplified)', is_present: false, confidence: 0.2, reason: 'Lagna sign missing.' };
  }
  const lord9 = getHouseLord(lagna, 9);
  const lord1 = getHouseLord(lagna, 1);
  if (!lord9 || !lord1) {
    return { code: 'LAKSHMI_YOGA', name: 'Lakshmi Yoga (Simplified)', is_present: false, confidence: 0.2, reason: 'Unable to compute 1st/9th lords.' };
  }
  const p9 = planetsByName.get(lord9);
  const p1 = planetsByName.get(lord1);
  const p9Strong = p9?.sign != null ? ownsOrExalted(lord9, p9.sign) : false;
  const p1Strong = p1?.sign != null ? ownsOrExalted(lord1, p1.sign) : false;
  const p9House = Number(p9?.house ?? null);
  const p9InTrineOrKendra = Number.isFinite(p9House) ? (isTrineHouse(p9House) || [4,7,10].includes(p9House)) : false;
  const present = Boolean(p9Strong && p9InTrineOrKendra && p1Strong);
  return {
    code: 'LAKSHMI_YOGA',
    name: 'Lakshmi Yoga (Simplified)',
    is_present: present,
    subtype_code: present ? 'DIGNIFIED_LORDS' : null,
    severity: !present ? null : 'moderate',
    confidence: present ? 0.7 : 0.2,
    definition:
      'Lakshmi Yoga is classically defined with strong 9th lord and strong ascendant lord. Traditions vary; this implementation uses a conservative dignity + placement check.',
    effects_summary:
      present
        ? 'When present, it may support fortune through consistent ethical choices, mentors, and long-term responsibility.'
        : 'Not detected by the current conservative rule set.',
    indicators: {
      lagna_sign: lagna,
      lord_1: lord1,
      lord_9: lord9,
      lord1_sign: p1?.sign ?? null,
      lord1_dignified: p1Strong,
      lord9_sign: p9?.sign ?? null,
      lord9_house: p9?.house ?? null,
      lord9_dignified: p9Strong,
      lord9_in_trine_or_kendra: p9InTrineOrKendra,
      rule_variant: 'lord9_dignified_and_well_placed_and_lagna_lord_dignified',
    },
    remedies: present ? yogaStrengthPractices() : [],
    related_planets_for_activation: [lord1, lord9].filter(Boolean),
  };
}

export async function generateYogaReport(windowId) {
  if (!windowId || Number.isNaN(Number(windowId))) throw new Error('WINDOW_ID missing or invalid');
  const windowIdNum = Number(windowId);

  const astroRes = await query('SELECT * FROM astro_state_snapshots WHERE window_id = $1', [windowIdNum]);
  if (astroRes.rowCount === 0) throw new Error(`Astro snapshot not found for window_id=${windowId}`);
  const astro = astroRes.rows[0];

  const planetsByName = planetsByNameFromSnapshot(astro);
  const birthUtc = parseBirthDateTimeUtcFromSnapshotMetadata(astro);
  const moon = planetsByName.get('MOON');
  const moonLonSidereal = moon?.longitude ?? null;

  const dashaContext = buildCurrentDashaContext(astro);

  const yogas = [];
  yogas.push(computeGajakesari({ planetsByName }));
  yogas.push(computeBudhaditya({ planetsByName }));
  yogas.push(computeChandraMangal({ planetsByName }));
  yogas.push(computeAdhiYoga({ planetsByName }));
  yogas.push(computeDharmaKarmadhipati({ planetsByName, lagna_sign: astro?.lagna_sign }));
  yogas.push(...computeDhanaYogas({ planetsByName, lagna_sign: astro?.lagna_sign }));
  yogas.push(computeLakshmiYoga({ planetsByName, lagna_sign: astro?.lagna_sign }));
  yogas.push(...computePanchMahapurush({ planetsByName, lagna_sign: astro?.lagna_sign }));

  // Activation highlight planets = union of related planets for present yogas
  const highlightPlanets = yogas
    .filter(y => y && y.is_present === true && Array.isArray(y.related_planets_for_activation))
    .flatMap(y => y.related_planets_for_activation)
    .filter(Boolean);

  const activation = buildActivationFromMahadasha({
    birthUtc,
    moonLonSidereal,
    highlightPlanets: [...new Set(highlightPlanets.map(p => String(p).toUpperCase()))],
  });

  return {
    ok: true,
    meta: {
      window_id: String(windowId),
      generated_at: new Date().toISOString(),
      birth_datetime_utc: birthUtc ? birthUtc.toISOString() : null,
      dasha_context: dashaContext,
      raw_yogas_state: safeParseJson(astro?.yogas_state ?? null) ?? [],
    },
    yogas,
    activation,
    notes: [
      'Yoga definitions vary across traditions; this report uses explicit rules and shows indicators for transparency.',
      'Yogas are typically supportive patterns; strengthening practices are provided as optional guidance.',
    ],
  };
}


