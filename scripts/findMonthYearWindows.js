/**
 * Phase 3 CLI:
 * Deterministically compute best month–year windows for a point code
 * using existing DB monthly windows + astro snapshots + rule evaluation + nakshatra refinement.
 *
 * Usage:
 * node scripts/findMonthYearWindows.js --userId 1 --chartId 1 --pointCode RELATIONSHIP_MARRIAGE_TIMING --context marriage --startAt 2026-01-01 --monthsAhead 18 --limit 2
 */

import { findBestMonthYearWindowsForPoint } from '../src/services/timingWindowFinder.js';

function getArg(name, defaultValue = null) {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx === -1) return defaultValue;
  const v = process.argv[idx + 1];
  if (v == null) return defaultValue;
  return v;
}

function toInt(v, def) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : def;
}

async function main() {
  const userId = toInt(getArg('userId'), null);
  const chartId = toInt(getArg('chartId'), null);
  const pointCode = getArg('pointCode');
  const contextKey = getArg('context', 'marriage');
  const startAt = getArg('startAt');
  const monthsAhead = toInt(getArg('monthsAhead', '18'), 18);
  const limit = toInt(getArg('limit', '2'), 2);
  const minBaseScore = Number(getArg('minBaseScore', '0.25'));

  if (!userId || !chartId || !pointCode || !startAt) {
    console.error('Missing required args: --userId, --chartId, --pointCode, --startAt');
    process.exit(1);
  }

  const result = await findBestMonthYearWindowsForPoint({
    userId,
    chartId,
    pointCodes: [pointCode],
    contextKey,
    startAt,
    monthsAhead,
    limit,
    minBaseScore: Number.isFinite(minBaseScore) ? minBaseScore : 0.25,
  });

  console.log(JSON.stringify(result, null, 2));
}

main().catch((e) => {
  console.error('findMonthYearWindows failed:', e?.message || e);
  process.exit(1);
});


