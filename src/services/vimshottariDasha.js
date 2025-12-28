/**
 * Vimshottari Dasha Calculator (server-side)
 *
 * Purpose:
 * - Compute Mahadasha periods from birth datetime and Moon sidereal longitude.
 * - Keep deterministic output for API + DB snapshot usage.
 *
 * Notes:
 * - Assumes Moon longitude is SIDEREAL (e.g., Lahiri) consistent with your /calc output.
 * - Uses mean tropical year length (365.2425 days) for fractional-year conversion.
 * - Output dates are ISO (YYYY-MM-DD) in UTC.
 */

const YEAR_DAYS = 365.2425; // only for fractional durations
const DAY_MS = 24 * 60 * 60 * 1000;
const NAKSHATRA_ARC = 360 / 27; // 13.333...

const DASHA_ORDER = ['KETU', 'VENUS', 'SUN', 'MOON', 'MARS', 'RAHU', 'JUPITER', 'SATURN', 'MERCURY'];
const DASHA_YEARS = {
  KETU: 7,
  VENUS: 20,
  SUN: 6,
  MOON: 10,
  MARS: 7,
  RAHU: 18,
  JUPITER: 16,
  SATURN: 19,
  MERCURY: 17,
};

// Nakshatra lord sequence aligned to standard Vimshottari mapping.
// Index 0 = Ashwini ... 26 = Revati
const NAKSHATRA_LORD_BY_INDEX = [
  'KETU',    // 1 Ashwini
  'VENUS',   // 2 Bharani
  'SUN',     // 3 Krittika
  'MOON',    // 4 Rohini
  'MARS',    // 5 Mrigashira
  'RAHU',    // 6 Ardra
  'JUPITER', // 7 Punarvasu
  'SATURN',  // 8 Pushya
  'MERCURY', // 9 Ashlesha
  'KETU',    // 10 Magha
  'VENUS',   // 11 Purva Phalguni
  'SUN',     // 12 Uttara Phalguni
  'MOON',    // 13 Hasta
  'MARS',    // 14 Chitra
  'RAHU',    // 15 Swati
  'JUPITER', // 16 Vishakha
  'SATURN',  // 17 Anuradha
  'MERCURY', // 18 Jyeshtha
  'KETU',    // 19 Mula
  'VENUS',   // 20 Purva Ashadha
  'SUN',     // 21 Uttara Ashadha
  'MOON',    // 22 Shravana
  'MARS',    // 23 Dhanishtha
  'RAHU',    // 24 Shatabhisha
  'JUPITER', // 25 Purva Bhadrapada
  'SATURN',  // 26 Uttara Bhadrapada
  'MERCURY', // 27 Revati
];

function norm360(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return null;
  return ((n % 360) + 360) % 360;
}

function addDays(date, days) {
  return new Date(date.getTime() + days * DAY_MS);
}

function floorToUTCDate(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0));
}

function ceilToUTCDate(date) {
  const floored = floorToUTCDate(date);
  if (date.getTime() === floored.getTime()) return floored;
  return new Date(floored.getTime() + DAY_MS);
}

function addYearsUTC(dateAtMidnightUtc, yearsInt) {
  const y = dateAtMidnightUtc.getUTCFullYear();
  const m = dateAtMidnightUtc.getUTCMonth();
  const d = dateAtMidnightUtc.getUTCDate();
  const targetY = y + yearsInt;

  // Try same month/day; if it overflows (Feb 29 -> Mar 1), clamp to last day of month.
  let candidate = new Date(Date.UTC(targetY, m, d, 0, 0, 0));
  if (candidate.getUTCMonth() !== m) {
    // clamp to last day of the target month
    candidate = new Date(Date.UTC(targetY, m + 1, 0, 0, 0, 0));
  }
  return candidate;
}

function toISODateUTC(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
  return date.toISOString().split('T')[0];
}

