/**
 * Monthly Experience Engine (Phase-2M)
 *
 * Goal:
 * - Planning-grade monthly narrative (10–12 lines)
 * - Uses ONLY existing snapshot inputs:
 *   running MD/AD/PD, running_sookshma (background), approximate Moon nakshatra motion, dusthana activation (6/8/12)
 * - Never exposes planet/dasha/sookshma labels in user-facing text
 *
 * Output:
 * {
 *   meta: { window_id, generated_at, from, to },
 *   signals: { monthly_pressure, monthly_support, monthly_clarity, monthly_emotional_volatility, monthly_action_flow },
 *   narrative: string (10–12 lines),
 *   remedies: Array<...> (0–1)
 * }
 */
import { query } from '../../config/db.js';

const PLANET_ID_TO_NAME = {
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

const DUSTHANA_HOUSES = new Set([6, 8, 12]);
const DAILY_RESET_HOUR_LOCAL = 5;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MOON_DEG_PER_DAY_APPROX = 13.176358;
const SUN_DEG_PER_DAY_APPROX = 0.985647;

function safeParseJson(val) {
  if (val == null) return val;
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch { return val; }
  }
  return val;
}

function getPlanetFromPlanetsState(planets_state, planetUpper) {
  const arr = safeParseJson(planets_state);
  if (!Array.isArray(arr)) return null;
  const key = String(planetUpper || '').toUpperCase();
  return arr.find(p => String(p?.planet || p?.name || '').toUpperCase() === key) || null;
}

function getTransitMoonLongitude(transits_state) {
  let transits = safeParseJson(transits_state);
  if (!transits) return null;
  if (!Array.isArray(transits) && typeof transits === 'object') {
    transits = Object.entries(transits).map(([k, v]) => ({ planet: k, ...(v || {}) }));
  }
  if (!Array.isArray(transits)) return null;
  const tMoon = transits.find(t => String(t?.planet || t?.name || '').toUpperCase() === 'MOON') || null;
  const lon = Number(tMoon?.longitude ?? tMoon?.degree ?? tMoon?.long);
  return Number.isFinite(lon) ? lon : null;
}

function getTransitLongitude(transits_state, planetUpper) {
  let transits = safeParseJson(transits_state);
  if (!transits) return null;
  if (!Array.isArray(transits) && typeof transits === 'object') {
    transits = Object.entries(transits).map(([k, v]) => ({ planet: k, ...(v || {}) }));
  }
  if (!Array.isArray(transits)) return null;
  const key = String(planetUpper || '').toUpperCase();
  const t = transits.find(x => String(x?.planet || x?.name || '').toUpperCase() === key) || null;
  const lon = Number(t?.longitude ?? t?.degree ?? t?.long);
  return Number.isFinite(lon) ? lon : null;
}

function norm360(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return null;
  return ((n % 360) + 360) % 360;
}

function nakshatraIdFromLongitude(lon) {
  const n = norm360(lon);
  if (n == null) return null;
  const idx0 = Math.floor(n / (360 / 27));
  const id = idx0 + 1;
  return id >= 1 && id <= 27 ? id : null;
}

function tithiIdFromSunMoonLongitudes(sunLon, moonLon) {
  const s = norm360(sunLon);
  const m = norm360(moonLon);
  if (s == null || m == null) return null;
  const diff = ((m - s) % 360 + 360) % 360;
  const id = Math.floor(diff / 12) + 1;
  return id >= 1 && id <= 30 ? id : null;
}

function yogaIdFromSunMoonLongitudes(sunLon, moonLon) {
  const s = norm360(sunLon);
  const m = norm360(moonLon);
  if (s == null || m == null) return null;
  const sum = ((s + m) % 360 + 360) % 360;
  const id = Math.floor(sum / (360 / 27)) + 1;
  return id >= 1 && id <= 27 ? id : null;
}

const TITHI_NAMES = [
  'Pratipada', 'Dvitiya', 'Tritiya', 'Chaturthi', 'Panchami', 'Shashthi', 'Saptami', 'Ashtami', 'Navami', 'Dashami',
  'Ekadashi', 'Dvadashi', 'Trayodashi', 'Chaturdashi', 'Purnima',
  'Pratipada', 'Dvitiya', 'Tritiya', 'Chaturthi', 'Panchami', 'Shashthi', 'Saptami', 'Ashtami', 'Navami', 'Dashami',
  'Ekadashi', 'Dvadashi', 'Trayodashi', 'Chaturdashi', 'Amavasya',
];

