/**
 * Daily Experience Engine (Phase-2B)
 *
 * Goal:
 * - Produce a lived, time-accurate daily narrative (6–9 lines)
 * - Use MD/AD/PD/Sookshma + daily Moon nakshatra + dusthana activation (6/8/12)
 * - NEVER expose planet names or raw dasha labels in user-facing text
 *
 * Output contract:
 * {
 *   meta: { window_id, generated_at, date },
 *   signals: { pressure_level, clarity_level, emotional_noise, action_support, reaction_risk },
 *   narrative: string, // 6–9 lines
 *   remedies: Array<{type,title,description,frequency,duration}> // 0–2
 * }
 */

import { query } from '../../config/db.js';
import { computeVimshottariStateAt, computeVimshottariSookshmaAt } from './vimshottariDasha.js';

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
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function norm360(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return null;
  return ((n % 360) + 360) % 360;
}

function nakshatraIdFromLongitude(lon) {
  const n = norm360(lon);
  if (n == null) return null;
  const idx0 = Math.floor(n / (360 / 27)); // 0..26
  const id = idx0 + 1;
  return id >= 1 && id <= 27 ? id : null;
}

function tithiIdFromSunMoonLongitudes(sunLon, moonLon) {
  const s = norm360(sunLon);
  const m = norm360(moonLon);
  if (s == null || m == null) return null;
  const diff = ((m - s) % 360 + 360) % 360; // 0..360
  const id = Math.floor(diff / 12) + 1; // 1..30
  return id >= 1 && id <= 30 ? id : null;
}

function yogaIdFromSunMoonLongitudes(sunLon, moonLon) {
  const s = norm360(sunLon);
  const m = norm360(moonLon);
  if (s == null || m == null) return null;
  const sum = ((s + m) % 360 + 360) % 360; // 0..360
  const id = Math.floor(sum / (360 / 27)) + 1; // 1..27
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
  const day = d.getUTCDay(); // 0 Sun .. 6 Sat
  return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day] || null;
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

function parseISODateToUTCStart(ymd) {
  const s = String(ymd || '').trim();
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const Y = Number(m[1]);
  const Mo = Number(m[2]);
  const D = Number(m[3]);
  if (![Y, Mo, D].every(Number.isFinite)) return null;
  return new Date(Date.UTC(Y, Mo - 1, D, 0, 0, 0));
}

function startOfDayUTC(d) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0));
}

function daysBetweenUTC(a, b) {
  const A = startOfDayUTC(a);
  const B = startOfDayUTC(b);
  const ms = B.getTime() - A.getTime();
  return Math.floor(ms / (24 * 60 * 60 * 1000));
}

function toISODate(date) {
  return date.toISOString().split('T')[0];
}

function safeParseJson(val) {
  if (val == null) return val;
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch { return val; }
  }
  return val;
}

function extractMetadataFromHousesState(houses_state) {
  const hs = safeParseJson(houses_state);
  if (hs && typeof hs === 'object' && hs._metadata && typeof hs._metadata === 'object') return hs._metadata;
  return null;
}

function parseBirthDateTimeUtcFromMetadata(metadata) {
  if (!metadata || typeof metadata !== 'object') return null;
  const dtUtcRaw =
    metadata.birthDateTimeUtc ?? metadata.birth_datetime_utc ?? metadata.birthDateTimeUTC ?? null;
  if (dtUtcRaw) {
    const dt = new Date(String(dtUtcRaw));
    if (!Number.isNaN(dt.getTime())) return dt;
  }
  return null;
}

const DAILY_RESET_HOUR_LOCAL = 5; // business rule: daily cycle anchors at 5:00 AM local time
const MOON_DEG_PER_DAY_APPROX = 13.176358;
const SUN_DEG_PER_DAY_APPROX = 0.985647; // average solar motion