function getNakshatraIndexFromMoonLon(moonLonSidereal) {
  const lon = norm360(moonLonSidereal);
  if (lon == null) return null;
  const idx = Math.floor(lon / NAKSHATRA_ARC); // 0..26
  if (idx < 0 || idx > 26) return null;
  return idx;
}

function getBalanceFractionInNakshatra(moonLonSidereal) {
  const lon = norm360(moonLonSidereal);
  if (lon == null) return null;
  const within = lon % NAKSHATRA_ARC; // 0..arc
  const traversed = within / NAKSHATRA_ARC; // 0..1
  return 1 - traversed; // remaining fraction
}

/**
 * Compute Mahadasha periods from birth datetime and moon longitude.
 *
 * @param {Object} params
 * @param {Date} params.birthDateTimeUtc
 * @param {number} params.moonLongitudeSidereal
 * @param {number} [params.minPeriods=18] - For backward compatibility (app previously sent 18).
 * @returns {Array<{planet:string, from:string, to:string}>}
 */
export function computeVimshottariMahadashaPeriods({ birthDateTimeUtc, moonLongitudeSidereal, minPeriods = 18 }) {
  if (!(birthDateTimeUtc instanceof Date) || Number.isNaN(birthDateTimeUtc.getTime())) {
    throw new Error('birthDateTimeUtc is required (valid Date)');
  }
  const lon = norm360(moonLongitudeSidereal);
  if (lon == null) throw new Error('moonLongitudeSidereal is required (number)');

  const nakIdx = getNakshatraIndexFromMoonLon(lon);
  if (nakIdx == null) throw new Error('Failed to compute nakshatra from moon longitude');

  const firstLord = NAKSHATRA_LORD_BY_INDEX[nakIdx];
  const balance = getBalanceFractionInNakshatra(lon);
  if (!firstLord || balance == null) throw new Error('Failed to compute first dasha lord/balance');

  const startOrderIdx = DASHA_ORDER.indexOf(firstLord);
  if (startOrderIdx === -1) throw new Error(`Unknown dasha lord: ${firstLord}`);

  // First period length is the remaining portion of that lord's full duration.
  const firstYears = DASHA_YEARS[firstLord] * balance;

  const periods = [];
  // North-Indian-style UX: treat boundaries as calendar dates (not times),
  // but use birth *datetime* for the first (fractional) balance to avoid 1-day truncation errors.
  let cursor = new Date(birthDateTimeUtc.getTime());

  const targetCount = Number.isFinite(Number(minPeriods)) && Number(minPeriods) > 0 ? Math.trunc(Number(minPeriods)) : 18;

  // Keep generating periods; after the first 9, sequence continues as a full cycle (120 years) again.
  for (let i = 0; periods.length < targetCount; i++) {
    const lord = DASHA_ORDER[(startOrderIdx + i) % DASHA_ORDER.length];
    const years = i === 0 ? firstYears : DASHA_YEARS[lord];
    let next;
    if (Number.isInteger(years)) {
      // Exact calendar-year step for integer-year dashas (matches common North-Indian outputs).
      // Cursor is kept on a UTC date boundary after the first period.
      next = addYearsUTC(floorToUTCDate(cursor), years);
    } else {
      // Fractional: convert to days then CEIL to the next UTC date boundary to avoid off-by-one truncation.
      const nextRaw = addDays(cursor, years * YEAR_DAYS);
      next = ceilToUTCDate(nextRaw);
    }
    periods.push({
      planet: lord,
      from: toISODateUTC(floorToUTCDate(cursor)),
      to: toISODateUTC(next),
    });
    cursor = next;
  }

  return periods;
}

function durationDaysBetweenISO(fromISO, toISO) {
  const a = parseISODateUTC(fromISO);
  const b = parseISODateUTC(toISO);
  if (!a || !b) return null;
  return (b.getTime() - a.getTime()) / DAY_MS;
}