const YOGA_NAMES = [
  'Vishkambha', 'Priti', 'Ayushman', 'Saubhagya', 'Shobhana', 'Atiganda', 'Sukarma', 'Dhriti', 'Shoola',
  'Ganda', 'Vriddhi', 'Dhruva', 'Vyaghata', 'Harshana', 'Vajra', 'Siddhi', 'Vyatipata', 'Variyana',
  'Parigha', 'Shiva', 'Siddha', 'Sadhya', 'Shubha', 'Shukla', 'Brahma', 'Indra', 'Vaidhriti',
];

function weekdayNameFromISODate(dateStr) {
  const d = parseISODateToUTCStart(dateStr);
  if (!d) return null;
  const day = d.getUTCDay();
  return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day] || null;
}

function extractMetadataFromHousesState(houses_state) {
  const hs = safeParseJson(houses_state);
  if (hs && typeof hs === 'object' && hs._metadata && typeof hs._metadata === 'object') return hs._metadata;
  return null;
}

function parseLocalDateAtResetToUtc(dateStr, offsetMinutes) {
  const d = parseISODateToUTCStart(dateStr);
  if (!d) return null;
  const off = Number(offsetMinutes);
  const offsetMin = Number.isFinite(off) ? off : 0;
  const utcMs = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), DAILY_RESET_HOUR_LOCAL, 0, 0) - offsetMin * 60 * 1000;
  const out = new Date(utcMs);
  return Number.isNaN(out.getTime()) ? null : out;
}

function formatLocalAsOfLabel(dateStr) {
  const s = String(dateStr || '').trim();
  const hh = String(DAILY_RESET_HOUR_LOCAL).padStart(2, '0');
  return `${s} ${hh}:00`;
}

function safeDate(d) {
  const dt = d instanceof Date ? d : new Date(String(d));
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function deltaDaysFloat(a, b) {
  const A = safeDate(a);
  const B = safeDate(b);
  if (!A || !B) return 0;
  return (B.getTime() - A.getTime()) / MS_PER_DAY;
}

function computePanchangLiteFromLongitudes({ sunLon, moonLon, dateStr, source = 'unavailable' }) {
  const tithiId = Number.isFinite(sunLon) && Number.isFinite(moonLon) ? tithiIdFromSunMoonLongitudes(sunLon, moonLon) : null;
  const yogaId = Number.isFinite(sunLon) && Number.isFinite(moonLon) ? yogaIdFromSunMoonLongitudes(sunLon, moonLon) : null;
  const nakId = Number.isFinite(moonLon) ? nakshatraIdFromLongitude(moonLon) : null;
  const paksha = tithiId != null ? (tithiId <= 15 ? 'Shukla' : 'Krishna') : null;
  return {
    weekday: weekdayNameFromISODate(dateStr),
    tithi: tithiId ? { id: tithiId, name: TITHI_NAMES[tithiId - 1] || null, paksha } : null,
    yoga: yogaId ? { id: yogaId, name: YOGA_NAMES[yogaId - 1] || null } : null,
    nakshatra: nakId ? { id: nakId } : null,
    _source: source,
  };
}

function hashStringToInt(s) {
  const str = String(s || '');
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pickBySeed(arr, seed) {
  if (!Array.isArray(arr) || arr.length === 0) return null;
  const idx = Math.abs(Number(seed) || 0) % arr.length;
  return arr[idx];
}

function clamp01(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return 0.5;
  return Math.max(0, Math.min(1, n));
}

function level3(x) {
  const v = clamp01(x);
  if (v <= 0.33) return 'low';
  if (v <= 0.66) return 'medium';
  return 'high';
}

const PLANET_VECTOR = {
  SUN:     { pressure: 0.10, clarity: 0.10, noise: 0.05, action: 0.15 },
  MOON:    { pressure: 0.10, clarity: -0.05, noise: 0.22, action: -0.05 },
  MARS:    { pressure: 0.12, clarity: 0.00, noise: 0.10, action: 0.22 },
  MERCURY: { pressure: 0.05, clarity: 0.18, noise: 0.12, action: 0.10 },
  JUPITER: { pressure: -0.06, clarity: 0.22, noise: -0.06, action: 0.12 },
  VENUS:   { pressure: -0.05, clarity: 0.06, noise: -0.02, action: 0.08 },
  SATURN:  { pressure: 0.25, clarity: 0.02, noise: 0.10, action: -0.02 },
  RAHU:    { pressure: 0.16, clarity: -0.10, noise: 0.28, action: 0.08 },
  KETU:    { pressure: 0.08, clarity: 0.06, noise: 0.14, action: -0.06 },
};

function nakshatraVector(nakId) {
  const id = Number(nakId);
  if (!Number.isFinite(id)) return { pressure: 0, clarity: 0, noise: 0.05, action: 0 };
  if (id === 15) return { pressure: 0.05, clarity: -0.04, noise: 0.14, action: 0.04 };
  if (id === 9) return { pressure: 0.06, clarity: -0.06, noise: 0.18, action: -0.02 };
  if (id === 19) return { pressure: 0.10, clarity: -0.02, noise: 0.12, action: 0.06 };
  return { pressure: 0.03, clarity: 0.00, noise: 0.08, action: 0.02 };
}

function sumVectors(base, add, w = 1) {
  return {
    pressure: base.pressure + add.pressure * w,
    clarity: base.clarity + add.clarity * w,
    noise: base.noise + add.noise * w,
    action: base.action + add.action * w,
  };
}

function dusthanaPenalty(activeCount) {
  const c = Number(activeCount);
  if (!Number.isFinite(c) || c <= 0) return { pressure: 0, clarity: 0, noise: 0, action: 0 };
  const w = Math.min(1, 0.12 * c);
  return { pressure: 0.22 * w, clarity: -0.10 * w, noise: 0.18 * w, action: -0.04 * w };
}

function startOfDayUTC(d) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0));
}

