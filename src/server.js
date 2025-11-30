#!/usr/bin/env node

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { query } from '../config/db.js';
import { generatePredictionForWindowCore } from './services/predictionEngine.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ---- Health check -----------------------------------------------------------

app.get('/health', async (req, res) => {
  try {
    await query('SELECT 1');
    res.json({ status: 'ok' });
  } catch (err) {
    res.status(500).json({ status: 'error', error: err.message });
  }
});

// ---- Generate prediction for a window --------------------------------------

app.post('/windows/:windowId/generate', async (req, res) => {
  const windowId = Number(req.params.windowId);
  const language = (req.body && req.body.language) || 'en';

  try {
    const result = await generatePredictionForWindowCore(windowId, { language });
    
    // Fetch remedies for this prediction
    const remediesRes = await query(
      `
      SELECT
        prr.id,
        prr.prediction_id,
        prr.remedy_id,
        prr.suggested_by_rule_id,
        prr.reason_json,
        prr.priority,
        r.name,
        r.type,
        r.description,
        r.target_planets,
        r.target_themes,
        r.min_duration_days,
        r.recommended_frequency,
        r.safety_notes
      FROM prediction_recommended_remedies prr
      JOIN remedies r ON r.id = prr.remedy_id
      WHERE prr.prediction_id = $1
        AND r.is_active = TRUE
      ORDER BY prr.priority DESC, prr.id ASC;
      `,
      [result.predictionId]
    );

    res.json({
      ok: true,
      windowId,
      predictionId: result.predictionId,
      prediction: result.prediction,
      summary: result.summary,
      shortSummary: result.shortSummary,
      appliedRuleCount: result.applied.length,
      remedies: remediesRes.rows,
    });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// ---- User management --------------------------------------------------------

/**
 * Get or create user from Firebase UID
 * POST /users/ensure
 * Body: { firebaseUid: string, email?: string, phone?: string }
 */
app.post('/users/ensure', async (req, res) => {
  const { firebaseUid, email, phone } = req.body;

  if (!firebaseUid) {
    return res.status(400).json({ ok: false, error: 'firebaseUid is required' });
  }

  try {
    // Check if user exists
    const existingRes = await query(
      'SELECT * FROM app_users WHERE firebase_uid = $1',
      [firebaseUid]
    );

    if (existingRes.rowCount > 0) {
      // Update email/phone if provided
      if (email || phone) {
        const updateRes = await query(
          `UPDATE app_users 
           SET email = COALESCE($2, email),
               phone = COALESCE($3, phone),
               updated_at = NOW()
           WHERE firebase_uid = $1
           RETURNING *`,
          [firebaseUid, email || null, phone || null]
        );
        return res.json({ ok: true, user: updateRes.rows[0] });
      }
      return res.json({ ok: true, user: existingRes.rows[0] });
    }

    // Create new user
    const insertRes = await query(
      `INSERT INTO app_users (firebase_uid, email, phone)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [firebaseUid, email || null, phone || null]
    );

    return res.json({ ok: true, user: insertRes.rows[0] });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ---- Window management -------------------------------------------------------

/**
 * Create a new prediction window
 * POST /windows
 * Body: {
 *   user_id: number,
 *   chart_id: number,
 *   scope: 'daily' | 'weekly' | ...,
 *   start_at: ISO string,
 *   end_at: ISO string,
 *   timezone: string
 * }
 */
app.post('/windows', async (req, res) => {
  const { user_id, chart_id, scope, start_at, end_at, timezone = 'Asia/Kolkata', chart_data } = req.body;

  if (!user_id || !chart_id || !scope) {
    return res.status(400).json({
      ok: false,
      error: 'user_id, chart_id, and scope are required',
    });
  }

  // Validate scope
  const validScopes = [
    'hourly',
    'choghadiya',
    'daily',
    'weekly',
    'monthly',
    'yearly',
    'mahadasha',
    'antardasha',
    'pratyantardasha',
    'life_theme',
  ];
  if (!validScopes.includes(scope)) {
    return res.status(400).json({
      ok: false,
      error: `Invalid scope. Must be one of: ${validScopes.join(', ')}`,
    });
  }

  try {
    // Check if window already exists for this user/chart/scope/time
    if (start_at && end_at) {
      const existingRes = await query(
        `SELECT id FROM prediction_windows
         WHERE user_id = $1
           AND chart_id = $2
           AND scope = $3
           AND start_at = $4
           AND end_at = $5
         LIMIT 1`,
        [user_id, chart_id, scope, start_at, end_at]
      );

      if (existingRes.rowCount > 0) {
        const existingWindow = existingRes.rows[0];
        
        // Check if snapshot exists for this window
        const snapshotRes = await query(
          'SELECT id FROM astro_state_snapshots WHERE window_id = $1',
          [existingWindow.id]
        );
        
        // If window exists but no snapshot, and chart_data provided, create snapshot
        if (snapshotRes.rowCount === 0 && chart_data) {
          await createAstroSnapshotFromChartData(
            existingWindow.id,
            user_id,
            chart_id,
            chart_data
          );
        }
        
        return res.json({
          ok: true,
          window: existingWindow,
          alreadyExists: true,
        });
      }
    }

    // Create new window
    const insertRes = await query(
      `INSERT INTO prediction_windows (
         user_id, chart_id, scope, start_at, end_at, timezone
       )
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [user_id, chart_id, scope, start_at || null, end_at || null, timezone]
    );

    const newWindow = insertRes.rows[0];

    // If chart_data provided, create astro_state_snapshot
    if (chart_data) {
      try {
        await createAstroSnapshotFromChartData(
          newWindow.id,
          user_id,
          chart_id,
          chart_data
        );
      } catch (snapshotErr) {
        console.error('Error creating astro snapshot:', snapshotErr);
        // Continue even if snapshot creation fails - window is created
      }
    }

    return res.json({ ok: true, window: newWindow });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * Helper function: Create astro_state_snapshot from Swiss Ephemeris chart_data
 */
async function createAstroSnapshotFromChartData(windowId, userId, chartId, chartData) {
  // Extract planets from Swiss Ephemeris response
  // Chart data structure: { planets: [...], houses: [...], etc. }
  const planets = chartData.planets || chartData.planetsData || [];
  
  // Build planets_state array
  const planets_state = planets.map((p) => ({
    planet: p.name || p.planet || p.id,
    house: p.house || p.h || null,
    sign: p.sign || p.s || null,
    degree: p.longitude || p.long || p.position || null,
    nakshatra: p.nakshatra || p.nakshatraId || null,
    pada: p.pada || null,
    is_retro: p.isRetrograde || p.retrograde || false,
    strength: p.strength || null,
  })).filter((p) => p.planet); // Filter out invalid entries

  // Extract other data
  const houses_state = chartData.houses || chartData.housesData || null;
  const yogas_state = chartData.yogas || chartData.yogasData || [];
  const doshas_state = chartData.doshas || chartData.doshasData || [];
  const transits_state = chartData.transits || chartData.transitsData || [];

  // Extract basic info
  const lagna_sign = chartData.lagna?.sign || chartData.lagnaSign || null;
  const moon_sign = chartData.moon?.sign || chartData.moonSign || null;
  const moon_nakshatra = chartData.moon?.nakshatra || chartData.moonNakshatra || null;

  // Check if snapshot already exists
  const existing = await query(
    'SELECT id FROM astro_state_snapshots WHERE window_id = $1',
    [windowId]
  );
  
  if (existing.rowCount > 0) {
    // Update existing snapshot
    await query(
      `UPDATE astro_state_snapshots
       SET planets_state = $1::jsonb,
           houses_state = $2::jsonb,
           yogas_state = $3::jsonb,
           doshas_state = $4::jsonb,
           transits_state = $5::jsonb,
           lagna_sign = $6,
           moon_sign = $7,
           moon_nakshatra = $8,
           computed_at = NOW()
       WHERE window_id = $9`,
      [
        JSON.stringify(planets_state),
        JSON.stringify(houses_state),
        JSON.stringify(yogas_state),
        JSON.stringify(doshas_state),
        JSON.stringify(transits_state),
        lagna_sign,
        moon_sign,
        moon_nakshatra,
        windowId,
      ]
    );
  } else {
    // Create new snapshot
    await query(
      `INSERT INTO astro_state_snapshots (
         user_id, chart_id, window_id,
         lagna_sign, moon_sign, moon_nakshatra,
         planets_state, houses_state, yogas_state, doshas_state, transits_state
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9::jsonb, $10::jsonb, $11::jsonb)
       RETURNING id`,
      [
        userId,
        chartId,
        windowId,
        lagna_sign,
        moon_sign,
        moon_nakshatra,
        JSON.stringify(planets_state),
        JSON.stringify(houses_state),
        JSON.stringify(yogas_state),
        JSON.stringify(doshas_state),
        JSON.stringify(transits_state),
      ]
    );
  }
}

/**
 * Get windows for a user (by Firebase UID)
 * GET /users/:firebaseUid/windows?scope=daily&date=2024-01-15
 */
app.get('/users/:firebaseUid/windows', async (req, res) => {
  const { firebaseUid } = req.params;
  const { scope, date } = req.query;

  try {
    // Get user_id from firebase_uid
    const userRes = await query('SELECT id FROM app_users WHERE firebase_uid = $1', [
      firebaseUid,
    ]);

    if (userRes.rowCount === 0) {
      return res.status(404).json({ ok: false, error: 'User not found' });
    }

    const userId = userRes.rows[0].id;

    // Build query
    let sql = 'SELECT * FROM prediction_windows WHERE user_id = $1';
    const params = [userId];

    if (scope) {
      sql += ' AND scope = $2';
      params.push(scope);
    }

    if (date) {
      // Find windows that contain this date
      sql += ` AND start_at <= $${params.length + 1}::date
               AND end_at >= $${params.length + 1}::date`;
      params.push(date);
    }

    sql += ' ORDER BY start_at DESC, created_at DESC';

    const windowsRes = await query(sql, params);

    return res.json({
      ok: true,
      windows: windowsRes.rows,
      count: windowsRes.rowCount,
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ---- Create astro snapshot for existing window ---------------------------

/**
 * Create or update astro_state_snapshot for an existing window
 * POST /windows/:windowId/astro-snapshot
 * Body: { chart_data: {...} }
 */
app.post('/windows/:windowId/astro-snapshot', async (req, res) => {
  const windowId = Number(req.params.windowId);
  const { chart_data } = req.body;

  if (!chart_data) {
    return res.status(400).json({
      ok: false,
      error: 'chart_data is required',
    });
  }

  try {
    // Check window exists
    const winRes = await query(
      'SELECT id, user_id, chart_id FROM prediction_windows WHERE id = $1',
      [windowId]
    );

    if (winRes.rowCount === 0) {
      return res.status(404).json({
        ok: false,
        error: 'Prediction window not found',
      });
    }

    const window = winRes.rows[0];

    // Create/update snapshot
    await createAstroSnapshotFromChartData(
      windowId,
      window.user_id,
      window.chart_id,
      chart_data
    );

    return res.json({
      ok: true,
      message: 'Astro snapshot created/updated successfully',
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ---- Get prediction + applied rules for a window ---------------------------

app.get('/predictions/:windowId', async (req, res) => {
  const windowId = Number(req.params.windowId);
  const language = req.query.lang || 'en';

  try {
    // Fetch prediction row (prefer given language)
    const predRes = await query(
      `
      SELECT *
      FROM predictions
      WHERE window_id = $1
        AND language_code = $2
      ORDER BY id DESC
      LIMIT 1;
      `,
      [windowId, language]
    );

    let prediction;
    let needsRegeneration = false;

    if (predRes.rowCount === 0) {
      // No prediction exists - need to generate
      needsRegeneration = true;
    } else {
      prediction = predRes.rows[0];
      // Check if prediction is empty/incomplete
      const themes = prediction.summary_json?.themes || {};
      const themesCount = Object.keys(themes).length;
      if (!prediction.short_summary || themesCount === 0) {
        // Prediction exists but is empty - regenerate
        needsRegeneration = true;
      }
    }

    // Auto-regenerate if needed
    if (needsRegeneration) {
      try {
        const result = await generatePredictionForWindowCore(windowId, { language });
        prediction = result.prediction;
      } catch (genErr) {
        // If generation fails, return 404 or existing empty prediction
        if (predRes.rowCount === 0) {
          return res.status(404).json({ ok: false, error: 'Prediction not found and generation failed: ' + genErr.message });
        }
        // Return existing prediction even if empty
        prediction = predRes.rows[0];
      }
    }

    // Fetch applied rules with basic rule metadata
    const appliedRes = await query(
      `
      SELECT
        par.*,
        r.point_code,
        r.effect_json AS rule_effect_json
      FROM prediction_applied_rules par
      JOIN rules r ON r.id = par.rule_id
      WHERE par.prediction_id = $1
      ORDER BY par.score DESC NULLS LAST, par.id ASC;
      `,
      [prediction.id]
    );

    // Fetch recommended remedies
    const remediesRes = await query(
      `
      SELECT
        prr.id,
        prr.prediction_id,
        prr.remedy_id,
        prr.suggested_by_rule_id,
        prr.reason_json,
        prr.priority,
        r.name,
        r.type,
        r.description,
        r.target_planets,
        r.target_themes,
        r.min_duration_days,
        r.recommended_frequency,
        r.safety_notes
      FROM prediction_recommended_remedies prr
      JOIN remedies r ON r.id = prr.remedy_id
      WHERE prr.prediction_id = $1
        AND r.is_active = TRUE
      ORDER BY prr.priority DESC, prr.id ASC;
      `,
      [prediction.id]
    );

    return res.json({
      ok: true,
      prediction,
      appliedRules: appliedRes.rows,
      remedies: remediesRes.rows,
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ---- Start server ----------------------------------------------------------

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`🚀 API server listening on http://localhost:${PORT}`);
});


