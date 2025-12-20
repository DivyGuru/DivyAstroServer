/**
 * Prediction Composer Layer (Deterministic)
 * ------------------------------------------------------------
 * Purpose:
 * - Convert multiple matched prediction variants into a coherent,
 *   human-readable, non-exaggerated advisory output.
 *
 * Non-responsibilities (LOCKED elsewhere):
 * - Does NOT evaluate astrology logic (no condition evaluation)
 * - Does NOT change scoring
 * - Does NOT generate remedies
 * - Does NOT add new predictions
 *
 * Input:
 * - matchedVariants: Array of variant objects already matched by rule evaluation.
 *   Each variant must include:
 *     - score (number)
 *     - pointCode (string | null)
 *     - effect_json (object)
 *       - effect_json.theme / effect_json.area (for grouping)
 *       - effect_json.variant_meta: { tone, dominance, confidence_level, certainty_note }
 *
 * Output:
 * - {
 *     headlines: [],
 *     supporting_notes: [],
 *     suppressed_variants: [],
 *     applied_tone: 'informational' | 'cautionary' | 'opportunity' | 'stabilizing' | null,
 *   }
 */

const DOMINANCE_RANK = { dominant: 3, supporting: 2, background: 1 };
const CONFIDENCE_RANK = { high: 3, medium: 2, low: 1 };

const ALLOWED_TONES = new Set(['informational', 'cautionary', 'opportunity', 'stabilizing']);
const ALLOWED_DOMINANCE = new Set(['dominant', 'supporting', 'background']);
const ALLOWED_CONFIDENCE = new Set(['low', 'medium', 'high']);

const BANNED_LANGUAGE = [
  /\bguarantee(d)?\b/i,
  /\b100%\b/i,
  /\bcertain\b/i,
  /\bdefinitely\b/i,
  /\bmust happen\b/i,
  /\bwill happen\b/i,
  /\bfear\b/i,
  /\bterrible\b/i,
  /\bdisaster\b/i,
];

function safeText(s) {
  const text = String(s || '').trim();
  for (const re of BANNED_LANGUAGE) {
    if (re.test(text)) {
      return text.replace(re, 'may');
    }
  }
  return text;
}

function normalizeMeta(effectJson) {
  const meta = effectJson?.variant_meta || {};
  const tone = ALLOWED_TONES.has(meta.tone) ? meta.tone : 'informational';
  const dominance = ALLOWED_DOMINANCE.has(meta.dominance) ? meta.dominance : 'supporting';
  const confidence_level = ALLOWED_CONFIDENCE.has(meta.confidence_level) ? meta.confidence_level : 'medium';
  const certainty_note = safeText(meta.certainty_note || '');

  return { tone, dominance, confidence_level, certainty_note };
}

function dominanceRank(d) {
  return DOMINANCE_RANK[d] || 0;
}

function confidenceRank(c) {
  return CONFIDENCE_RANK[c] || 0;
}

function getDomainKey(variant) {
  // Domain is a coarse grouping for output limiting (business/career/relationships/etc.).
  // Deterministic mapping using effect_json.area and effect_json.theme.
  const area = String(variant?.effect_json?.area || '').toLowerCase();
  const theme = String(variant?.effect_json?.theme || '').toLowerCase();

  if (area.includes('business')) return 'business';
  if (area.includes('job') || area.includes('income')) return 'career';
  if (theme.includes('career')) return 'career';
  if (theme.includes('relationship')) return 'relationships';
  if (theme.includes('health')) return 'health';
  if (theme.includes('mental')) return 'mind';
  if (theme.includes('spiritual')) return 'spiritual';
  if (theme.includes('money')) return 'money';
  return theme || 'general';
}

function getGuidanceTag(meta) {
  // Used for contradiction avoidance in a deterministic way.
  // This is not astrology logic; it is narrative control.
  switch (meta.tone) {
    case 'opportunity':
      return 'expand';
    case 'cautionary':
      return 'reduce_risk';
    case 'stabilizing':
      return 'stabilize';
    default:
      return 'observe';
  }
}

function isContradictory(tagA, tagB) {
  // Conservative contradiction rules:
  // - expand conflicts with reduce_risk when both are high-priority.
  // - stabilize is generally compatible with reduce_risk and observe.
  if (!tagA || !tagB) return false;
  if (tagA === tagB) return false;
  if ((tagA === 'expand' && tagB === 'reduce_risk') || (tagA === 'reduce_risk' && tagB === 'expand')) return true;
  return false;
}

function sortVariantsDeterministic(a, b) {
  const ma = normalizeMeta(a.effect_json);
  const mb = normalizeMeta(b.effect_json);

  // a) dominance
  const d = dominanceRank(mb.dominance) - dominanceRank(ma.dominance);
  if (d !== 0) return d;

  // b) confidence_level
  const c = confidenceRank(mb.confidence_level) - confidenceRank(ma.confidence_level);
  if (c !== 0) return c;

  // c) score
  const sa = typeof a.score === 'number' ? a.score : 0;
  const sb = typeof b.score === 'number' ? b.score : 0;
  if (sb !== sa) return sb - sa;

  // stable tie-breakers (no randomness)
  const pa = String(a.pointCode || a.point_code || '');
  const pb = String(b.pointCode || b.point_code || '');
  if (pb !== pa) return pb.localeCompare(pa);

  const ca = String(a.code || a.variant_code || '');
  const cb = String(b.code || b.variant_code || '');
  return cb.localeCompare(ca);
}

