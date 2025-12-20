/**
 * Prediction Presentation Pipeline (Deterministic Orchestration)
 * -------------------------------------------------------------
 * This module shows the intended runtime order:
 *
 * Evaluation (LOCKED elsewhere) -> Composer (LOCKED elsewhere) -> Safety Guard -> Polisher/UI/API
 *
 * It does not modify evaluation or composer logic; it only orchestrates.
 */

import { composePrediction } from './predictionComposer.js';
import { guardComposerOutput } from './composerOutputSafetyGuard.js';

/**
 * @param {Array} matchedVariants - already-evaluated/matched variants
 * @param {{ domain?: string, composerOptions?: object, logger?: any }} options
 */
export function buildComposerOutputForDelivery(matchedVariants, { domain = 'general', composerOptions = {}, logger = console } = {}) {
  const composerOutput = composePrediction({ matchedVariants, ...composerOptions });
  return guardComposerOutput(composerOutput, { domain, logger });
}


