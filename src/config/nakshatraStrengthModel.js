// Nakshatra Strength Model (machine-usable, non-theory)
// ----------------------------------------------------
// This module provides:
// 1) Canonical nakshatra identifiers (name + index)
// 2) A reusable strength classification model:
//    supportive | neutral | sensitive | obstructive
//
// IMPORTANT:
// - This file intentionally does NOT embed astrology explanations.
// - It also does NOT claim universal “good/bad” nakshatras.
// - Domain-specific classification can be populated over time by authoring
//   without changing rule evaluation logic.

export const NAKSHATRA_NAMES = [
  'ASHWINI',
  'BHARANI',
  'KRITTIKA',
  'ROHINI',
  'MRIGASHIRA',
  'ARDRA',
  'PUNARVASU',
  'PUSHYA',
  'ASHLESHA',
  'MAGHA',
  'PURVA_PHALGUNI',
  'UTTARA_PHALGUNI',
  'HASTA',
  'CHITRA',
  'SWATI',
  'VISHHAKHA',
  'ANURADHA',
  'JYESHTHA',
  'MULA',
  'PURVA_ASHADHA',
  'UTTARA_ASHADHA',
  'SHRAVANA',
  'DHANISHTHA',
  'SHATABHISHA',
  'PURVA_BHADRAPADA',
  'UTTARA_BHADRAPADA',
  'REVATI',
];

export function canonicalizeNakshatra(value) {
  if (value == null) return null;

  // Accept index 1..27
  if (typeof value === 'number' && Number.isFinite(value)) {
    const idx = Math.trunc(value);
    if (idx >= 1 && idx <= 27) return NAKSHATRA_NAMES[idx - 1];
    return null;
  }

  const raw = String(value).trim();
  if (!raw) return null;
  const upper = raw
    .toUpperCase()
    .replace(/\s+/g, '_')
    .replace(/-+/g, '_');

  // Accept exact canonical name
  if (NAKSHATRA_NAMES.includes(upper)) return upper;

  // Accept common variants (minimal normalization)
  const aliasMap = {
    PURVA_PHALGINI: 'PURVA_PHALGUNI',
    UTTARA_PHALGINI: 'UTTARA_PHALGUNI',
    VISHAKHA: 'VISHHAKHA',
    SHATBHISHA: 'SHATABHISHA',
    PURVA_BHADRA: 'PURVA_BHADRAPADA',
    UTTARA_BHADRA: 'UTTARA_BHADRAPADA',
  };
  if (aliasMap[upper]) return aliasMap[upper];

  return null;
}

export function canonicalizeNakshatraPada(value) {
  if (value == null) return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  const p = Math.trunc(n);
  if (p < 1 || p > 4) return null;
  return p;
}

/**
 * Domain-context model:
 * - Keyed by `contextKey` (e.g. "marriage", "progeny", "career")
 * - Each context holds lists (canonical nakshatra names) for:
 *   supportive | neutral | sensitive | obstructive
 *
 * NOTE:
 * - All contexts default to empty lists (=> neutral).
 * - Populate safely via authoring workflows; no engine change required.
 */
export const NAKSHATRA_STRENGTH_MODEL = {
  // Example context shells (empty by default):
  marriage: { supportive: [], neutral: [], sensitive: [], obstructive: [] },
  finance: {
    // Curated minimal lists for refinement only.
    // Anything not listed below is treated as neutral by default.
    supportive: ['PUSHYA', 'ROHINI', 'HASTA', 'SWATI', 'SHRAVANA', 'DHANISHTHA', 'ANURADHA', 'UTTARA_PHALGUNI'],
    neutral: [],
    sensitive: ['ARDRA', 'ASHLESHA', 'JYESHTHA', 'MULA'],
    obstructive: ['BHARANI'],
  },
  health: {
    // Curated minimal lists for refinement only.
    // Anything not listed below is treated as neutral by default.
    supportive: ['PUSHYA', 'ROHINI', 'HASTA', 'ANURADHA', 'SHRAVANA', 'UTTARA_PHALGUNI'],
    neutral: [],
    sensitive: ['ARDRA', 'ASHLESHA', 'JYESHTHA', 'MULA'],
    obstructive: ['BHARANI'],
  },
  progeny: {
    // Curated minimal lists for refinement only.
    // Anything not listed below is treated as neutral by default.
    supportive: ['PUSHYA', 'ROHINI', 'PUNARVASU', 'REVATI', 'UTTARA_PHALGUNI', 'UTTARA_ASHADHA'],
    neutral: [],
    sensitive: ['ARDRA', 'ASHLESHA', 'JYESHTHA', 'MULA'],
    obstructive: ['BHARANI'],
  },
  career: {
    // Curated minimal lists for refinement only.
    // Anything not listed below is treated as neutral by default.
    supportive: ['HASTA', 'SWATI', 'ANURADHA', 'UTTARA_PHALGUNI', 'UTTARA_ASHADHA', 'SHRAVANA', 'DHANISHTHA'],
    neutral: [],
    sensitive: ['ARDRA', 'JYESHTHA', 'MULA', 'ASHLESHA'],
    obstructive: ['BHARANI'],
  },
  business: {
    // Curated minimal lists for refinement only.
    // Anything not listed below is treated as neutral by default.
    supportive: ['HASTA', 'SWATI', 'SHRAVANA', 'DHANISHTHA', 'ANURADHA', 'UTTARA_PHALGUNI'],
    neutral: [],
    sensitive: ['ARDRA', 'ASHLESHA', 'JYESHTHA', 'MULA'],
    obstructive: ['BHARANI'],
  },
  relationship: { supportive: [], neutral: [], sensitive: [], obstructive: [] },
};

export function classifyNakshatraStrength(contextKey, nakshatraName) {
  const n = canonicalizeNakshatra(nakshatraName);
  if (!n) return 'neutral';

  const ctx = NAKSHATRA_STRENGTH_MODEL[String(contextKey || '').toLowerCase()];
  if (!ctx) return 'neutral';

  if (Array.isArray(ctx.obstructive) && ctx.obstructive.includes(n)) return 'obstructive';
  if (Array.isArray(ctx.sensitive) && ctx.sensitive.includes(n)) return 'sensitive';
  if (Array.isArray(ctx.supportive) && ctx.supportive.includes(n)) return 'supportive';
  if (Array.isArray(ctx.neutral) && ctx.neutral.includes(n)) return 'neutral';

  return 'neutral';
}


