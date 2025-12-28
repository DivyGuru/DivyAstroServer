/**
 * Weekly Experience Engine (Phase-2D)
 *
 * Goal:
 * - Planning-grade weekly foresight (8–12 lines)
 * - Aggregates daily signals into weekly trends/peaks/shifts
 * - Uses ONLY existing snapshot inputs:
 *   running MD/AD/PD, running_sookshma (background), Moon nakshatra changes across week, dusthana activation (6/8/12)
 * - Never exposes planet/dasha/sookshma labels in user-facing text
 *
 * Output:
 * {
 *   meta: { window_id, generated_at, from, to },
 *   signals: { weekly_pressure, weekly_support, weekly_clarity, weekly_emotional_volatility, weekly_action_flow },
 *   narrative: string (8–12 lines),
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
  if (id === 15) return { pressure: 0.05, clarity: -0.04, noise: 0.14, action: 0.04, risk: 0.10 };
  if (id === 9) return { pressure: 0.06, clarity: -0.06, noise: 0.18, action: -0.02, risk: 0.12 };
  if (id === 19) return { pressure: 0.10, clarity: -0.02, noise: 0.12, action: 0.06, risk: 0.14 };
  return { pressure: 0.03, clarity: 0.00, noise: 0.08, action: 0.02, risk: 0.06 };
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

function dusthanaPenalty(activeCount) {
  const c = Number(activeCount);
  if (!Number.isFinite(c) || c <= 0) return { pressure: 0, clarity: 0, noise: 0, action: 0, risk: 0 };
  const w = Math.min(1, 0.12 * c);
  return { pressure: 0.22 * w, clarity: -0.10 * w, noise: 0.18 * w, action: -0.04 * w, risk: 0.22 * w };
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

function computeDailySignalFromInputs({ md, ad, pd, s, moonNak, dusthanaCount }) {
  const weights = { md: 0.35, ad: 0.25, pd: 0.20, s: 0.20 };
  let vec = { pressure: 0, clarity: 0, noise: 0, action: 0, risk: 0 };
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

function continuityAnchor({ weekly_pressure, weekly_emotional_volatility }) {
  if (weekly_pressure === 'high') {
    return 'This week is part of a longer phase where effort is being tested before results stabilize.';
  }
  if (weekly_emotional_volatility === 'high') {
    return 'What repeats this week connects to an ongoing period of inner recalibration, not a single event.';
  }
  return 'This week connects to a longer stretch of building stability through small, repeatable choices.';
}

function pickWeeklyRemedy({ weekly_emotional_volatility, weekly_pressure }) {
  const needs = weekly_emotional_volatility === 'high' || weekly_pressure === 'high';
  if (!needs) return [];
  return [
    {
      type: 'meditation',
      title: 'One steady routine (this week)',
      description: 'Keep one routine fixed all week—sleep timing, a short walk, or an evening wind-down. Consistency reduces mental noise more than adding new effort.',
      frequency: 'Daily (light)',
      duration: null,
    },
  ];
}

function buildWeeklyNarrative({ signals, peak, support, midShift, riskTheme, stabilizer, direction, focusOn, avoid }) {
  const lines = [];

  // 1) Weekly opening theme
  lines.push(signals.weekly_pressure === 'high' && signals.weekly_clarity !== 'high'
    ? 'This week tests patience and planning more than speed.'
    : signals.weekly_action_flow === 'high'
      ? 'This week is productive when you keep your priorities clean.'
      : 'This week moves in waves—steady if you don’t chase everything at once.');

  // 2) Overall tone
  lines.push(signals.weekly_emotional_volatility === 'high'
    ? 'The emotional tone can swing; focus returns when routine stays steady.'
    : signals.weekly_support === 'high'
      ? 'Support is present—things feel more cooperative when you act with clarity.'
      : 'Overall tone is mixed: workable, but it rewards structure and timing.');

  // 3) Life-thread anchor
  lines.push(continuityAnchor(signals));

  // 4) Pressure pattern
  lines.push(`Pressure pattern: ${peak}.`);

  // 5) Support window
  lines.push(`Support window: ${support}.`);

  // 6) Mid-week shift
  if (midShift) lines.push(midShift);
  else lines.push('Mid-week shift: the week changes when you simplify the plan, not when you push harder.');

  // 7) Risk pattern
  lines.push(`Risk pattern: ${riskTheme}.`);

  // 8) Stabilizing behavior
  lines.push(`Stabilizer: ${stabilizer}.`);

  // 9) Weekly direction
  lines.push(direction);

  // 10–11) Decision clarity (mandatory, at end)
  lines.push(`Focus on: ${focusOn}`);
  lines.push(`Avoid: ${avoid}`);

  // Keep 8–12 lines
  return lines.slice(0, 12).join('\n');
}

export async function generateWeeklyExperience(windowId) {
  if (!windowId || Number.isNaN(Number(windowId))) throw new Error('WINDOW_ID missing or invalid');
  const windowIdNum = Number(windowId);

  const winRes = await query('SELECT id, scope, start_at, end_at FROM prediction_windows WHERE id = $1', [windowIdNum]);
  if (winRes.rowCount === 0) throw new Error(`Window not found: ${windowId}`);
  const window = winRes.rows[0];

  const astroRes = await query('SELECT * FROM astro_state_snapshots WHERE window_id = $1', [windowIdNum]);
  if (astroRes.rowCount === 0) throw new Error(`Astro snapshot not found for window_id=${windowId}`);
  const astro = astroRes.rows[0];

  const md = PLANET_ID_TO_NAME[Number(astro.running_mahadasha_planet)] || null;
  const ad = PLANET_ID_TO_NAME[Number(astro.running_antardasha_planet)] || null;
  const pd = PLANET_ID_TO_NAME[Number(astro.running_pratyantardasha_planet)] || null;
  const s = PLANET_ID_TO_NAME[Number(astro.running_sookshma_planet)] || null; // background amplifier

  // Dusthana activation from natal placements of active dasha planets
  const activePlanets = [md, ad, pd, s].filter(Boolean);
  let dusthanaCount = 0;
  for (const p of activePlanets) {
    const rec = getPlanetFromPlanetsState(astro.planets_state, p);
    const h = Number(rec?.house ?? rec?.h ?? null);
    if (Number.isFinite(h) && DUSTHANA_HOUSES.has(h)) dusthanaCount++;
  }

  // Week range: use window start if present; else current day as start.
  const startAt = window?.start_at ? new Date(window.start_at) : new Date();
  const weekStart = startOfDayUTC(startAt);

  // Moon nakshatra changes across week:
  // Use existing transit Moon longitude as base and apply constant daily motion (no new ephemeris).
  // This is a UX-level approximation to capture shifts without adding new engine layers.
  const moonLon0 = getTransitMoonLongitude(astro.transits_state);
  const MOON_DEG_PER_DAY_APPROX = 13.176358; // mean daily motion

  const daily = [];
  for (let i = 0; i < 7; i++) {
    const lon = moonLon0 != null ? (moonLon0 + MOON_DEG_PER_DAY_APPROX * i) : null;
    const moonNak = lon != null ? nakshatraIdFromLongitude(lon) : (astro.moon_nakshatra || null);
    const sig = computeDailySignalFromInputs({ md, ad, pd, s, moonNak, dusthanaCount });
    daily.push({ dayIndex: i, date: toISODate(addDaysUTC(weekStart, i)), ...sig });
  }

  // Aggregate weekly signals
  const avg = (k) => daily.reduce((a, d) => a + (Number(d[k]) || 0.5), 0) / daily.length;
  const weekly_pressure_v = avg('pressure');
  const weekly_clarity_v = avg('clarity');
  const weekly_vol_v = avg('noise'); // volatility proxy
  const weekly_action_v = avg('action');
  const weekly_support_v = clamp01((weekly_action_v + weekly_clarity_v) / 2);

  const signals = {
    weekly_pressure: level3(weekly_pressure_v),
    weekly_support: level3(weekly_support_v),
    weekly_clarity: level3(weekly_clarity_v),
    weekly_emotional_volatility: level3(weekly_vol_v),
    weekly_action_flow: level3(weekly_action_v),
  };

  // Peaks and windows (trend, not day-by-day)
  const peakDay = daily.reduce((best, d) => (d.pressure > best.pressure ? d : best), daily[0]);
  const supportDay = daily.reduce((best, d) => ((d.action + d.clarity) > (best.action + best.clarity) ? d : best), daily[0]);

  const peak = `heavier around ${peakDay.date}`;
  const support = `smoother flow around ${supportDay.date}`;

  // Mid-week shift: if sookshma window ends within the week range, surface a shift.
  let midShift = null;
  try {
    const sEnd = astro.running_sookshma_end ? new Date(astro.running_sookshma_end) : null;
    if (sEnd && !Number.isNaN(sEnd.getTime())) {
      const endISO = toISODate(sEnd);
      const startISO = toISODate(weekStart);
      const endWeekISO = toISODate(addDaysUTC(weekStart, 6));
      if (endISO >= startISO && endISO <= endWeekISO) {
        midShift = `Mid-week shift: after ${endISO}, the week feels different—less stuck, more responsive to small actions.`;
      }
    }
  } catch {
    // ignore
  }

  const riskTheme =
    signals.weekly_emotional_volatility === 'high'
      ? 'emotional reactivity and rushed messages can derail momentum'
      : signals.weekly_pressure === 'high'
        ? 'overcommitting early can create avoidable stress later'
        : 'scattered attention is the main leak this week';

  const stabilizer =
    signals.weekly_pressure === 'high'
      ? 'one clear plan, fewer promises, and protecting sleep'
      : signals.weekly_clarity === 'low'
        ? 'writing decisions down and keeping conversations short and factual'
        : 'steady routine and finishing what you start';

  const direction =
    signals.weekly_action_flow === 'high'
      ? 'Weekly direction: plan for completion—close pending loops instead of starting new battles.'
      : signals.weekly_pressure === 'high'
        ? 'Weekly direction: plan for stability—reduce friction first, then chase outcomes.'
        : 'Weekly direction: plan for rhythm—one priority per day beats intensity.';

  const focusOn =
    signals.weekly_clarity === 'high'
      ? 'focused work, clean communication'
      : signals.weekly_pressure === 'high'
        ? 'closing pending tasks, protecting routine'
        : 'small wins, steady rhythm';

  const avoid =
    signals.weekly_emotional_volatility === 'high'
      ? 'emotionally charged conversations'
      : signals.weekly_pressure === 'high'
        ? 'taking on extra commitments'
        : 'trying to fix everything at once';

  const narrative = buildWeeklyNarrative({
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

  const remedies = pickWeeklyRemedy(signals);

  return {
    meta: {
      window_id: String(windowId),
      generated_at: new Date().toISOString(),
      from: toISODate(weekStart),
      to: toISODate(addDaysUTC(weekStart, 6)),
    },
    signals,
    narrative,
    remedies,
  };
}


