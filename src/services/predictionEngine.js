import { query } from '../../config/db.js';
import {
  evaluateRulesForWindow,
  aggregateThemeScores,
  buildShortSummary,
} from '../engine/ruleEvaluator.js';

/**
 * Core prediction generation logic for a given window.
 * Shared between CLI script and HTTP API.
 *
 * @param {number} windowId
 * @param {{ language?: string }} options
 * @returns {Promise<{ predictionId: number, prediction: any, summary: any, shortSummary: string|null, applied: any[] }>}
 */
export async function generatePredictionForWindowCore(windowId, { language = 'en' } = {}) {
  if (!windowId || Number.isNaN(Number(windowId))) {
    throw new Error('WINDOW_ID missing or invalid');
  }

  const winRes = await query(
    'SELECT id, scope, user_id, chart_id FROM prediction_windows WHERE id = $1',
    [windowId]
  );
  if (winRes.rowCount === 0) {
    throw new Error(`prediction_window not found: id=${windowId}`);
  }
  const windowRow = winRes.rows[0];
  const scope = windowRow.scope;

  // Load astro snapshot
  const astroRes = await query('SELECT * FROM astro_state_snapshots WHERE window_id = $1', [
    windowId,
  ]);
  if (astroRes.rowCount === 0) {
    throw new Error(`astro_state_snapshot not found for window_id=${windowId}`);
  }
  const astroRow = astroRes.rows[0];

  // Load active rules for this scope
  // Universal Knowledge-Aware: Use EXECUTABLE rules (READY status) for execution
  // ADVISORY and OBSERVATIONAL rules can be included for context if needed
  const rulesRes = await query(
    `SELECT * FROM rules 
     WHERE is_active = TRUE 
       AND $1 = ANY(applicable_scopes)
       AND (execution_status = 'READY' OR execution_status IS NULL)
     ORDER BY 
       CASE rule_nature 
         WHEN 'EXECUTABLE' THEN 1
         WHEN 'ADVISORY' THEN 2
         WHEN 'OBSERVATIONAL' THEN 3
         ELSE 4
       END,
       confidence_level DESC NULLS LAST`,
    [scope]
  );
  const rules = rulesRes.rows;

  // Evaluate rules
  const applied = evaluateRulesForWindow({ rules, astroRow, windowScope: scope });

  // Aggregate theme scores
  const summary = aggregateThemeScores(applied);
  const shortSummary = buildShortSummary(summary, language);

  // Upsert prediction row (one per window + language)
  const insertPredSql = `
    INSERT INTO predictions (
      window_id,
      user_id,
      chart_id,
      scope,
      status,
      language_code,
      summary_json,
      short_summary,
      generated_by,
      generated_at
    )
    VALUES (
      $1, $2, $3, $4,
      'generated',
      $5,
      $6::jsonb,
      $7,
      $8,
      NOW()
    )
    ON CONFLICT (window_id, language_code)
    DO UPDATE SET
      status = EXCLUDED.status,
      summary_json = EXCLUDED.summary_json,
      short_summary = EXCLUDED.short_summary,
      generated_by = EXCLUDED.generated_by,
      generated_at = EXCLUDED.generated_at
    RETURNING *;
  `;

  const predRes = await query(insertPredSql, [
    windowRow.id,
    windowRow.user_id,
    windowRow.chart_id,
    scope,
    language,
    JSON.stringify(summary),
    shortSummary || null,
    'rule_engine_v1',
  ]);

  const predictionRow = predRes.rows[0];
  const predictionId = predictionRow.id;

  // Clear existing applied rules for this prediction (idempotent)
  await query('DELETE FROM prediction_applied_rules WHERE prediction_id = $1', [predictionId]);

  // Insert prediction_applied_rules
  const insertAppliedSql = `
    INSERT INTO prediction_applied_rules (
      prediction_id,
      rule_id,
      weight,
      score,
      effect_json,
      explanation_snippet
    )
    VALUES (
      $1, $2, $3, $4, $5::jsonb, $6
    )
    RETURNING id;
  `;

  for (const r of applied) {
    const weight = typeof r.weight === 'number' ? r.weight : 1.0;
    const effectJson = r.effect_json || {};
    // eslint-disable-next-line no-await-in-loop
    await query(insertAppliedSql, [
      predictionId,
      r.ruleId,
      weight,
      r.score,
      JSON.stringify(effectJson),
      null,
    ]);
  }

  // Link remedies to prediction based on applied rules' point_codes
  // Clear existing recommended remedies (idempotent)
  await query('DELETE FROM prediction_recommended_remedies WHERE prediction_id = $1', [predictionId]);

  // Get unique point_codes from applied rules
  const pointCodes = [...new Set(applied.map(r => r.pointCode).filter(Boolean))];
  
  if (pointCodes.length > 0) {
    // Find remedies that match these point_codes (remedy name pattern: [POINT_CODE] ...)
    const remedyPatterns = pointCodes.map(pc => `[${pc}]%`);
    const remedyPlaceholders = remedyPatterns.map((_, i) => `$${i + 1}`).join(', ');
    
    const remediesRes = await query(
      `SELECT id, name, type, description, target_themes, min_duration_days, recommended_frequency, safety_notes
       FROM remedies
       WHERE is_active = TRUE
         AND (${remedyPatterns.map((_, i) => `name LIKE $${i + 1}`).join(' OR ')})
       ORDER BY name
       LIMIT 50`,
      remedyPatterns
    );

    // Insert prediction_recommended_remedies
    // Priority: higher score rules get higher priority remedies
    const pointCodeToScore = {};
    for (const r of applied) {
      if (r.pointCode && r.score) {
        pointCodeToScore[r.pointCode] = Math.max(
          pointCodeToScore[r.pointCode] || 0,
          r.score
        );
      }
    }

    const insertRemedySql = `
      INSERT INTO prediction_recommended_remedies (
        prediction_id,
        remedy_id,
        suggested_by_rule_id,
        reason_json,
        priority
      )
      VALUES ($1, $2, NULL, $3::jsonb, $4)
      RETURNING id;
    `;

    for (const remedy of remediesRes.rows) {
      // Extract point_code from remedy name
      const match = remedy.name.match(/^\[([^\]]+)\]/);
      const remedyPointCode = match ? match[1] : null;
      const priority = remedyPointCode && pointCodeToScore[remedyPointCode]
        ? Math.round(pointCodeToScore[remedyPointCode] * 10)
        : 0;

      // eslint-disable-next-line no-await-in-loop
      await query(insertRemedySql, [
        predictionId,
        remedy.id,
        JSON.stringify({ point_code: remedyPointCode, theme: remedy.target_themes?.[0] || null }),
        priority,
      ]);
    }
  }

  return {
    predictionId,
    prediction: predictionRow,
    summary,
    shortSummary: shortSummary || null,
    applied,
  };
}


