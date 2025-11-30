import { query } from '../config/db.js';

/**
 * Create a new prediction window
 */
export const createPredictionWindow = async (windowData) => {
  const {
    user_id,
    chart_id,
    scope,
    start_at,
    end_at,
    dasha_level = null,
    dasha_id = null,
    sub_scope_code = null,
    timezone = 'Asia/Kolkata',
    is_processed = false
  } = windowData;

  const sql = `
    INSERT INTO prediction_windows 
    (user_id, chart_id, scope, start_at, end_at, dasha_level, dasha_id, sub_scope_code, timezone, is_processed)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *
  `;

  const result = await query(sql, [
    user_id,
    chart_id,
    scope,
    start_at,
    end_at,
    dasha_level,
    dasha_id,
    sub_scope_code,
    timezone,
    is_processed
  ]);

  return result.rows[0];
};

/**
 * Get prediction windows by user and scope
 */
export const getPredictionWindows = async (userId, scope = null, limit = 10) => {
  let sql = `
    SELECT * FROM prediction_windows
    WHERE user_id = $1
  `;
  const params = [userId];

  if (scope) {
    sql += ` AND scope = $2`;
    params.push(scope);
    sql += ` ORDER BY start_at DESC LIMIT $3`;
    params.push(limit);
  } else {
    sql += ` ORDER BY created_at DESC LIMIT $2`;
    params.push(limit);
  }

  const result = await query(sql, params);
  return result.rows;
};

/**
 * Get a single prediction window by ID
 */
export const getPredictionWindowById = async (windowId) => {
  const sql = `SELECT * FROM prediction_windows WHERE id = $1`;
  const result = await query(sql, [windowId]);
  return result.rows[0];
};

/**
 * Update prediction window
 */
export const updatePredictionWindow = async (windowId, updates) => {
  const allowedFields = ['is_processed', 'sub_scope_code', 'start_at', 'end_at'];
  const setClause = [];
  const values = [];
  let paramIndex = 1;

  for (const [key, value] of Object.entries(updates)) {
    if (allowedFields.includes(key)) {
      setClause.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
  }

  if (setClause.length === 0) {
    throw new Error('No valid fields to update');
  }

  values.push(windowId);
  const sql = `
    UPDATE prediction_windows
    SET ${setClause.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING *
  `;

  const result = await query(sql, values);
  return result.rows[0];
};

