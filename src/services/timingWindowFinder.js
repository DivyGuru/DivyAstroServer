import { query } from '../../config/db.js';
import { evaluateRulesForWindow, normalizeAstroState } from '../engine/ruleEvaluator.js';
import { extractNakshatraContextSignals } from './nakshatraRefinement.js';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function monthKeyFromDate(d) {
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return null;
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}`;
}

function addMonthsUTC(d, months) {
  const dt = new Date(d);
  const y = dt.getUTCFullYear();
  const m = dt.getUTCMonth();
  const day = 1;
  const out = new Date(Date.UTC(y, m + months, day, 0, 0, 0));
  return out;
}

function formatMonthYear(d) {
  const dt = new Date(d);
  const m = MONTH_NAMES[dt.getUTCMonth()];
  const y = dt.getUTCFullYear();
  return `${m} ${y}`;
}

function formatRange(startAt, endAt) {
  // endAt is exclusive-ish for monthly windows; we display by start months.
  return `${formatMonthYear(startAt)} to ${formatMonthYear(endAt)}`;
}

function isConsecutiveMonthKey(prevKey, nextKey) {
  if (!prevKey || !nextKey) return false;
  const [py, pm] = prevKey.split('-').map(Number);
  const [ny, nm] = nextKey.split('-').map(Number);
  if (!Number.isFinite(py) || !Number.isFinite(pm) || !Number.isFinite(ny) || !Number.isFinite(nm)) return false;
  const prev = py * 12 + (pm - 1);
  const next = ny * 12 + (nm - 1);
  return next === prev + 1;
}

function computeNakshatraModifier(astroNormalized, contextKey) {
  // Nakshatra refinement MUST NOT generate windows alone.
  // This modifier is small and only used to refine already-positive base windows.
  const { signals } = extractNakshatraContextSignals(astroNormalized, { contextKey });
  let mod = 0;

  // Deterministic small weights:
  // - supportive: +0.02 per key-planet
  // - sensitive:  -0.02 per key-planet
  // - obstructive: -0.04 per key-planet
  // - neutral: 0
  for (const s of signals) {
    if (s.strength === 'supportive') mod += 0.02;
    else if (s.strength === 'sensitive') mod -= 0.02;
    else if (s.strength === 'obstructive') mod -= 0.04;
  }

  // Clamp to keep refinement gentle and non-dominating.
  if (mod > 0.08) mod = 0.08;
  if (mod < -0.12) mod = -0.12;
  return { mod, signals };
}

function scoreMonthlyPoint(appliedRules, pointCodes) {
  const codes = Array.isArray(pointCodes) ? pointCodes : [];
  if (!codes.length) return 0;

  let best = 0;
  for (const r of appliedRules || []) {
    const pc = r.pointCode || r.point_code || null;
    if (!pc) continue;
    if (!codes.includes(pc)) continue;
    const s = typeof r.score === 'number' ? r.score : 0;
    if (s > best) best = s;
  }
  return best;
}

export function buildMonthYearWindowsFromScoredMonths(scoredMonths, { limit = 2, minBaseScore = 0.25 } = {}) {
  const items = Array.isArray(scoredMonths) ? [...scoredMonths] : [];
  items.sort((a, b) => String(a.monthKey).localeCompare(String(b.monthKey)));

  const eligible = items.filter((x) => (x.baseScore || 0) >= minBaseScore);
  if (!eligible.length) return [];

  // Build consecutive runs
  const runs = [];
  let cur = null;
  for (const m of eligible) {
    if (!cur) {
      cur = { start: m, end: m, months: [m] };
      continue;
    }
    if (isConsecutiveMonthKey(cur.end.monthKey, m.monthKey)) {
      cur.end = m;
      cur.months.push(m);
    } else {
      runs.push(cur);
      cur = { start: m, end: m, months: [m] };
    }
  }
  if (cur) runs.push(cur);

  // Score runs by average combinedScore, then length
  const scoredRuns = runs.map((r) => {
    const avg = r.months.reduce((sum, x) => sum + (x.combinedScore || 0), 0) / r.months.length;
    return {
      start_at: r.start.start_at,
      end_at: r.end.end_at,
      monthCount: r.months.length,
      avgScore: avg,
      months: r.months.map((x) => x.monthKey),
      range_text: formatRange(r.start.start_at, r.end.end_at),
    };
  });

  scoredRuns.sort((a, b) => {
    if (b.avgScore !== a.avgScore) return b.avgScore - a.avgScore;
    return b.monthCount - a.monthCount;
  });

  return scoredRuns.slice(0, Math.max(1, Math.min(3, Number(limit) || 2)));
}

/**
 * Phase 3: Deterministically compute best month–year windows for a point code,
 * using existing DB windows + astro snapshots + rule evaluation.
 *
 * IMPORTANT:
 * - This does NOT change evaluation or composer logic.
 * - It never creates windows alone; it only scores existing monthly windows.
 *
 * Required: monthly prediction_windows + astro_state_snapshots must already exist.
 */
export async function findBestMonthYearWindowsForPoint({
  userId,
  chartId,
  pointCodes,
  contextKey,
  startAt,
  monthsAhead = 18,
  limit = 2,
  minBaseScore = 0.25,
} = {}) {
  if (!userId || !chartId) throw new Error('userId and chartId are required');
  if (!Array.isArray(pointCodes) || !pointCodes.length) throw new Error('pointCodes[] required');
  if (!startAt) throw new Error('startAt required (ISO date)');

  const start = new Date(startAt);
  if (Number.isNaN(start.getTime())) throw new Error('startAt invalid');
  const end = addMonthsUTC(start, Number(monthsAhead) || 18);

  // Load monthly windows in range
  const winRes = await query(
    `SELECT id, scope, start_at, end_at
     FROM prediction_windows
     WHERE user_id = $1
       AND chart_id = $2
       AND scope = 'monthly'
       AND start_at >= $3
       AND start_at < $4
     ORDER BY start_at ASC`,
    [userId, chartId, start.toISOString(), end.toISOString()]
  );

  const windows = winRes.rows || [];
  if (!windows.length) {
    return {
      ok: true,
      reason: 'no_monthly_windows_found',
      windows: [],
      scoredMonths: [],
      monthYearRanges: [],
    };
  }

  // Load all snapshots for these windows
  const ids = windows.map((w) => w.id);
  const placeholders = ids.map((_, i) => `$${i + 1}`).join(', ');
  const snapRes = await query(
    `SELECT * FROM astro_state_snapshots WHERE window_id IN (${placeholders})`,
    ids
  );
  const snaps = new Map((snapRes.rows || []).map((r) => [Number(r.window_id), r]));

  // Load rules applicable for monthly scope
  const rulesRes = await query(
    `SELECT * FROM rules WHERE is_active = TRUE AND 'monthly' = ANY(applicable_scopes)`,
    []
  );
  const rules = rulesRes.rows || [];

  const scoredMonths = [];
  for (const w of windows) {
    const astroRow = snaps.get(Number(w.id));
    if (!astroRow) continue;

    const applied = evaluateRulesForWindow({ rules, astroRow, windowScope: 'monthly' });
    const baseScore = scoreMonthlyPoint(applied, pointCodes);

    // Nakshatra refinement (never generates alone; applies only when baseScore > 0)
    const astroNorm = normalizeAstroState(astroRow);
    const { mod, signals } = computeNakshatraModifier(astroNorm, contextKey);
    const combinedScore = baseScore > 0 ? Math.max(0, baseScore + mod) : 0;

    scoredMonths.push({
      windowId: w.id,
      start_at: w.start_at,
      end_at: w.end_at,
      monthKey: monthKeyFromDate(w.start_at),
      baseScore,
      nakshatraModifier: mod,
      combinedScore,
      nakshatraSignals: signals,
    });
  }

  const monthYearRanges = buildMonthYearWindowsFromScoredMonths(scoredMonths, { limit, minBaseScore });

  return {
    ok: true,
    pointCodes,
    contextKey: String(contextKey || '').toLowerCase(),
    startAt: start.toISOString(),
    endAt: end.toISOString(),
    scoredMonths,
    monthYearRanges,
  };
}