function addDaysUTC(d, days) {
  const ms = d.getTime() + Number(days) * 24 * 60 * 60 * 1000;
  return new Date(ms);
}

function toISODate(d) {
  return d.toISOString().split('T')[0];
}

function timezoneOffsetMinutesFromTimezoneName(tz) {
  // Keep deterministic and minimal: current server mainly uses Asia/Kolkata.
  const s = String(tz || '').toLowerCase();
  if (s.includes('asia/kolkata') || s.includes('ist')) return 330;
  return 0;
}

function ymdFromDateWithOffset(dateObj, offsetMinutes) {
  const d = new Date(dateObj.getTime() + Number(offsetMinutes || 0) * 60 * 1000);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseISODateToUTCStart(ymd) {
  const [y, m, d] = String(ymd).split('-').map((x) => Number(x));
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null;
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
}

function daysBetweenUTC(a, b) {
  const ms = startOfDayUTC(b).getTime() - startOfDayUTC(a).getTime();
  return Math.floor(ms / (24 * 60 * 60 * 1000));
}

function computeDailySignalFromInputs({ md, ad, pd, s, moonNak, dusthanaCount }) {
  const weights = { md: 0.35, ad: 0.25, pd: 0.20, s: 0.20 };
  let vec = { pressure: 0, clarity: 0, noise: 0, action: 0 };
  if (md && PLANET_VECTOR[md]) vec = sumVectors(vec, PLANET_VECTOR[md], weights.md);
  if (ad && PLANET_VECTOR[ad]) vec = sumVectors(vec, PLANET_VECTOR[ad], weights.ad);
  if (pd && PLANET_VECTOR[pd]) vec = sumVectors(vec, PLANET_VECTOR[pd], weights.pd);
  if (s && PLANET_VECTOR[s]) vec = sumVectors(vec, PLANET_VECTOR[s], weights.s);
  vec = sumVectors(vec, nakshatraVector(moonNak), 1);
  vec = sumVectors(vec, dusthanaPenalty(dusthanaCount), 1);

  const pressure = clamp01(0.5 + vec.pressure);
  const clarity = clamp01(0.5 + vec.clarity);
  const noise = clamp01(0.5 + vec.noise);
  const action = clamp01(0.5 + vec.action);

  return { pressure, clarity, noise, action };
}

function continuityAnchor({ monthly_pressure, monthly_emotional_volatility }) {
  if (monthly_pressure === 'high') return 'This month is part of a longer phase where effort is being tested before results stabilize.';
  if (monthly_emotional_volatility === 'high') return 'What repeats this month connects to an ongoing period of inner recalibration, not a single event.';
  return 'This month connects to a longer stretch of building stability through small, repeatable choices.';
}

function pickMonthlyRemedy({ monthly_emotional_volatility, monthly_pressure }) {
  const needs = monthly_emotional_volatility === 'high' || monthly_pressure === 'high';
  if (!needs) return [];
  return [
    {
      type: 'meditation',
      title: 'One steady routine (this month)',
      description: 'Keep one routine fixed all month—sleep timing, a short walk, or an evening wind-down. Consistency reduces mental noise more than adding new effort.',
      frequency: 'Daily (light)',
      duration: null,
    },
  ];
}

function buildMonthlyNarrative({ signals, peak, support, midShift, riskTheme, stabilizer, direction, focusOn, avoid }) {
  const lines = [];

  lines.push(
    signals.monthly_pressure === 'high' && signals.monthly_clarity !== 'high'
      ? 'This month rewards patience and planning more than speed.'
      : signals.monthly_action_flow === 'high'
        ? 'This month supports progress when you keep priorities clean.'
        : 'This month moves in waves—steady if you keep your plan simple.'
  );

  lines.push(
    signals.monthly_emotional_volatility === 'high'
      ? 'The emotional tone can swing; clarity returns when routine stays steady.'
      : signals.monthly_support === 'high'
        ? 'Support is present—things feel more cooperative when you act with clarity.'
        : 'Overall tone is mixed: workable, but it rewards structure and timing.'
  );

  // Exactly one continuity anchor line
  lines.push(continuityAnchor(signals));

  lines.push(`Pressure pattern: ${peak}.`);
  lines.push(`Support window: ${support}.`);

  if (midShift) lines.push(midShift);
  else lines.push('Mid-month shift: the month changes when you simplify the plan, not when you push harder.');

  lines.push(`Risk pattern: ${riskTheme}.`);
  lines.push(`Stabilizer: ${stabilizer}.`);
  lines.push(direction);
  lines.push(`Focus on: ${focusOn}`);
  lines.push(`Avoid: ${avoid}`);

  // Keep 10–12 lines (we target 11)
  return lines.slice(0, 12).join('\n');
}

export async function generateMonthlyExperience(windowId) {
  if (!windowId || Number.isNaN(Number(windowId))) throw new Error('WINDOW_ID missing or invalid');
  const windowIdNum = Number(windowId);

  const winRes = await query('SELECT id, scope, start_at, end_at, timezone FROM prediction_windows WHERE id = $1', [windowIdNum]);
  if (winRes.rowCount === 0) throw new Error(`Window not found: ${windowId}`);
  const window = winRes.rows[0];

  const astroRes = await query('SELECT * FROM astro_state_snapshots WHERE window_id = $1', [windowIdNum]);
  if (astroRes.rowCount === 0) throw new Error(`Astro snapshot not found for window_id=${windowId}`);
  const astro = astroRes.rows[0];

  const md = PLANET_ID_TO_NAME[Number(astro.running_mahadasha_planet)] || null;
  const ad = PLANET_ID_TO_NAME[Number(astro.running_antardasha_planet)] || null;
  const pd = PLANET_ID_TO_NAME[Number(astro.running_pratyantardasha_planet)] || null;
  const s = PLANET_ID_TO_NAME[Number(astro.running_sookshma_planet)] || null;

  // Dusthana activation from natal placements of active dasha planets
  const activePlanets = [md, ad, pd, s].filter(Boolean);
  let dusthanaCount = 0;
  for (const p of activePlanets) {
    const rec = getPlanetFromPlanetsState(astro.planets_state, p);
    const h = Number(rec?.house ?? rec?.h ?? null);
    if (Number.isFinite(h) && DUSTHANA_HOUSES.has(h)) dusthanaCount++;
  }

  // Month range: derive LOCAL date range from window start/end and timezone offset.
  const metadata = extractMetadataFromHousesState(astro.houses_state);
  const offsetMin = Number.isFinite(Number(metadata?.timezoneOffsetMinutes ?? metadata?.tzOffsetMinutes))
    ? Number(metadata?.timezoneOffsetMinutes ?? metadata?.tzOffsetMinutes)
    : timezoneOffsetMinutesFromTimezoneName(window?.timezone);
  const startAt = window?.start_at ? new Date(window.start_at) : new Date();
  const endAt = window?.end_at ? new Date(window.end_at) : new Date(startAt.getTime() + 30 * 24 * 60 * 60 * 1000);

  const fromYMD = ymdFromDateWithOffset(startAt, offsetMin);
  const toYMD = ymdFromDateWithOffset(endAt, offsetMin);

  const localStartUTC = parseISODateToUTCStart(fromYMD) || startOfDayUTC(startAt);
  const localEndUTC = parseISODateToUTCStart(toYMD) || startOfDayUTC(endAt);

  const totalDays = Math.max(1, Math.min(31, daysBetweenUTC(localStartUTC, localEndUTC) + 1));

  // Moon nakshatra changes across month (approx)
  const asOfUtc = parseLocalDateAtResetToUtc(fromYMD, offsetMin);
  const asOfLocalLabel = formatLocalAsOfLabel(fromYMD);

  // Panchang-lite at month start (05:00 local), derived by shifting snapshot transits to that time.
  const transitAnchorUtc = safeDate(astro?.computed_at) || new Date();
  const shiftDays = asOfUtc ? deltaDaysFloat(transitAnchorUtc, asOfUtc) : 0;
  const moonLon0 = getTransitLongitude(astro.transits_state, 'MOON');
  const sunLon0 = getTransitLongitude(astro.transits_state, 'SUN');
  const moonLonForMonthStart = moonLon0 != null ? (moonLon0 + MOON_DEG_PER_DAY_APPROX * shiftDays) : null;
  const sunLonForMonthStart = sunLon0 != null ? (sunLon0 + SUN_DEG_PER_DAY_APPROX * shiftDays) : null;

  const panchang = computePanchangLiteFromLongitudes({
    sunLon: sunLonForMonthStart,
    moonLon: moonLonForMonthStart,
    dateStr: fromYMD,
    source: (Number.isFinite(sunLonForMonthStart) && Number.isFinite(moonLonForMonthStart))
      ? 'shifted_from_snapshot_transits_to_month_reset'
      : 'unavailable',
  });

  const daily = [];
  for (let i = 0; i < totalDays; i++) {
    const lon = moonLon0 != null ? (moonLon0 + MOON_DEG_PER_DAY_APPROX * i) : null;
    const moonNak = lon != null ? nakshatraIdFromLongitude(lon) : (astro.moon_nakshatra || null);
    const sig = computeDailySignalFromInputs({ md, ad, pd, s, moonNak, dusthanaCount });
    daily.push({ dayIndex: i, date: toISODate(addDaysUTC(localStartUTC, i)), ...sig });
  }

  const avg = (k) => daily.reduce((a, d) => a + (Number(d[k]) || 0.5), 0) / daily.length;
  const monthly_pressure_v = avg('pressure');
  const monthly_clarity_v = avg('clarity');
  const monthly_vol_v = avg('noise');
  const monthly_action_v = avg('action');
  const monthly_support_v = clamp01((monthly_action_v + monthly_clarity_v) / 2);

  const signals = {
    monthly_pressure: level3(monthly_pressure_v),
    monthly_support: level3(monthly_support_v),
    monthly_clarity: level3(monthly_clarity_v),
    monthly_emotional_volatility: level3(monthly_vol_v),
    monthly_action_flow: level3(monthly_action_v),
  };

  const peakDay = daily.reduce((best, d) => (d.pressure > best.pressure ? d : best), daily[0]);
  const supportDay = daily.reduce((best, d) => ((d.action + d.clarity) > (best.action + best.clarity) ? d : best), daily[0]);

  const peak = `heavier around ${peakDay.date}`;
  const support = `smoother flow around ${supportDay.date}`;

  // Mid-month shift: if sookshma window ends within the month range, surface a shift.
  let midShift = null;
  try {
    const sEnd = astro.running_sookshma_end ? new Date(astro.running_sookshma_end) : null;
    if (sEnd && !Number.isNaN(sEnd.getTime())) {
      const endISO = ymdFromDateWithOffset(sEnd, offsetMin);
      if (endISO >= fromYMD && endISO <= toYMD) {
        midShift = `Mid-month shift: after ${endISO}, the month feels different—less stuck, more responsive to small actions.`;
      }
    }
  } catch {
    // ignore
  }

  const riskTheme =
    signals.monthly_emotional_volatility === 'high'
      ? 'emotional reactivity and rushed messages can derail momentum'
      : signals.monthly_pressure === 'high'
        ? 'overcommitting early can create avoidable stress later'
        : 'scattered attention is the main leak this month';

  const stabilizer =
    signals.monthly_pressure === 'high'
      ? 'one clear plan, fewer promises, and protecting sleep'
      : signals.monthly_clarity === 'low'
        ? 'writing decisions down and keeping conversations short and factual'
        : 'steady routine and finishing what you start';

  const direction =
    signals.monthly_action_flow === 'high'
      ? 'Monthly direction: plan for completion—close pending loops instead of starting new battles.'
      : signals.monthly_pressure === 'high'
        ? 'Monthly direction: plan for stability—reduce friction first, then chase outcomes.'
        : 'Monthly direction: plan for rhythm—one priority per week beats intensity.';

  const focusOn =
    signals.monthly_clarity === 'high'
      ? 'focused work, clean communication'
      : signals.monthly_pressure === 'high'
        ? 'closing pending tasks, protecting routine'
        : 'small wins, steady rhythm';

  const avoid =
    signals.monthly_emotional_volatility === 'high'
      ? 'emotionally charged conversations'
      : signals.monthly_pressure === 'high'
        ? 'taking on extra commitments'
        : 'trying to fix everything at once';

  const variantSeed = hashStringToInt(`${fromYMD}|${md || ''}|${ad || ''}|${pd || ''}|${s || ''}|${panchang?.tithi?.id || ''}|${panchang?.yoga?.id || ''}`);

  const openingLine =
    signals.monthly_pressure === 'high' && signals.monthly_clarity !== 'high'
      ? pickBySeed(
          [
            'This month rewards patience and planning more than speed.',
            panchang?.weekday ? `This month starts heavier—${panchang.weekday} sets a serious tone; plan before you push.` : 'This month starts heavier—plan before you push.',
            'This month rewards structure; rushing creates avoidable friction.',
          ],
          variantSeed
        )
      : signals.monthly_action_flow === 'high'
        ? pickBySeed(
            [
              'This month supports progress when you keep priorities clean.',
              panchang?.weekday ? `This month supports momentum—${panchang.weekday} begins clearer; finish what you start.` : 'This month supports momentum—finish what you start.',
              'This month moves best with one clean priority per week; execution beats overthinking.',
            ],
            variantSeed
          )
        : pickBySeed(
            [
              'This month moves in waves—steady if you keep your plan simple.',
              panchang?.weekday ? `This month moves in waves—${panchang.weekday} starts mixed; simplify the plan and you’ll feel steadier.` : 'This month moves in waves—simplify the plan and you’ll feel steadier.',
              'This month is workable, but it rewards timing and a smaller plan.',
            ],
            variantSeed
          );

  const narrative = buildMonthlyNarrative({
    signals,
    peak,
    support,
    midShift,
    riskTheme,
    stabilizer,
    direction,
    focusOn,
    avoid,
  });
  const narrativeWithNewOpening = [openingLine, ...String(narrative || '').split('\n').slice(1)].join('\n');

  const remedies = pickMonthlyRemedy(signals);

  return {
    meta: {
      window_id: String(windowId),
      generated_at: new Date().toISOString(),
      from: fromYMD,
      to: toYMD,
      as_of_local: asOfLocalLabel,
      as_of_utc: asOfUtc ? asOfUtc.toISOString() : null,
      daily_reset_hour_local: DAILY_RESET_HOUR_LOCAL,
      timezone: window?.timezone || null,
      timezone_offset_minutes: Number.isFinite(Number(offsetMin)) ? Number(offsetMin) : null,
      panchang,
    },
    signals,
    narrative: narrativeWithNewOpening,
    remedies,
  };
}


