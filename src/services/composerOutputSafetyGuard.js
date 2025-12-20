/**
 * Runtime Safety Guard (Non-blocking, deterministic)
 * --------------------------------------------------
 * Sits AFTER Prediction Composer and BEFORE:
 * - AI Narrative Polisher layer
 * - API/UI response rendering
 *
 * It does NOT:
 * - retry evaluation
 * - change composer logic
 * - modify composer output when validation passes
 *
 * Validation:
 * - At least one of:
 *   - composerOutput.headlines
 *   - composerOutput.supporting_notes
 *   must be non-empty
 *
 * Fallback behavior (when both empty):
 * - returns safe neutral output
 * - applied_tone: "informational"
 * - preserves suppressed_variants internally
 * - logs a soft warning with { domain, timestamp, reason: "empty_composer_output" }
 */

const SAFE_NEUTRAL_TEXT =
  'At this time, no strong signals stand out. This appears to be a neutral phase.';

function nowIso() {
  return new Date().toISOString();
}

function toArray(x) {
  return Array.isArray(x) ? x : [];
}

/**
 * @param {any} composerOutput
 * @param {{ domain?: string, logger?: { warn?: Function } }} options
 * @returns {any} composerOutput (pass-through) OR fallback composerOutput
 */
export function guardComposerOutput(composerOutput, { domain = 'general', logger = console } = {}) {
  const headlines = toArray(composerOutput?.headlines);
  const supporting = toArray(composerOutput?.supporting_notes);
  const suppressed = toArray(composerOutput?.suppressed_variants);

  if (headlines.length > 0 || supporting.length > 0) {
    return composerOutput;
  }

  // Soft warning (not error)
  try {
    if (logger && typeof logger.warn === 'function') {
      logger.warn({
        domain,
        timestamp: nowIso(),
        reason: 'empty_composer_output',
      });
    }
  } catch {
    // never throw from guard
  }

  // Non-blocking fallback: provide a minimal safe headline.
  return {
    applied_tone: 'informational',
    headlines: [
      {
        domain,
        text: SAFE_NEUTRAL_TEXT,
        confidence_level: 'low',
        dominance: 'background',
        certainty_note: null,
      },
    ],
    supporting_notes: [],
    suppressed_variants: suppressed,
  };
}

export const SAFE_NEUTRAL_COMPOSER_FALLBACK_TEXT = SAFE_NEUTRAL_TEXT;