function parseISODateUTC(iso) {
  if (!iso || typeof iso !== 'string') return null;
  const m = iso.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const y = Number(m[1]), mo = Number(m[2]), d = Number(m[3]);
  const dt = new Date(Date.UTC(y, mo - 1, d, 0, 0, 0));
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function nextPlanetInOrder(planetUpper) {
  const p = String(planetUpper || '').toUpperCase();
  const idx = DASHA_ORDER.indexOf(p);
  if (idx === -1) return null;
  return DASHA_ORDER[(idx + 1) % DASHA_ORDER.length];
}

/**
 * Compute Vimshottari sub-periods inside a parent period.
 * Standard rule: subDuration = parentDuration * (subPlanetYears / 120)
 *
 * @param {Object} params
 * @param {string} params.parentPlanet - e.g. 'SATURN'
 * @param {string} params.from - ISO date YYYY-MM-DD
 * @param {string} params.to - ISO date YYYY-MM-DD
 * @returns {Array<{planet:string, from:string, to:string}>}
 */
export function computeVimshottariSubPeriods({ parentPlanet, from, to }) {
  const P = String(parentPlanet || '').toUpperCase();
  if (!DASHA_YEARS[P]) throw new Error(`Invalid parentPlanet: ${parentPlanet}`);
  if (!from || !to) throw new Error('from/to are required');

  const fromDt = parseISODateUTC(from);
  const toDt = parseISODateUTC(to);
  if (!fromDt || !toDt) throw new Error('from/to must be ISO YYYY-MM-DD');
  if (to < from) throw new Error('from/to invalid (from > to)');

  const parentDays = (toDt.getTime() - fromDt.getTime()) / DAY_MS;
  if (!(parentDays > 0)) throw new Error('parent duration must be > 0');

  const out = [];
  let cursor = fromDt;
  let planet = P;

  // Generate 9 sub-periods; last one is clamped to parent end to avoid drift.
  for (let i = 0; i < 9; i++) {
    const years = DASHA_YEARS[planet];
    const frac = years / 120;
    const rawNext = new Date(cursor.getTime() + parentDays * frac * DAY_MS);
    let next = ceilToUTCDate(rawNext);

    if (i === 8 || next.getTime() > toDt.getTime()) next = toDt; // clamp last/end

    out.push({ planet, from: toISODateUTC(cursor), to: toISODateUTC(next) });
    cursor = next;
    planet = nextPlanetInOrder(planet);
    if (!planet) break;
    if (cursor.getTime() >= toDt.getTime()) break;
  }

  // Ensure last ends exactly on parent to
  if (out.length > 0) out[out.length - 1].to = to;
  return out;
}

/**
 * Compute current Vimshottari state (MD/AD/PD) at a given date.
 *
 * @param {Object} params
 * @param {Date} params.birthDateTimeUtc
 * @param {number} params.moonLongitudeSidereal
 * @param {Date} params.atUtc - date to evaluate (UTC date)
 */
export function computeVimshottariStateAt({ birthDateTimeUtc, moonLongitudeSidereal, atUtc }) {
  const at = atUtc instanceof Date ? floorToUTCDate(atUtc) : null;
  if (!at || Number.isNaN(at.getTime())) throw new Error('atUtc is required (valid Date)');

  const mds = computeVimshottariMahadashaPeriods({ birthDateTimeUtc, moonLongitudeSidereal, minPeriods: 18 });
  const md = mds.find(p => p.from <= toISODateUTC(at) && toISODateUTC(at) <= p.to) || null;
  if (!md) return { mahadasha: null, antardasha: null, pratyantardasha: null };

  const ads = computeVimshottariSubPeriods({ parentPlanet: md.planet, from: md.from, to: md.to });
  const ad = ads.find(p => p.from <= toISODateUTC(at) && toISODateUTC(at) <= p.to) || null;

  let pd = null;
  if (ad) {
    const pds = computeVimshottariSubPeriods({ parentPlanet: ad.planet, from: ad.from, to: ad.to });
    pd = pds.find(p => p.from <= toISODateUTC(at) && toISODateUTC(at) <= p.to) || null;
  }

  return {
    mahadasha: md,
    antardasha: ad,
    pratyantardasha: pd,
  };
}


