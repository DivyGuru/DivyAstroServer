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

function buildNarrative({ levels, dusthanaActive, moonToneHint, actionHint }) {
  const { pressure_level, clarity_level, emotional_noise, action_support, reaction_risk } = levels;

  const lines = [];

  // 1) Felt opening
  if (pressure_level === 'high' && emotional_noise === 'high') {
    lines.push('Today feels heavier than it should—small things can feel oddly effortful.');
  } else if (clarity_level === 'high' && action_support !== 'low') {
    lines.push('Today has a clean, forward-moving tone—you can get real work done.');
  } else if (emotional_noise === 'high') {
    lines.push('Today can feel mentally noisy—your focus may drift even when you try to be steady.');
  } else if (pressure_level === 'high') {
    lines.push('Today carries a quiet pressure—things move, but not at your preferred speed.');
  } else {
    lines.push('Today is workable, but it rewards structure more than impulse.');
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

export async function generateDailyExperience(windowId, targetDate = null) {
  if (!windowId || Number.isNaN(Number(windowId))) throw new Error('WINDOW_ID missing or invalid');
  const windowIdNum = Number(windowId);

  const winRes = await query('SELECT id, scope, start_at FROM prediction_windows WHERE id = $1', [windowIdNum]);
  if (winRes.rowCount === 0) throw new Error(`Window not found: ${windowId}`);
  const window = winRes.rows[0];

  const astroRes = await query('SELECT * FROM astro_state_snapshots WHERE window_id = $1', [windowIdNum]);
  if (astroRes.rowCount === 0) throw new Error(`Astro snapshot not found for window_id=${windowId}`);
  const astro = astroRes.rows[0];

  const at = window?.start_at ? new Date(window.start_at) : new Date();
  const dateStr = targetDate ? String(targetDate) : toISODate(at);

  const md = PLANET_ID_TO_NAME[Number(astro.running_mahadasha_planet)] || null;
  const ad = PLANET_ID_TO_NAME[Number(astro.running_antardasha_planet)] || null;
  const pd = PLANET_ID_TO_NAME[Number(astro.running_pratyantardasha_planet)] || null;
  const sookshma = PLANET_ID_TO_NAME[Number(astro.running_sookshma_planet)] || null;

  // Daily Moon Nakshatra (from transits Moon longitude). Fallback to stored moon_nakshatra.
  const tMoon = getTransitFromTransitsState(astro.transits_state, 'MOON');
  const tMoonLon = Number(tMoon?.longitude ?? tMoon?.degree ?? tMoon?.long);
  const dailyMoonNak = Number.isFinite(tMoonLon) ? nakshatraIdFromLongitude(tMoonLon) : (astro.moon_nakshatra || null);

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

  // A tiny “moon tone” hint without astrology labels
  const moonToneHint =
    levels.emotional_noise === 'high'
      ? 'Keep one calming routine fixed today; stability comes from repetition, not from perfect conditions.'
      : null;

  const actionHint =
    levels.action_support === 'high'
      ? 'Best use: finish one pending responsibility and close it fully—completion gives relief today.'
      : (levels.pressure_level === 'high'
          ? 'Best use: do the minimum that keeps life clean—one task, one boundary, and a quieter pace.'
          : null);

  const narrative = buildNarrative({
    levels,
    dusthanaActive,
    moonToneHint,
    actionHint,
  });

  const remedies = await pickDailyRemedies(levels);

  return {
    meta: {
      window_id: String(windowId),
      generated_at: new Date().toISOString(),
      date: dateStr,
    },
    signals: levels,
    narrative,
    remedies,
  };
}


