/**
 * Dosha Report Generation (Phase-Dosha v1)
 *
 * Computes commonly requested doshas from a single birth chart snapshot.
 *
 * Notes:
 * - Output text is English-only (API + any DB-bound text must remain English).
 * - Some doshas (e.g., Nadi dosha) require partner chart; those will be marked as "requires_additional_input".
 * - "Activation" periods are approximated using Vimshottari Mahadasha periods (and the current MD/AD/PD already stored).
 */

import { query } from '../../config/db.js';
import { computeVimshottariMahadashaPeriods, computeVimshottariSubPeriods } from './vimshottariDasha.js';

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

function safeParseJson(val) {
  if (val == null) return val;
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch { return val; }
  }
  return val;
}

function clamp01(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function norm360(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return null;
  return ((n % 360) + 360) % 360;
}

function normalizePlanetName(raw) {
  const s = String(raw || '').trim().toUpperCase();
  if (!s) return null;
  if (s === 'NORTH_NODE') return 'RAHU';
  if (s === 'SOUTH_NODE') return 'KETU';
  if (s === 'R' || s === 'RAH') return 'RAHU';
  if (s === 'K' || s === 'KET') return 'KETU';
  // Common variants from Swiss + client
  if (s === 'SUN') return 'SUN';
  if (s === 'MOON') return 'MOON';
  if (s === 'MARS') return 'MARS';
  if (s === 'MERCURY') return 'MERCURY';
  if (s === 'JUPITER') return 'JUPITER';
  if (s === 'VENUS') return 'VENUS';
  if (s === 'SATURN') return 'SATURN';
  if (s === 'RAHU') return 'RAHU';
  if (s === 'KETU') return 'KETU';
  // Client sometimes uses TitleCase
  const t = s.replace(/[^A-Z]/g, '');
  if (PLANET_CANON.includes(t)) return t;
  return null;
}

function parseBirthDateTimeUtcFromMetadata(metadata) {
  if (!metadata || typeof metadata !== 'object') return null;
  const dtUtcRaw = metadata.birthDateTimeUtc ?? metadata.birth_datetime_utc ?? metadata.birthDateTimeUTC ?? null;
  if (dtUtcRaw) {
    const dt = new Date(String(dtUtcRaw));
    if (!Number.isNaN(dt.getTime())) return dt;
  }
  const birthDateRaw = metadata.birthDate ?? metadata.birth_date ?? null;
  if (!birthDateRaw || typeof birthDateRaw !== 'string') return null;
  const birthDate = birthDateRaw.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) return null;
  const birthTimeRaw = metadata.birthTime ?? metadata.birth_time ?? '00:00:00';
  const birthTime = String(birthTimeRaw || '00:00:00').trim();
  const m = birthTime.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!m) return null;
  const hh = Number(m[1]);
  const mm = Number(m[2]);
  const ss = Number(m[3] ?? 0);
  if (![hh, mm, ss].every(Number.isFinite)) return null;
  const offsetMinRaw = metadata.timezoneOffsetMinutes ?? metadata.tzOffsetMinutes ?? metadata.tz_offset_minutes ?? 330;
  const offsetMinutes = Number(offsetMinRaw);
  if (!Number.isFinite(offsetMinutes)) return null;
  const [Y, Mo, D] = birthDate.split('-').map(Number);
  const localAsUtc = Date.UTC(Y, Mo - 1, D, hh, mm, ss);
  const utcMs = localAsUtc - offsetMinutes * 60 * 1000;
  const dt = new Date(utcMs);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function extractMetadataFromSnapshot(astroSnapshot) {
  let houses = astroSnapshot?.houses_state ?? null;
  houses = safeParseJson(houses);
  const md = (houses && typeof houses === 'object' && houses._metadata && typeof houses._metadata === 'object')
    ? houses._metadata
    : null;
  return md;
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

  return {
    basis: 'vimshottari_mahadasha',
    periods,
  };
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

function isBetweenArc(startLon, endLon, xLon) {
  const s = norm360(startLon);
  const e = norm360(endLon);
  const x = norm360(xLon);
  if (s == null || e == null || x == null) return false;
  // Check if x is within arc from s -> e moving forward (inclusive)
  if (s <= e) return s <= x && x <= e;
  // Wrap-around
  return x >= s || x <= e;
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

function computeNadiGroupFromNakshatra(nakId) {
  const n = Number(nakId);
  if (!Number.isFinite(n) || n < 1 || n > 27) return null;
  // Standard Ashtakoota grouping repeats every 3 nakshatras:
  // 1=Aadi, 2=Madhya, 0=Antya (when using mod 3).
  const r = n % 3;
  if (r === 1) return 'AADI';
  if (r === 2) return 'MADHYA';
  return 'ANTYA';
}

function computeNadiProfile({ astroSnapshot, planetsByName }) {
  const moon = planetsByName.get('MOON');
  const moonNak = Number(astroSnapshot?.moon_nakshatra ?? null);
  const nadi = computeNadiGroupFromNakshatra(moonNak);
  const ok = Boolean(nadi);
  return {
    code: 'NADI_PROFILE',
    name: 'Nadi Profile (from Moon Nakshatra)',
    is_present: ok ? true : false, // this is not a "dosha"; it is a profile used for compatibility
    confidence: ok ? 0.9 : 0,
    requires_additional_input: false,
    definition:
      'Nadi is an Ashtakoota compatibility factor derived from the Moon nakshatra. It is used primarily for partner matching (Nadi Dosha check).',
    effects_summary:
      'This is a profile marker, not a problem by itself. It becomes relevant when comparing with a partner chart.',
    indicators: {
      moon_nakshatra_id: Number.isFinite(moonNak) ? moonNak : null,
      nadi_group: nadi,
    },
    remedies: [],
    related_planets_for_activation: [],
  };
}

function computeNadiDoshaPlaceholder({ userNadiGroup }) {
  return {
    code: 'NADI_DOSHA',
    name: 'Nadi Dosha (Ashtakoota Compatibility)',
    is_present: null,
    confidence: 0,
    requires_additional_input: true,
    required_inputs: ['partner_birth_chart'],
    note:
      'Nadi Dosha is a partner-compatibility check. Provide partner birth chart details to compute it. Your Nadi group is included below for reference.',
    indicators: {
      user_nadi_group: userNadiGroup || null,
    },
  };
}

function computeGrahan({ planetsByName }) {
  const sun = planetsByName.get('SUN');
  const moon = planetsByName.get('MOON');
  const rahu = planetsByName.get('RAHU');
  const ketu = planetsByName.get('KETU');

  const solar = sun?.longitude != null && (conjWithin(sun.longitude, rahu?.longitude, 8) || conjWithin(sun.longitude, ketu?.longitude, 8));
  const lunar = moon?.longitude != null && (conjWithin(moon.longitude, rahu?.longitude, 8) || conjWithin(moon.longitude, ketu?.longitude, 8));

  const present = Boolean(solar || lunar);
  const subtype = solar && lunar ? 'SOLAR_AND_LUNAR' : solar ? 'SOLAR' : lunar ? 'LUNAR' : null;

  const indicators = {
    solar: solar || false,
    lunar: lunar || false,
    sun_rahu_orb_deg: sun?.longitude != null && rahu?.longitude != null ? angularDistance(sun.longitude, rahu.longitude) : null,
    sun_ketu_orb_deg: sun?.longitude != null && ketu?.longitude != null ? angularDistance(sun.longitude, ketu.longitude) : null,
    moon_rahu_orb_deg: moon?.longitude != null && rahu?.longitude != null ? angularDistance(moon.longitude, rahu.longitude) : null,
    moon_ketu_orb_deg: moon?.longitude != null && ketu?.longitude != null ? angularDistance(moon.longitude, ketu.longitude) : null,
  };

  return {
    code: 'GRAHAN_DOSHA',
    name: 'Grahan Dosha (Node Conjunction)',
    is_present: present,
    subtype_code: subtype,
    severity: !present ? null : (subtype === 'SOLAR_AND_LUNAR' ? 'strong' : 'moderate'),
    confidence: present ? 0.75 : 0.2,
    requires_additional_input: false,
    definition:
      'Grahan Dosha is commonly indicated when Sun or Moon is closely conjunct Rahu or Ketu (node conjunction).',
    effects_summary:
      'When present, it may correlate with stronger identity/emotional swings or periods of confusion, especially during Rahu/Ketu or Sun/Moon dashas.',
    indicators,
    remedies: present ? [
      {
        type: 'meditation',
        title: 'Mind steadiness routine (10 minutes)',
        description: 'Daily 10 minutes of slow breathing or body-scan. Focus is reducing reactivity and mental loops.',
        frequency: 'Daily',
        duration: '21 days',
        safety_notes: 'If anxiety/depression is present, consider professional help alongside spiritual practice.',
      },
    ] : [],
    related_planets_for_activation: ['RAHU', 'KETU', 'SUN', 'MOON'],
  };
}

function computeShrapit({ planetsByName }) {
  const saturn = planetsByName.get('SATURN');
  const rahu = planetsByName.get('RAHU');
  if (!saturn?.longitude || !rahu?.longitude) {
    return {
      code: 'SHRAPIT_DOSHA',
      name: 'Shrapit Dosha (Saturn–Rahu Conjunction)',
      is_present: false,
      confidence: 0.2,
      requires_additional_input: false,
      reason: 'Saturn/Rahu longitude missing.',
    };
  }
  const orb = angularDistance(saturn.longitude, rahu.longitude);
  const present = orb != null && orb <= 8;
  return {
    code: 'SHRAPIT_DOSHA',
    name: 'Shrapit Dosha (Saturn–Rahu Conjunction)',
    is_present: present,
    subtype_code: null,
    severity: !present ? null : 'moderate',
    confidence: present ? 0.7 : 0.2,
    requires_additional_input: false,
    definition:
      'Shrapit Dosha is commonly discussed when Saturn is closely conjunct Rahu, indicating heavier karmic/pressure themes in certain traditions.',
    effects_summary:
      'When present, it may correlate with longer effort cycles, delays, and a need for disciplined choices, especially during Saturn/Rahu periods.',
    indicators: { saturn_rahu_orb_deg: orb, saturn_house: saturn.house ?? null, rahu_house: rahu.house ?? null },
    remedies: present ? [
      {
        type: 'routine',
        title: 'Consistency-first month',
        description: 'Commit to one simple discipline for 30 days: sleep timing, a daily walk, or a single work routine. Consistency reduces heaviness.',
        frequency: 'Daily',
        duration: '30 days',
        safety_notes: 'Avoid extreme rituals; focus on sustainable habits.',
      },
    ] : [],
    related_planets_for_activation: ['SATURN', 'RAHU'],
  };
}

function computeGuruChandal({ planetsByName }) {
  const jupiter = planetsByName.get('JUPITER');
  const rahu = planetsByName.get('RAHU');
  const ketu = planetsByName.get('KETU');
  if (!jupiter?.longitude) {
    return {
      code: 'GURU_CHANDAL_DOSHA',
      name: 'Guru Chandal Dosha (Jupiter–Node Conjunction)',
      is_present: false,
      confidence: 0.2,
      requires_additional_input: false,
      reason: 'Jupiter longitude missing.',
    };
  }
  const orbR = rahu?.longitude != null ? angularDistance(jupiter.longitude, rahu.longitude) : null;
  const orbK = ketu?.longitude != null ? angularDistance(jupiter.longitude, ketu.longitude) : null;
  const present = (orbR != null && orbR <= 8) || (orbK != null && orbK <= 8);
  return {
    code: 'GURU_CHANDAL_DOSHA',
    name: 'Guru Chandal Dosha (Jupiter–Node Conjunction)',
    is_present: present,
    subtype_code: orbR != null && orbR <= 8 ? 'JUPITER_RAHU' : orbK != null && orbK <= 8 ? 'JUPITER_KETU' : null,
    severity: !present ? null : 'moderate',
    confidence: present ? 0.7 : 0.2,
    requires_additional_input: false,
    definition:
      'Guru Chandal Dosha is commonly discussed when Jupiter is closely conjunct Rahu or Ketu, indicating belief/ethics learning cycles in certain traditions.',
    effects_summary:
      'When present, it may correlate with confusion around guidance, mentors, or ideology—improving when you keep learning grounded and practical.',
    indicators: { jupiter_rahu_orb_deg: orbR, jupiter_ketu_orb_deg: orbK },
    remedies: present ? [
      {
        type: 'learning',
        title: 'Grounded study routine (weekly)',
        description: 'Once a week, spend 30 minutes studying one practical topic (health/finance/skill) and applying one action step. This stabilizes belief-driven swings.',
        frequency: 'Weekly',
        duration: '8 weeks',
        safety_notes: 'Avoid blind trust; verify sources and keep decisions practical.',
      },
    ] : [],
    related_planets_for_activation: ['JUPITER', 'RAHU', 'KETU'],
  };
}

function computeKemadruma({ planetsByName, moon_sign }) {
  const moon = planetsByName.get('MOON');
  const ms = Number(moon_sign ?? moon?.sign ?? null);
  if (!Number.isFinite(ms)) {
    return {
      code: 'KEMADRUMA_DOSHA',
      name: 'Kemadruma Dosha (Moon Support Check)',
      is_present: false,
      confidence: 0.2,
      requires_additional_input: false,
      reason: 'Moon sign missing.',
    };
  }
  const sign2 = ((ms - 1 + 1) % 12) + 1; // next sign
  const sign12 = ((ms - 1 - 1 + 12) % 12) + 1; // prev sign

  // Conservative variant: check if ANY of the classical planets (excluding Sun, Rahu, Ketu) are in 2nd/12th from Moon.
  const supportPlanets = ['MARS','MERCURY','JUPITER','VENUS','SATURN'];
  const hasSupport = supportPlanets.some(pn => {
    const p = planetsByName.get(pn);
    const s = Number(p?.sign ?? null);
    return Number.isFinite(s) && (s === sign2 || s === sign12);
  });

  const present = !hasSupport;
  return {
    code: 'KEMADRUMA_DOSHA',
    name: 'Kemadruma Dosha (Moon Support Check)',
    is_present: present,
    subtype_code: present ? 'ADJACENT_SIGNS_EMPTY' : null,
    severity: !present ? null : 'mild',
    confidence: present ? 0.55 : 0.2,
    requires_additional_input: false,
    definition:
      'Kemadruma is traditionally evaluated from the Moon by checking supportive planetary presence in the 2nd and 12th positions from the Moon. Rules vary by tradition; this uses a conservative sign-based variant.',
    effects_summary:
      'When present, it may correlate with periodic emotional isolation or self-driven coping. It improves with stable routines and social support hygiene.',
    indicators: {
      moon_sign: ms,
      sign_2nd_from_moon: sign2,
      sign_12th_from_moon: sign12,
      support_planets_checked: supportPlanets,
      has_support_in_adjacent_signs: hasSupport,
      rule_variant: 'sign_adjacent_empty_excluding_sun_nodes',
    },
    remedies: present ? [
      {
        type: 'routine',
        title: 'Stable routine + sleep protection',
        description: 'Keep sleep timing stable and add one daily grounding habit (walk, breathing, journaling). This reduces emotional drift patterns.',
        frequency: 'Daily',
        duration: '30 days',
        safety_notes: 'If mood symptoms are severe, seek professional care.',
      },
    ] : [],
    related_planets_for_activation: ['MOON'],
  };
}

function computeKaalSarp({ planetsByName }) {
  const rahu = planetsByName.get('RAHU');
  const ketu = planetsByName.get('KETU');
  if (!rahu || !ketu || rahu.longitude == null || ketu.longitude == null) {
    return {
      code: 'KAAL_SARP_YOGA',
      name: 'Kaal Sarp Yoga',
      is_present: false,
      confidence: 0,
      requires_additional_input: false,
      reason: 'Rahu/Ketu longitude missing.',
    };
  }

  const classicalPlanets = ['SUN','MOON','MARS','MERCURY','JUPITER','VENUS','SATURN'];
  const longitudes = [];
  for (const pn of classicalPlanets) {
    const p = planetsByName.get(pn);
    if (!p || p.longitude == null) {
      return {
        code: 'KAAL_SARP_YOGA',
        name: 'Kaal Sarp Yoga',
        is_present: false,
        confidence: 0,
        requires_additional_input: false,
        reason: `Missing planet longitude: ${pn}.`,
      };
    }
    longitudes.push({ planet: pn, lon: p.longitude });
  }

  const inRahuToKetu = longitudes.every(p => isBetweenArc(rahu.longitude, ketu.longitude, p.lon));
  const inKetuToRahu = longitudes.every(p => isBetweenArc(ketu.longitude, rahu.longitude, p.lon));
  const present = inRahuToKetu || inKetuToRahu;

  // Severity heuristic: more planets close to Rahu/Ketu => stronger felt intensity.
  const closeCount = longitudes.reduce((acc, p) => {
    const dR = angularDistance(p.lon, rahu.longitude);
    const dK = angularDistance(p.lon, ketu.longitude);
    const close = (dR != null && dR <= 8) || (dK != null && dK <= 8);
    return acc + (close ? 1 : 0);
  }, 0);
  const severity = !present ? null : closeCount >= 3 ? 'strong' : closeCount >= 1 ? 'moderate' : 'mild';

  // Subtype by Rahu house (traditional mapping); requires house values.
  const rahuHouse = Number.isFinite(Number(rahu.house)) ? Number(rahu.house) : null;
  const subtypeMap = {
    1: 'ANANT',
    2: 'KULIK',
    3: 'VASUKI',
    4: 'SHANKHPAL',
    5: 'PADMA',
    6: 'MAHAPADMA',
    7: 'TAKSHAK',
    8: 'KARKOTAK',
    9: 'SHANKHACHOOD',
    10: 'GHATAK',
    11: 'VISHDHAR',
    12: 'SHESHNAG',
  };
  const subtype_code = present && rahuHouse ? (subtypeMap[rahuHouse] || null) : null;

  const definition =
    'Kaal Sarp Yoga is commonly defined when all seven classical planets lie on one side of the Rahu–Ketu axis. It is treated as a life-pattern indicator rather than a single-event promise.';

  const effects =
    'When present, it may correlate with delayed stability, repeated effort before results, and stronger highs/lows during Rahu or Ketu periods. The impact is usually felt more during node-related dashas.';

  const remedies = present ? [
    {
      type: 'mantra',
      title: 'Rahu–Ketu calming practice (daily)',
      description: 'Spend 10 minutes daily on calm breath-counting, followed by a short prayer/chant in your tradition. The goal is steadiness and reduced reactivity.',
      frequency: 'Daily',
      duration: '40 days',
      safety_notes: 'Keep it simple and consistent. Avoid extreme rituals or expensive commitments.',
    },
    {
      type: 'donation',
      title: 'Simple charity on Saturdays',
      description: 'Donate a small amount of food or essentials to someone in need on Saturday. Keep it modest and consistent.',
      frequency: 'Weekly (Saturday)',
      duration: null,
      safety_notes: 'Charity should be affordable and sustainable.',
    },
  ] : [];

  return {
    code: 'KAAL_SARP_YOGA',
    name: 'Kaal Sarp Yoga',
    is_present: present,
    subtype_code,
    severity,
    confidence: present ? 0.85 : 0.2,
    requires_additional_input: false,
    definition,
    effects_summary: effects,
    indicators: {
      axis_span: inRahuToKetu ? 'rahu_to_ketu' : inKetuToRahu ? 'ketu_to_rahu' : null,
      close_to_nodes_planet_count: closeCount,
      rahu_house: rahuHouse,
      ketu_house: Number.isFinite(Number(ketu.house)) ? Number(ketu.house) : null,
    },
    remedies,
    related_planets_for_activation: ['RAHU', 'KETU'],
  };
}

function computeManglik({ planetsByName, lagna_sign, moon_sign }) {
  const mars = planetsByName.get('MARS');
  if (!mars) {
    return {
      code: 'MANGLIK_DOSHA',
      name: 'Manglik (Mangal) Dosha',
      is_present: false,
      confidence: 0,
      requires_additional_input: false,
      reason: 'Mars data missing.',
    };
  }

  const manglikSet = new Set([1, 2, 4, 7, 8, 12]);

  // Prefer house if available for Lagna-based Manglik.
  const marsHouse = Number.isFinite(Number(mars.house)) ? Number(mars.house) : null;
  const fromLagna = marsHouse != null ? manglikSet.has(marsHouse) : false;

  // Moon-based Manglik using relative sign distance (1..12).
  const ms = Number(mars.sign);
  const moons = Number(moon_sign);
  const fromMoon = Number.isFinite(ms) && Number.isFinite(moons)
    ? manglikSet.has(((ms - moons + 12) % 12) + 1)
    : false;

  const present = fromLagna || fromMoon;
  const subtype_code = !present ? null : (fromLagna && fromMoon ? 'FULL' : 'PARTIAL');

  // Simple cancellation heuristic (very conservative, low confidence):
  // - If Mars is not in the Manglik set from Lagna and Moon, it's not present.
  // More nuanced cancellation rules are tradition-dependent; we'll not over-claim.
  const confidence = present ? 0.75 : 0.2;

  const definition =
    'Manglik (Mangal) Dosha is commonly assessed when Mars occupies certain houses from the ascendant (and/or from the Moon). It is mainly used in relationship/compatibility contexts.';

  const effects =
    'When present, it may correlate with higher friction in close partnerships, impatience, and a need for better conflict hygiene. The felt intensity is often higher during Mars periods.';

  const remedies = present ? [
    {
      type: 'meditation',
      title: 'Anger-to-clarity routine (10 minutes)',
      description: 'Daily 10 minutes: 4 minutes slow breathing + 3 minutes body-scan + 3 minutes journaling one clear next step. This reduces reactive conflict patterns.',
      frequency: 'Daily',
      duration: '21 days',
      safety_notes: 'If you have clinical anger/anxiety issues, consider professional support; do not rely only on astrology.',
    },
    {
      type: 'donation',
      title: 'Simple service/charity once a week',
      description: 'Donate food or support a small service act once a week. Keep it consistent rather than dramatic.',
      frequency: 'Weekly',
      duration: null,
      safety_notes: 'Avoid financially stressful donations.',
    },
  ] : [];

  return {
    code: 'MANGLIK_DOSHA',
    name: 'Manglik (Mangal) Dosha',
    is_present: present,
    subtype_code,
    severity: !present ? null : (fromLagna && fromMoon ? 'strong' : 'moderate'),
    confidence,
    requires_additional_input: false,
    definition,
    effects_summary: effects,
    indicators: {
      mars_house_from_lagna: marsHouse,
      manglik_from_lagna: fromLagna,
      manglik_from_moon: fromMoon,
      lagna_sign: Number.isFinite(Number(lagna_sign)) ? Number(lagna_sign) : null,
      moon_sign: Number.isFinite(Number(moon_sign)) ? Number(moon_sign) : null,
    },
    remedies,
    related_planets_for_activation: ['MARS'],
  };
}

function computePitra({ planetsByName }) {
  const sun = planetsByName.get('SUN');
  const rahu = planetsByName.get('RAHU');
  const ketu = planetsByName.get('KETU');
  const saturn = planetsByName.get('SATURN');

  if (!sun || sun.longitude == null) {
    return {
      code: 'PITRA_DOSHA',
      name: 'Pitra Dosha (Ancestral Affliction Indicators)',
      is_present: false,
      confidence: 0,
      requires_additional_input: false,
      reason: 'Sun longitude missing.',
    };
  }

  const indicators = [];

  const conjRahu = rahu?.longitude != null ? angularDistance(sun.longitude, rahu.longitude) : null;
  const conjKetu = ketu?.longitude != null ? angularDistance(sun.longitude, ketu.longitude) : null;
  const conjSat = saturn?.longitude != null ? angularDistance(sun.longitude, saturn.longitude) : null;

  const sunHouse = Number.isFinite(Number(sun.house)) ? Number(sun.house) : null;
  const rahuHouse = Number.isFinite(Number(rahu?.house)) ? Number(rahu.house) : null;
  const ketuHouse = Number.isFinite(Number(ketu?.house)) ? Number(ketu.house) : null;

  const hitSunNode = (conjRahu != null && conjRahu <= 8) || (conjKetu != null && conjKetu <= 8);
  if (hitSunNode) {
    indicators.push('Sun is closely conjunct Rahu/Ketu (node affliction).');
  }
  if (sunHouse === 9 && ((conjSat != null && conjSat <= 8) || hitSunNode)) {
    indicators.push('Sun in 9th house with close affliction (Saturn or nodes).');
  }
  if (rahuHouse === 9 || ketuHouse === 9) {
    indicators.push('Rahu/Ketu placed in the 9th house (ancestral line themes).');
  }

  const present = indicators.length > 0;
  const confidence = present ? clamp01(0.55 + 0.15 * indicators.length) : 0.2;

  const definition =
    '“Pitra Dosha” is a broad umbrella used for ancestral-line themes. Traditions differ; here we flag common affliction patterns involving Sun, nodes, and 9th-house emphasis.';

  const effects =
    'When present, it may correlate with repeating responsibility patterns, father/mentor themes, and a need for closure around family-line narratives. The felt intensity may rise during Sun, Rahu, Ketu, or Saturn periods.';

  const remedies = present ? [
    {
      type: 'service',
      title: 'Ancestral respect practice (weekly)',
      description: 'Once a week: spend 15 minutes in quiet reflection, gratitude, and a simple act of service to elders/parents (as appropriate).',
      frequency: 'Weekly',
      duration: '8 weeks',
      safety_notes: 'Keep practices respectful, non-extreme, and culturally appropriate.',
    },
    {
      type: 'donation',
      title: 'Food donation (monthly)',
      description: 'Donate food or support a meal program once a month. Consistency matters more than amount.',
      frequency: 'Monthly',
      duration: null,
      safety_notes: 'Do not donate beyond your means.',
    },
  ] : [];

  return {
    code: 'PITRA_DOSHA',
    name: 'Pitra Dosha (Ancestral Affliction Indicators)',
    is_present: present,
    subtype_code: null,
    severity: !present ? null : (indicators.length >= 2 ? 'moderate' : 'mild'),
    confidence,
    requires_additional_input: false,
    definition,
    effects_summary: effects,
    indicators: {
      triggers: indicators,
      sun_house: sunHouse,
      rahu_house: rahuHouse,
      ketu_house: ketuHouse,
      sun_rahu_orb_deg: conjRahu,
      sun_ketu_orb_deg: conjKetu,
      sun_saturn_orb_deg: conjSat,
    },
    remedies,
    related_planets_for_activation: ['SUN', 'RAHU', 'KETU', 'SATURN'],
  };
}

function buildNotComputableDosha({ code, name, required }) {
  return {
    code,
    name,
    is_present: null,
    confidence: 0,
    requires_additional_input: true,
    required_inputs: required,
    note: 'This dosha requires additional chart(s) or context and cannot be computed from a single birth chart alone.',
  };
}

/**
 * Generate full dosha report for a window.
 */
export async function generateDoshaReport(windowId) {
  if (!windowId || Number.isNaN(Number(windowId))) throw new Error('WINDOW_ID missing or invalid');
  const windowIdNum = Number(windowId);

  const astroRes = await query('SELECT * FROM astro_state_snapshots WHERE window_id = $1', [windowIdNum]);
  if (astroRes.rowCount === 0) throw new Error(`Astro snapshot not found for window_id=${windowId}`);
  const astro = astroRes.rows[0];

  const metadata = extractMetadataFromSnapshot(astro);
  const birthUtc = parseBirthDateTimeUtcFromMetadata(metadata);

  const planetsByName = planetsByNameFromSnapshot(astro);
  const moon = planetsByName.get('MOON');
  const moonLonSidereal = moon?.longitude ?? null;

  const dashaContext = buildCurrentDashaContext(astro);

  const kaalSarp = computeKaalSarp({ planetsByName });
  const manglik = computeManglik({ planetsByName, lagna_sign: astro?.lagna_sign, moon_sign: astro?.moon_sign });
  const pitra = computePitra({ planetsByName });

  const nadiProfile = computeNadiProfile({ astroSnapshot: astro, planetsByName });
  const nadiDosha = computeNadiDoshaPlaceholder({ userNadiGroup: nadiProfile?.indicators?.nadi_group });

  const grahan = computeGrahan({ planetsByName });
  const shrapit = computeShrapit({ planetsByName });
  const guruChandal = computeGuruChandal({ planetsByName });
  const kemadruma = computeKemadruma({ planetsByName, moon_sign: astro?.moon_sign });

  // Activation windows (Mahadasha) per dosha (highlight relevant planets)
  const activation = buildActivationFromMahadasha({
    birthUtc,
    moonLonSidereal,
    highlightPlanets: [
      ...new Set([
        ...(kaalSarp.related_planets_for_activation || []),
        ...(manglik.related_planets_for_activation || []),
        ...(pitra.related_planets_for_activation || []),
        ...(grahan.related_planets_for_activation || []),
        ...(shrapit.related_planets_for_activation || []),
        ...(guruChandal.related_planets_for_activation || []),
        ...(kemadruma.related_planets_for_activation || []),
      ]),
    ],
  });

  return {
    ok: true,
    meta: {
      window_id: String(windowId),
      generated_at: new Date().toISOString(),
      birth_datetime_utc: birthUtc ? birthUtc.toISOString() : null,
      dasha_context: dashaContext,
    },
    doshas: [
      kaalSarp,
      manglik,
      pitra,
      grahan,
      shrapit,
      guruChandal,
      kemadruma,
      nadiProfile,
      nadiDosha,
    ],
    activation, // shared timeline with highlight flags
    notes: [
      'Definitions can vary across traditions; this report uses explicit, deterministic rules and clearly shows triggers.',
      'For partner-dependent checks (e.g., Nadi Dosha), provide partner birth chart details to compute compatibility.',
    ],
  };
}


