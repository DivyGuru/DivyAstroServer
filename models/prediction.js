import { query } from '../config/db.js';

/**
 * Create a new prediction
 */
export const createPrediction = async (predictionData) => {
  const {
    window_id,
    user_id,
    chart_id,
    scope,
    status = 'pending',
    language_code = 'hi',
    summary_json = null,
    short_summary = null,
    final_text = null,
    generated_by = null,
    highlight_on_home = false
  } = predictionData;

  const sql = `
    INSERT INTO predictions 
    (window_id, user_id, chart_id, scope, status, language_code, 
     summary_json, short_summary, final_text, generated_by, highlight_on_home, generated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
    RETURNING *
  `;

  const result = await query(sql, [
    window_id,
    user_id,
    chart_id,
    scope,
    status,
    language_code,
    summary_json ? JSON.stringify(summary_json) : null,
    short_summary,
    final_text,
    generated_by,
    highlight_on_home
  ]);

  return result.rows[0];
};

/**
 * Get predictions by user
 */
export const getPredictions = async (userId, scope = null, languageCode = 'hi', limit = 10) => {
  let sql = `
    SELECT p.*, pw.start_at, pw.end_at, pw.scope as window_scope
    FROM predictions p
    JOIN prediction_windows pw ON p.window_id = pw.id
    WHERE p.user_id = $1 AND p.language_code = $2
  `;
  const params = [userId, languageCode];

  if (scope) {
    sql += ` AND p.scope = $3`;
    params.push(scope);
    sql += ` ORDER BY p.generated_at DESC LIMIT $4`;
    params.push(limit);
  } else {
    sql += ` ORDER BY p.generated_at DESC LIMIT $3`;
    params.push(limit);
  }

  const result = await query(sql, params);
  return result.rows;
};

/**
 * Get highlighted predictions for home screen
 */
export const getHighlightedPredictions = async (userId, languageCode = 'hi', limit = 5) => {
  const sql = `
    SELECT p.*, pw.start_at, pw.end_at
    FROM predictions p
    JOIN prediction_windows pw ON p.window_id = pw.id
    WHERE p.user_id = $1 
      AND p.language_code = $2
      AND p.highlight_on_home = true
      AND p.status = 'generated'
    ORDER BY p.generated_at DESC
    LIMIT $3
  `;

  const result = await query(sql, [userId, languageCode, limit]);
  return result.rows;
};

/**
 * Get a single prediction by ID
 */
export const getPredictionById = async (predictionId) => {
  const sql = `
    SELECT p.*, pw.start_at, pw.end_at, pw.scope as window_scope
    FROM predictions p
    JOIN prediction_windows pw ON p.window_id = pw.id
    WHERE p.id = $1
  `;
  const result = await query(sql, [predictionId]);
  return result.rows[0];
};

/**
 * Update prediction
 */
export const updatePrediction = async (predictionId, updates) => {
  const allowedFields = ['status', 'summary_json', 'short_summary', 'final_text', 'highlight_on_home', 'error_message'];
  const setClause = [];
  const values = [];
  let paramIndex = 1;

  for (const [key, value] of Object.entries(updates)) {
    if (allowedFields.includes(key)) {
      if (key === 'summary_json' && typeof value === 'object') {
        setClause.push(`${key} = $${paramIndex}::jsonb`);
        values.push(JSON.stringify(value));
      } else {
        setClause.push(`${key} = $${paramIndex}`);
        values.push(value);
      }
      paramIndex++;
    }
  }

  if (setClause.length === 0) {
    throw new Error('No valid fields to update');
  }

  if (updates.status === 'generated') {
    setClause.push(`generated_at = NOW()`);
  }

  values.push(predictionId);
  const sql = `
    UPDATE predictions
    SET ${setClause.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING *
  `;

  const result = await query(sql, values);
  return result.rows[0];
};