function buildHeadlineText(meta, domain) {
  // Deterministic, non-exaggerated templates (no astrology theory).
  switch (meta.tone) {
    case 'opportunity':
      return safeText(`[${domain}] An opportunity signal is active; you may benefit from focused action and follow-through.`);
    case 'cautionary':
      return safeText(`[${domain}] A caution signal is active; consider risk-control, buffers, and slower commitments.`);
    case 'stabilizing':
      return safeText(`[${domain}] A stabilizing signal is active; stepwise structure and clear agreements can help.`);
    default:
      return safeText(`[${domain}] A neutral signal is present; observe trends and proceed steadily.`);
  }
}

function buildSupportingNoteText(meta, domain) {
  switch (meta.tone) {
    case 'opportunity':
      return safeText(`[${domain}] Supportive nuance: act on what is already working, keep execution simple.`);
    case 'cautionary':
      return safeText(`[${domain}] Caution nuance: double-check assumptions and avoid rushed decisions.`);
    case 'stabilizing':
      return safeText(`[${domain}] Stabilizing nuance: clarify roles, reduce ambiguity, and prefer documented steps.`);
    default:
      return safeText(`[${domain}] Informational nuance: keep awareness and avoid over-interpreting small changes.`);
  }
}

function asSuppressed(variant, reason) {
  const meta = normalizeMeta(variant.effect_json);
  return {
    point_code: variant.pointCode || variant.point_code || null,
    variant_code: variant.code || variant.variant_code || null,
    domain: getDomainKey(variant),
    dominance: meta.dominance,
    confidence_level: meta.confidence_level,
    tone: meta.tone,
    score: typeof variant.score === 'number' ? variant.score : 0,
    reason,
  };
}

/**
 * Compose a deterministic narrative object from matched variants.
 *
 * Options:
 * - maxVariantsPerDomain: clamp to 2..4 (default 3)
 * - includeBackground: if true, background variants may be included (still limited)
 * - includeLowConfidence: if true, low confidence variants may be included
 */
export function composePrediction({
  matchedVariants = [],
  maxVariantsPerDomain = 3,
  includeBackground = false,
  includeLowConfidence = false,
} = {}) {
  const maxPerDomain = Math.max(2, Math.min(4, Number(maxVariantsPerDomain) || 3));

  const variants = Array.isArray(matchedVariants) ? [...matchedVariants] : [];
  variants.sort(sortVariantsDeterministic);

  const suppressed = [];
  const headlines = [];
  const supporting_notes = [];

  const domainCounts = new Map();
  const domainHeadlineTags = new Map(); // domain -> guidanceTag of selected dominant headline

  for (const v of variants) {
    const meta = normalizeMeta(v.effect_json);
    const domain = getDomainKey(v);

    // Suppress background by default
    if (meta.dominance === 'background' && !includeBackground) {
      suppressed.push(asSuppressed(v, 'background_variant_suppressed_by_default'));
      continue;
    }

    // Suppress low confidence by default
    if (meta.confidence_level === 'low' && !includeLowConfidence) {
      suppressed.push(asSuppressed(v, 'low_confidence_suppressed_by_default'));
      continue;
    }

    const used = domainCounts.get(domain) || 0;
    if (used >= maxPerDomain) {
      suppressed.push(asSuppressed(v, `domain_limit_reached_max_${maxPerDomain}`));
      continue;
    }

    const tag = getGuidanceTag(meta);
    const existingTag = domainHeadlineTags.get(domain) || null;

    // Contradiction avoidance:
    // - If a dominant headline already sets a primary tag, do not add a contradictory dominant headline.
    if (existingTag && isContradictory(existingTag, tag) && meta.dominance === 'dominant') {
      suppressed.push(asSuppressed(v, 'contradictory_dominant_suppressed'));
      continue;
    }

    // Narrative assembly:
    // - Dominant variants become headlines.
    // - Supporting variants become supporting notes (nuance).
    const entryBase = {
      domain,
      point_code: v.pointCode || v.point_code || null,
      variant_code: v.code || v.variant_code || null,
      dominance: meta.dominance,
      confidence_level: meta.confidence_level,
      tone: meta.tone,
      score: typeof v.score === 'number' ? v.score : 0,
      certainty_note: meta.certainty_note || null,
    };

    if (meta.dominance === 'dominant') {
      headlines.push({
        ...entryBase,
        text: buildHeadlineText(meta, domain),
      });
      domainHeadlineTags.set(domain, tag);
    } else {
      supporting_notes.push({
        ...entryBase,
        text: buildSupportingNoteText(meta, domain),
      });
    }

    domainCounts.set(domain, used + 1);
  }

  // Applied tone is the tone of the first headline (if any), else null.
  const applied_tone = headlines.length ? headlines[0].tone : null;

  return {
    headlines,
    supporting_notes,
    suppressed_variants: suppressed,
    applied_tone,
  };
}