function parseLocalDateAtResetToUtc(dateStr, offsetMinutes) {
  const d = parseISODateToUTCStart(dateStr);
  if (!d) return null;
  const off = Number(offsetMinutes);
  const offsetMin = Number.isFinite(off) ? off : 0;
  // Interpret provided YYYY-MM-DD as LOCAL calendar date, evaluate at daily reset hour (default 05:00 local).
  // UTC = local - offset.
  const utcMs =
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), DAILY_RESET_HOUR_LOCAL, 0, 0) -
    offsetMin * 60 * 1000;
  const out = new Date(utcMs);
  return Number.isNaN(out.getTime()) ? null : out;
}

function formatLocalAsOfLabel(dateStr, hourLocal) {
  const s = String(dateStr || '').trim();
  const h = Number(hourLocal);
  const hh = Number.isFinite(h) ? String(Math.max(0, Math.min(23, h))).padStart(2, '0') : '05';
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

function getPlanetFromPlanetsState(planets_state, planetUpper) {
  const arr = safeParseJson(planets_state);
  if (!Array.isArray(arr)) return null;
  const key = String(planetUpper || '').toUpperCase();
  return arr.find(p => String(p?.planet || p?.name || '').toUpperCase() === key) || null;
}

function getTransitFromTransitsState(transits_state, planetUpper) {
  let transits = safeParseJson(transits_state);
  if (!transits) return null;
  if (!Array.isArray(transits) && typeof transits === 'object') {
    transits = Object.entries(transits).map(([k, v]) => ({ planet: k, ...(v || {}) }));
  }
  if (!Array.isArray(transits)) return null;
  const key = String(planetUpper || '').toUpperCase();
  return transits.find(t => String(t?.planet || t?.name || '').toUpperCase() === key) || null;
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

function sumVectors(base, add, w = 1) {
  return {
    pressure: base.pressure + add.pressure * w,
    clarity: base.clarity + add.clarity * w,
    noise: base.noise + add.noise * w,
    action: base.action + add.action * w,
    risk: base.risk + add.risk * w,
  };
}

const PLANET_VECTOR = {
  SUN:     { pressure: 0.10, clarity: 0.10, noise: 0.05, action: 0.15, risk: 0.12 },
  MOON:    { pressure: 0.10, clarity: -0.05, noise: 0.22, action: -0.05, risk: 0.18 },
  MARS:    { pressure: 0.12, clarity: 0.00, noise: 0.10, action: 0.22, risk: 0.25 },
  MERCURY: { pressure: 0.05, clarity: 0.18, noise: 0.12, action: 0.10, risk: 0.12 },
  JUPITER: { pressure: -0.06, clarity: 0.22, noise: -0.06, action: 0.12, risk: -0.08 },
  VENUS:   { pressure: -0.05, clarity: 0.06, noise: -0.02, action: 0.08, risk: -0.05 },
  SATURN:  { pressure: 0.25, clarity: 0.02, noise: 0.10, action: -0.02, risk: 0.14 },
  RAHU:    { pressure: 0.16, clarity: -0.10, noise: 0.28, action: 0.08, risk: 0.20 },
  KETU:    { pressure: 0.08, clarity: 0.06, noise: 0.14, action: -0.06, risk: 0.10 },
};

function nakshatraVector(nakId) {
  const id = Number(nakId);
  if (!Number.isFinite(id)) return { pressure: 0, clarity: 0, noise: 0.05, action: 0, risk: 0.05 };

  // A few high-signal tones. Keep it simple and experience-oriented.
  // Swati (15) = restless wind: more noise, less steadiness.
  if (id === 15) return { pressure: 0.05, clarity: -0.04, noise: 0.14, action: 0.04, risk: 0.10 };
  // Ashlesha (9) = sticky mind: more loops, more suspicion.
  if (id === 9) return { pressure: 0.06, clarity: -0.06, noise: 0.18, action: -0.02, risk: 0.12 };
  // Mula (19) = root-pulling: intensity, drastic mood.
  if (id === 19) return { pressure: 0.10, clarity: -0.02, noise: 0.12, action: 0.06, risk: 0.14 };

  return { pressure: 0.03, clarity: 0.00, noise: 0.08, action: 0.02, risk: 0.06 };
}

function dusthanaPenalty(activeCount) {
  const c = Number(activeCount);
  if (!Number.isFinite(c) || c <= 0) return { pressure: 0, clarity: 0, noise: 0, action: 0, risk: 0 };
  // More dusthana activation => more pressure/noise/risk.
  const w = Math.min(1, 0.12 * c);
  return { pressure: 0.22 * w, clarity: -0.10 * w, noise: 0.18 * w, action: -0.04 * w, risk: 0.22 * w };
}

function moonFlavorHintFromNakshatraId(nakId) {
  const id = Number(nakId);
  if (!Number.isFinite(id) || id < 1 || id > 27) return null;
  // Deterministic, non-astro "flavor" hints to prevent identical day text when core levels don't change.
  // Grouping by 1..9 cycle provides enough variation without overfitting.
  const g = ((id - 1) % 9) + 1; // 1..9
  switch (g) {
    case 1: return 'Mind runs fast today—write decisions down to keep them clean.';
    case 2: return 'Today rewards patience more than pushing—small steady steps work best.';
    case 3: return 'Emotions can swing; keep conversations short and factual.';
    case 4: return 'Good day for finishing one task fully—completion brings relief.';
    case 5: return 'Avoid rushing replies; a small pause prevents regret.';
    case 6: return 'Keep the plan simple; complexity increases friction today.';
    case 7: return 'Energy is best used on routine and maintenance, not big reinvention.';
    case 8: return 'Clarity improves when you reduce inputs—fewer messages, fewer tabs, fewer promises.';
    case 9: return 'Focus returns when you stop re-checking and commit to one next step.';
    default: return null;
  }
}

function buildNarrative({ levels, dusthanaActive, moonToneHint, actionHint, variantSeed, panchang }) {
  const { pressure_level, clarity_level, emotional_noise, action_support, reaction_risk } = levels;

  const lines = [];

  // 1) Felt opening
  if (pressure_level === 'high' && emotional_noise === 'high') {
    const wd = panchang?.weekday ? String(panchang.weekday) : null;
    lines.push(
      pickBySeed(
        [
          'Today feels heavier than it should—small things can feel oddly effortful.',
          wd ? `${wd} starts with heavier effort than expected—go slower than your mind wants.` : 'The day starts with heavier effort than expected—go slower than your mind wants.',
          'Today can feel weighty—small tasks may take more willpower than usual.',
          'This day can feel demanding early—reduce noise and keep the plan small.',
        ],
        variantSeed
      )
    );
  } else if (clarity_level === 'high' && action_support !== 'low') {
    const wd = panchang?.weekday ? String(panchang.weekday) : null;
    lines.push(
      pickBySeed(
        [
          'Today has a clean, forward-moving tone—you can get real work done.',
          wd ? `${wd} supports clean momentum—one focused push will land well.` : 'Today supports clean momentum—one focused push will land well.',
          'Today is crisp enough to move things forward—avoid overthinking and execute.',
        ],
        variantSeed
      )
    );
  } else if (emotional_noise === 'high') {
    const wd = panchang?.weekday ? String(panchang.weekday) : null;
    lines.push(
      pickBySeed(
        [
          'Today can feel mentally noisy—your focus may drift even when you try to be steady.',
          wd ? `${wd} can feel mentally noisy—keep your day simple and your words clean.` : 'The day can feel mentally noisy—keep it simple and keep your words clean.',
          'Your mind may run in loops today—structure is your anchor.',
        ],
        variantSeed
      )
    );
  } else if (pressure_level === 'high') {
    const wd = panchang?.weekday ? String(panchang.weekday) : null;
    lines.push(
      pickBySeed(
        [
          'Today carries a quiet pressure—things move, but not at your preferred speed.',
          wd ? `${wd} carries quiet pressure—progress is real, but slower than your mind wants.` : 'The day carries quiet pressure—progress is real, but slower than your mind wants.',
          'Today asks for patience—results come from steady steps, not force.',
        ],
        variantSeed
      )
    );
  } else {
    const wd = panchang?.weekday ? String(panchang.weekday) : null;
    lines.push(
      pickBySeed(
        [
          'Today is workable, but it rewards structure more than impulse.',
          wd ? `${wd} is workable—structure beats impulse today.` : 'Today is workable—structure beats impulse.',
          'Today runs best on simple routines—keep decisions small and clean.',
        ],
        variantSeed
      )
    );
  }

  // 2) Continuity anchor (EXACTLY ONE line; no astro terms)
  // Placement: line 2 (right after felt state).
  if (pressure_level === 'high' || dusthanaActive) {
    lines.push('This day is part of a longer phase where effort is being tested before results stabilize.');
  } else if (emotional_noise === 'high') {
    lines.push('What you feel today connects to an ongoing period of inner recalibration, not a single event.');
  } else {
    lines.push('Today connects to a longer stretch of building clarity through small, repeatable choices.');
  }

  // 2) Why (soft)
  // Keep this short to preserve 7–9 line budget.
  lines.push(
    dusthanaActive
      ? 'Today has more friction than usual—energy leaks into sleep, mood, expenses, or small conflicts.'
      : 'Today has a subtle “tilt”—either smoother focus or stickier effort, depending on how you pace yourself.'
  );

  // 3) Pattern
  lines.push(
    clarity_level === 'low' || emotional_noise === 'high'
      ? 'Pattern: looping thoughts, repeated checking, or the same topic circling without closure.'
      : 'Pattern: one clear task finishes cleanly when you don’t split your attention.'
  );

  // 4) Risk zone
  lines.push(
    reaction_risk === 'high'
      ? 'Risk zone: fast replies, sharp words, and quick commitments made just to reduce discomfort.'
      : reaction_risk === 'medium'
        ? 'Risk zone: reacting to tone instead of content—especially in messages and small disagreements.'
        : 'Risk zone: over-correcting a small issue and wasting energy on perfection.'
  );

  // 5) Worsens + helps (compressed into ONE line to keep 7–9 lines total)
  lines.push(
    clarity_level === 'low' || pressure_level === 'high'
      ? 'Worsens: multitasking and forcing a big result. Helps: 3-step plan, simple wording, and delayed decisions that can wait.'
      : 'Worsens: doing everything at once. Helps: one priority, clean boundaries, and a small pause before you respond.'
  );

  // 7) Positive channel
  const bestUse =
    actionHint ||
    (action_support === 'high'
      ? 'Positive channel: finish one pending responsibility and close it fully—completion gives relief today.'
      : 'Positive channel: keep actions small but consistent; steady movement beats intensity today.');

  const calmClose = moonToneHint || 'If you keep it simple, the day ends calmer than it begins—and you’ll feel more in control again.';

  // Combine positive channel + calm close into ONE line (depth without length).
  lines.push(`${bestUse} ${calmClose}`);

  // 8–9) Decision clarity block (mandatory)
  // - Good for: 1–2 items
  // - Avoid: exactly 1 item
  const goodFor = [];
  if (clarity_level === 'high' || action_support === 'high') goodFor.push('focused solo work');
  if (pressure_level === 'high') goodFor.push('closing pending tasks');
  if (goodFor.length === 0) goodFor.push('cleaning up small responsibilities');
  const goodForText = goodFor.slice(0, 2).join(', ');

  const avoidText =
    reaction_risk === 'high'
      ? 'emotionally charged conversations'
      : reaction_risk === 'medium'
        ? 'quick promises'
        : 'over-fixing one small issue';

  lines.push(`Good for: ${goodForText}`);
  lines.push(`Avoid: ${avoidText}`);

  // Ensure 7–9 lines total (strict)
  return lines.slice(0, 9).join('\n');
}

async function pickDailyRemedies({ pressure_level, clarity_level, reaction_risk }) {
  // Use existing remedies, but keep them same-day doable and non-planet-specific in wording.
  const max = 1;

  // Prefer "avoid-first" inside narrative; only add ONE light remedy when day is noisy/risky.
  const shouldSuggest =
    reaction_risk === 'high' || clarity_level === 'low' || pressure_level === 'high';
  if (!shouldSuggest) return [];

  // 1 lightweight, same-day doable option (evening grounding / breath reset)
  return [
    {
      type: 'meditation',
      title: 'Evening grounding (8 minutes)',
      description: 'In the evening, do 8 minutes of slow breathing or a simple body-scan. It helps settle mental noise and reduces late-day reactivity.',
      frequency: 'Once today (evening)',
      duration: '8 minutes',
    },
  ].slice(0, max);
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

export async function generateDailyExperience(windowId, targetDate = null, options = {}) {
  if (!windowId || Number.isNaN(Number(windowId))) throw new Error('WINDOW_ID missing or invalid');
  const windowIdNum = Number(windowId);
  const debugMode = Boolean(options?.debug);

  const winRes = await query('SELECT id, scope, start_at, timezone FROM prediction_windows WHERE id = $1', [windowIdNum]);
  if (winRes.rowCount === 0) throw new Error(`Window not found: ${windowId}`);
  const window = winRes.rows[0];

  const astroRes = await query('SELECT * FROM astro_state_snapshots WHERE window_id = $1', [windowIdNum]);
  if (astroRes.rowCount === 0) throw new Error(`Astro snapshot not found for window_id=${windowId}`);
  const astro = astroRes.rows[0];

  const at = window?.start_at ? new Date(window.start_at) : new Date();
  const dateStr = targetDate ? String(targetDate) : toISODate(at);

  const metadata = extractMetadataFromHousesState(astro.houses_state);
  const offsetMinutes = metadata?.timezoneOffsetMinutes ?? metadata?.tzOffsetMinutes ?? 0;
  const asOfUtc = parseLocalDateAtResetToUtc(dateStr, offsetMinutes);
  const asOfLocalLabel = formatLocalAsOfLabel(dateStr, DAILY_RESET_HOUR_LOCAL);

  // ---- Dasha state (date-sensitive) ----------------------------------------
  // Previously we used stored running_* planets computed at window start.
  // That makes "today" and "yesterday" look identical if the windowId is reused or transits are stale.
  // Fix: recompute MD/AD/PD/Sookshma at the requested date (local midday) using birth UTC + natal Moon longitude.
  let md = PLANET_ID_TO_NAME[Number(astro.running_mahadasha_planet)] || null;
  let ad = PLANET_ID_TO_NAME[Number(astro.running_antardasha_planet)] || null;
  let pd = PLANET_ID_TO_NAME[Number(astro.running_pratyantardasha_planet)] || null;
  let sookshma = PLANET_ID_TO_NAME[Number(astro.running_sookshma_planet)] || null;

  try {
    const birthUtc = parseBirthDateTimeUtcFromMetadata(metadata);
    const moonNatal = getPlanetFromPlanetsState(astro.planets_state, 'MOON');
    const moonLonSid = Number(moonNatal?.longitude ?? moonNatal?.degree ?? moonNatal?.long);

    if (birthUtc && asOfUtc && Number.isFinite(moonLonSid)) {
      const st = computeVimshottariStateAt({
        birthDateTimeUtc: birthUtc,
        moonLongitudeSidereal: moonLonSid,
        atUtc: asOfUtc,
      });
      const mdName = st?.mahadasha?.planet ? String(st.mahadasha.planet).toUpperCase() : null;
      const adName = st?.antardasha?.planet ? String(st.antardasha.planet).toUpperCase() : null;
      const pdName = st?.pratyantardasha?.planet ? String(st.pratyantardasha.planet).toUpperCase() : null;

      if (mdName && PLANET_VECTOR[mdName]) md = mdName;
      if (adName && PLANET_VECTOR[adName]) ad = adName;
      if (pdName && PLANET_VECTOR[pdName]) pd = pdName;

      const sk = computeVimshottariSookshmaAt({
        birthDateTimeUtc: birthUtc,
        moonLongitudeSidereal: moonLonSid,
        atUtc: asOfUtc,
      });
      const sName = sk?.sookshma?.planet ? String(sk.sookshma.planet).toUpperCase() : null;
      if (sName && PLANET_VECTOR[sName]) sookshma = sName;
    }
  } catch {
    // Non-blocking: fall back to stored running_* values.
  }

  // Daily Moon Nakshatra (from transits Moon longitude). Fallback to stored moon_nakshatra.
  const tMoon = getTransitFromTransitsState(astro.transits_state, 'MOON');
  const tMoonLon = Number(tMoon?.longitude ?? tMoon?.degree ?? tMoon?.long);
  const tSun = getTransitFromTransitsState(astro.transits_state, 'SUN');
  const tSunLon = Number(tSun?.longitude ?? tSun?.degree ?? tSun?.long);

  // IMPORTANT:
  // - The mobile app often computes "now" transits, while dailyExperience is for a DATE.
  // - To keep daily output consistent and trustable, we shift Sun/Moon longitudes to the daily reset "as-of" time.
  const transitAnchorUtc = safeDate(astro?.computed_at) || new Date();
  const shiftDays = asOfUtc ? deltaDaysFloat(transitAnchorUtc, asOfUtc) : 0;

  let moonLonForDay = Number.isFinite(tMoonLon) ? (tMoonLon + MOON_DEG_PER_DAY_APPROX * shiftDays) : null;
  let sunLonForDay = Number.isFinite(tSunLon) ? (tSunLon + SUN_DEG_PER_DAY_APPROX * shiftDays) : null;

  const dailyMoonNak =
    moonLonForDay != null
      ? nakshatraIdFromLongitude(moonLonForDay)
      : (astro.moon_nakshatra || null);

  // Seed is deterministic per date and computed state (no randomness).
  // This lets wording vary safely even when bucketed levels don't change.
  const variantSeed = hashStringToInt(
    `${dateStr}|${md || ''}|${ad || ''}|${pd || ''}|${sookshma || ''}|${dailyMoonNak || ''}`
  );

  // Dusthana activation: count how many of the active dasha planets sit in 6/8/12 (natal placements).
  const activePlanets = [md, ad, pd, sookshma].filter(Boolean);
  let dusthanaCount = 0;
  for (const p of activePlanets) {
    const rec = getPlanetFromPlanetsState(astro.planets_state, p);
    const h = Number(rec?.house ?? rec?.h ?? null);
    if (Number.isFinite(h) && DUSTHANA_HOUSES.has(h)) dusthanaCount++;
  }
  const dusthanaActive = dusthanaCount > 0;

  // Aggregate signal vectors
  const weights = {
    md: 0.35,
    ad: 0.25,
    pd: 0.20,
    s: 0.20,
  };

  let vec = { pressure: 0, clarity: 0, noise: 0, action: 0, risk: 0 };
  if (md && PLANET_VECTOR[md]) vec = sumVectors(vec, PLANET_VECTOR[md], weights.md);
  if (ad && PLANET_VECTOR[ad]) vec = sumVectors(vec, PLANET_VECTOR[ad], weights.ad);
  if (pd && PLANET_VECTOR[pd]) vec = sumVectors(vec, PLANET_VECTOR[pd], weights.pd);
  if (sookshma && PLANET_VECTOR[sookshma]) vec = sumVectors(vec, PLANET_VECTOR[sookshma], weights.s);
  vec = sumVectors(vec, nakshatraVector(dailyMoonNak), 1);
  vec = sumVectors(vec, dusthanaPenalty(dusthanaCount), 1);

  // Convert to 0..1 signals around a neutral baseline (0.5)
  const pressure = clamp01(0.5 + vec.pressure);
  const clarity = clamp01(0.5 + vec.clarity);
  const noise = clamp01(0.5 + vec.noise);
  const action = clamp01(0.5 + vec.action);
  const risk = clamp01(0.5 + vec.risk);

  const levels = {
    pressure_level: level3(pressure),
    clarity_level: level3(clarity),
    emotional_noise: level3(noise),
    action_support: level3(action),
    reaction_risk: level3(risk),
  };

  // A tiny “moon tone” hint without astrology labels (deterministic variants)
  const moonToneHint =
    levels.emotional_noise === 'high'
      ? pickBySeed(
          [
            'Keep one calming routine fixed today; stability comes from repetition, not from perfect conditions.',
            'Protect sleep and keep routines steady today; stability comes from repetition, not from forcing outcomes.',
            'Keep the day simple and protect your baseline routine; steadiness matters more than intensity today.',
          ],
          variantSeed
        )
      : null;
  const moonFlavorHint = moonFlavorHintFromNakshatraId(dailyMoonNak);

  // Deterministic narrative variation (does NOT add randomness):
  // Even when the level buckets stay the same, small shifts in inputs should reflect in wording.
  const extraFlavor = pickBySeed(
    [
      null,
      'Keep promises small today; clean follow-through matters more than big claims.',
      'If you feel stuck, reduce the plan—clarity returns after you simplify.',
      'Avoid reacting to tone; respond to facts and keep it brief.',
    ],
    variantSeed
  );

  const actionHint =
    levels.action_support === 'high'
      ? 'Best use: finish one pending responsibility and close it fully—completion gives relief today.'
      : (levels.pressure_level === 'high'
          ? 'Best use: do the minimum that keeps life clean—one task, one boundary, and a quieter pace.'
          : null);

  const panchang = computePanchangLiteFromLongitudes({
    sunLon: sunLonForDay,
    moonLon: moonLonForDay,
    dateStr,
    source: (Number.isFinite(sunLonForDay) && Number.isFinite(moonLonForDay))
      ? 'shifted_from_snapshot_transits_to_daily_reset'
      : 'unavailable',
  });

  const narrative = buildNarrative({
    levels,
    dusthanaActive,
    moonToneHint: moonToneHint || moonFlavorHint || extraFlavor,
    actionHint,
    variantSeed,
    panchang,
  });

  const remedies = await pickDailyRemedies(levels);

  return {
    meta: {
      window_id: String(windowId),
      generated_at: new Date().toISOString(),
      date: dateStr,
      as_of_local: asOfLocalLabel,
      as_of_utc: asOfUtc ? asOfUtc.toISOString() : null,
      daily_reset_hour_local: DAILY_RESET_HOUR_LOCAL,
      timezone: window?.timezone || null,
      timezone_offset_minutes: Number.isFinite(Number(offsetMinutes)) ? Number(offsetMinutes) : null,
      panchang,
      ...(debugMode ? {
        debug: {
          md,
          ad,
          pd,
          sookshma,
          dailyMoonNak,
          moonLonForDay: moonLonForDay != null ? Number(moonLonForDay) : null,
          sunLonForDay: sunLonForDay != null ? Number(sunLonForDay) : null,
          dasha_evaluated_at_local_reset_hour: DAILY_RESET_HOUR_LOCAL,
          window_start_at: window?.start_at || null,
          snapshot_computed_at: astro?.computed_at || null,
          transit_anchor_utc: transitAnchorUtc ? transitAnchorUtc.toISOString() : null,
          transit_shift_days: shiftDays,
          panchang,
        },
      } : {}),
    },
    signals: levels,
    narrative,
    remedies,
  };
}


