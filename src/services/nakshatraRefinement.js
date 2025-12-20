import {
  canonicalizeNakshatra,
  canonicalizeNakshatraPada,
  classifyNakshatraStrength,
} from '../config/nakshatraStrengthModel.js';

/**
 * Extract a canonical nakshatra name from a planet record.
 * Works for both natal planets and transits (whatever is stored in JSON).
 */
export function getCanonicalNakshatraFromRecord(planetRecord) {
  if (!planetRecord) return null;
  const raw =
    planetRecord.nakshatra ??
    planetRecord.nakshatra_name ??
    planetRecord.nakshatraName ??
    planetRecord.nakshatra_id ??
    planetRecord.nakshatraId ??
    null;
  return canonicalizeNakshatra(raw);
}

export function getCanonicalNakshatraPadaFromRecord(planetRecord) {
  if (!planetRecord) return null;
  const raw = planetRecord.nakshatra_pada ?? planetRecord.pada ?? planetRecord.nakshatraPada ?? null;
  return canonicalizeNakshatraPada(raw);
}

/**
 * Deterministic, non-breaking “signal extraction” from a snapshot for a domain context.
 *
 * NOTE:
 * - This does NOT change evaluation or composer logic.
 * - It can be used by timing-window computation (Phase 3) or for debugging/telemetry.
 *
 * @param {{ transitsByName?: Record<string, any>, planetsByName?: Record<string, any> }} astroNormalized
 * @param {{ contextKey: string, transitPlanets?: string[] }} options
 */
export function extractNakshatraContextSignals(
  astroNormalized,
  { contextKey, transitPlanets = ['JUPITER', 'SATURN', 'RAHU', 'KETU', 'VENUS'] } = {}
) {
  const ctx = String(contextKey || '').toLowerCase();
  const transitsByName = astroNormalized?.transitsByName || {};

  const signals = [];
  for (const p of transitPlanets) {
    const rec = transitsByName[String(p).toUpperCase()] || null;
    const nak = getCanonicalNakshatraFromRecord(rec);
    const pada = getCanonicalNakshatraPadaFromRecord(rec);
    if (!nak) continue;
    const strength = classifyNakshatraStrength(ctx, nak);
    signals.push({
      kind: 'transit',
      planet: String(p).toUpperCase(),
      nakshatra: nak,
      pada,
      strength,
    });
  }

  return {
    contextKey: ctx,
    signals,
  };
}

/**
 * Phase 2 utility (NOT wired into runtime): detect whether a condition_tree uses nakshatra operators.
 * This is useful to validate “nakshatra-refined variants” coverage without changing engine behavior.
 */
export function conditionTreeUsesNakshatra(conditionTree) {
  const NAK_KEYS = new Set([
    'planet_in_nakshatra',
    'transit_planet_in_nakshatra',
    'planet_in_nakshatra_group',
    'transit_planet_in_nakshatra_group',
    'dasha_lord_in_nakshatra',
    'dasha_lord_in_nakshatra_group',
  ]);

  function walk(node) {
    if (!node) return false;
    if (Array.isArray(node)) return node.some(walk);
    if (typeof node !== 'object') return false;

    for (const k of Object.keys(node)) {
      if (NAK_KEYS.has(k)) return true;
      if (k === 'all' || k === 'any') {
        if (walk(node[k])) return true;
      } else if (typeof node[k] === 'object') {
        if (walk(node[k])) return true;
      }
    }
    return false;
  }

  return walk(conditionTree);
}


