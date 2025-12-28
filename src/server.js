#!/usr/bin/env node

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { query } from '../config/db.js';
import { generatePredictionForWindowCore } from './services/predictionEngine.js';
import { generateKundli } from './services/kundliGeneration.js';
import { findBestMonthYearWindowsForPoint } from './services/timingWindowFinder.js';
import { getWindowDatesForScope } from './services/windowHelpers.js';

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

    // Clean prediction object - remove internal debugging data
    const cleanPrediction = result.prediction ? {
      id: result.prediction.id,
      window_id: result.prediction.window_id,
      user_id: result.prediction.user_id,
      chart_id: result.prediction.chart_id,
      scope: result.prediction.scope,
      status: result.prediction.status,
      language_code: result.prediction.language_code,
      short_summary: result.prediction.short_summary,
      final_text: result.prediction.final_text,
      highlight_on_home: result.prediction.highlight_on_home,
      generated_at: result.prediction.generated_at,
      // Exclude summary_json (internal rule IDs - not needed by mobile app)
      // Exclude error_message (internal debugging)
    } : null;

    res.json({
      ok: true,
      windowId,
      predictionId: result.predictionId,
      prediction: cleanPrediction,
      shortSummary: result.shortSummary,
      appliedRuleCount: result.applied.length,
      remedies: remediesRes.rows,
      // Exclude summary and ruleExecutionInfo (internal debugging data)
      // Mobile app doesn't need rule execution metadata
    });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// ---- Kundli Generation (New Pipeline) ----------------------------------------

/**
 * GET /kundli/:windowId
 * 
 * Returns kundli-ready JSON using the new pipeline:
 * Signal Aggregation → Time Patch Engine → Narrative Composer
 * 
 * Query parameters:
 * - scope (optional): 'daily' | 'monthly' | 'yearly' - If provided, ensures window has correct scope
 * 
 * Response format:
 * {
 *   meta: { window_id, generated_at, overall_confidence },
 *   sections: [
 *     {
 *       domain: string,
 *       summary_metrics: { pressure, support, stability, confidence },
 *       time_windows: { years: [], months: [] },
 *       narrative: string,
 *       remedy_hook?: { message, cta },
 *       remedies?: Array<{ type, title, description, frequency, duration }>
 *     }
 *   ]
 * }
 */
app.get('/kundli/:windowId', async (req, res) => {
  const windowId = Number(req.params.windowId);
  const { scope } = req.query;

  if (!windowId || Number.isNaN(windowId)) {
    return res.status(400).json({ ok: false, error: 'Invalid window_id' });
  }

  try {
    // If scope is provided, validate window scope matches
    if (scope) {
      const validScopes = ['daily', 'monthly', 'yearly'];
      if (!validScopes.includes(scope)) {
        return res.status(400).json({ 
          ok: false, 
          error: `Invalid scope. Must be one of: ${validScopes.join(', ')}` 
        });
      }
      
      // Check window scope
      const windowRes = await query(
        'SELECT scope FROM prediction_windows WHERE id = $1',
        [windowId]
      );
      
      if (windowRes.rowCount === 0) {
        return res.status(404).json({ 
          ok: false, 
          error: `Window not found: ${windowId}` 
        });
      }
      
      const windowScope = windowRes.rows[0].scope;
      if (windowScope !== scope) {
        return res.status(400).json({ 
          ok: false, 
          error: `Window scope mismatch. Expected: ${scope}, Found: ${windowScope}` 
        });
      }
    }
    
    const kundli = await generateKundli(windowId);
    
    return res.json({
      ok: true,
      ...kundli
    });
  } catch (err) {
    console.error('Kundli generation failed:', err);
    return res.status(500).json({ 
      ok: false, 
      error: err.message || 'Failed to generate kundli' 
    });
  }
});

/**
 * GET /kundli/monthly/:windowId
 * 
 * Convenience endpoint for monthly kundli.
 * Validates that window scope is 'monthly' before generating kundli.
 */
app.get('/kundli/monthly/:windowId', async (req, res) => {
  const windowId = Number(req.params.windowId);

  if (!windowId || Number.isNaN(windowId)) {
    return res.status(400).json({ ok: false, error: 'Invalid window_id' });
  }

  try {
    // Validate window scope
    const windowRes = await query(
      'SELECT scope FROM prediction_windows WHERE id = $1',
      [windowId]
    );
    
    if (windowRes.rowCount === 0) {
      return res.status(404).json({ 
        ok: false, 
        error: `Window not found: ${windowId}` 
      });
    }
    
    const windowScope = windowRes.rows[0].scope;
    if (windowScope !== 'monthly') {
      return res.status(400).json({ 
        ok: false, 
        error: `Window scope must be 'monthly'. Found: ${windowScope}` 
      });
    }
    
    const kundli = await generateKundli(windowId);
    
    return res.json({
      ok: true,
      ...kundli
    });
  } catch (err) {
    console.error('Monthly kundli generation failed:', err);
    return res.status(500).json({ 
      ok: false, 
      error: err.message || 'Failed to generate monthly kundli' 
    });
  }
});

/**
 * GET /kundli/yearly/:windowId
 * 
 * Convenience endpoint for yearly kundli.
 * Validates that window scope is 'yearly' before generating kundli.
 */
app.get('/kundli/yearly/:windowId', async (req, res) => {
  const windowId = Number(req.params.windowId);

  if (!windowId || Number.isNaN(windowId)) {
    return res.status(400).json({ ok: false, error: 'Invalid window_id' });
  }

  try {
    // Validate window scope
    const windowRes = await query(
      'SELECT scope FROM prediction_windows WHERE id = $1',
      [windowId]
    );
    
    if (windowRes.rowCount === 0) {
      return res.status(404).json({ 
        ok: false, 
        error: `Window not found: ${windowId}` 
      });
    }
    
    const windowScope = windowRes.rows[0].scope;
    if (windowScope !== 'yearly') {
      return res.status(400).json({ 
        ok: false, 
        error: `Window scope must be 'yearly'. Found: ${windowScope}` 
      });
    }
    
    const kundli = await generateKundli(windowId);
    
    return res.json({
      ok: true,
      ...kundli
    });
  } catch (err) {
    console.error('Yearly kundli generation failed:', err);
    return res.status(500).json({ 
      ok: false, 
      error: err.message || 'Failed to generate yearly kundli' 
    });
  }
});

/**
 * GET /varshfal/:windowId
 * 
 * Returns Varshfal-style (Annual Predictions) data for yearly windows.
 * Similar to sample PDF structure: Muntha + Year Timeline with Dasha Periods.
 * 
 * Response format:
 * {
 *   ok: true,
 *   meta: { window_id, generated_at, year },
 *   details: { lagna, moon, ... },
 *   muntha: { house, narrative } | null,
 *   timeline_periods: [
 *     { from, to, dasha_planet, bhav, narrative }
 *   ]
 * }
 */
app.get('/varshfal/:windowId', async (req, res) => {
  const windowId = Number(req.params.windowId);

  if (!windowId || Number.isNaN(windowId)) {
    return res.status(400).json({ ok: false, error: 'Invalid window_id' });
  }

  try {
    const { generateVarshfal } = await import('./services/varshfalGeneration.js');
    const varshfal = await generateVarshfal(windowId);
    
    return res.json({
      ok: true,
      ...varshfal
    });
  } catch (err) {
    console.error('Varshfal generation failed:', err);
    return res.status(500).json({ 
      ok: false, 
      error: err.message || 'Failed to generate varshfal' 
    });
  }
});

/**
 * GET /mahadasha-phal/:windowId
 * 
 * Returns Vimshottari Mahadasha Phal (Dasha Predictions) data.
 * Similar to sample PDF structure: All Mahadasha periods with planet positions and narratives.
 * 
 * Response format:
 * {
 *   ok: true,
 *   meta: { window_id, generated_at, birth_date },
 *   mahadasha_periods: [
 *     {
 *       planet: string,
 *       from: string (ISO date),
 *       to: string (ISO date),
 *       planet_position: { sign, signName, house } | null,
 *       narrative: string,
 *       is_current: boolean
 *     }
 *   ]
 * }
 */
app.get('/mahadasha-phal/:windowId', async (req, res) => {
  const windowId = Number(req.params.windowId);

  if (!windowId || Number.isNaN(windowId)) {
    return res.status(400).json({ ok: false, error: 'Invalid window_id' });
  }

  try {
    const { generateMahadashaPhal } = await import('./services/mahadashaPhalGeneration.js');
    const mahadashaPhal = await generateMahadashaPhal(windowId);
    
    return res.json({
      ok: true,
      ...mahadashaPhal
    });
  } catch (err) {
    console.error('Mahadasha Phal generation failed:', err);
    return res.status(500).json({ 
      ok: false, 
      error: err.message || 'Failed to generate mahadasha phal' 
    });
  }
});

/**
 * GET /transit-today/:windowId?date=2025-12-22
 * 
 * Returns Transit Today data for a specific date.
 * Similar to sample PDF structure: Each planet's transit position with narrative.
 * 
 * Query Parameters:
 * - date (optional): Target date in ISO format (YYYY-MM-DD). Defaults to today.
 * 
 * Response format:
 * {
 *   ok: true,
 *   meta: { window_id, generated_at, date },
 *   transits: [
 *     {
 *       planet: string,
 *       sign: number,
 *       signName: string,
 *       house: number,
 *       longitude: number,
 *       narrative: string
 *     }
 *   ]
 * }
 */
app.get('/transit-today/:windowId', async (req, res) => {
  const windowId = Number(req.params.windowId);
  const { date } = req.query; // Optional date parameter

  if (!windowId || Number.isNaN(windowId)) {
    return res.status(400).json({ ok: false, error: 'Invalid window_id' });
  }

  try {
    const { generateTransitToday } = await import('./services/transitTodayGeneration.js');
    const transitToday = await generateTransitToday(windowId, date);
    
    return res.json({
      ok: true,
      ...transitToday
    });
  } catch (err) {
    console.error('Transit Today generation failed:', err);
    return res.status(500).json({ 
      ok: false, 
      error: err.message || 'Failed to generate transit today' 
    });
  }
});

/**
 * GET /lalkitab-prediction/:windowId
 * 
 * Returns Lal Kitab Prediction data based on planet positions.
 * Similar to sample PDF structure: Planet in house predictions with remedies.
 * 
 * Response format:
 * {
 *   ok: true,
 *   meta: { window_id, generated_at },
 *   predictions: [
 *     {
 *       planet: string,
 *       house: number,
 *       narrative: string,
 *       remedies: [
 *         {
 *           number: number,
 *           description: string
 *         }
 *       ] | null
 *     }
 *   ]
 * }
 */
app.get('/lalkitab-prediction/:windowId', async (req, res) => {
  const windowId = Number(req.params.windowId);

  console.log(`[GET /lalkitab-prediction/${windowId}] Request received`);

  if (!windowId || Number.isNaN(windowId)) {
    return res.status(400).json({ ok: false, error: 'Invalid window_id' });
  }

  try {
    const { generateLalkitabPrediction } = await import('./services/lalkitabPredictionGeneration.js');
    console.log(`[GET /lalkitab-prediction/${windowId}] Service imported, calling generateLalkitabPrediction`);
    const lalkitabPrediction = await generateLalkitabPrediction(windowId);
    console.log(`[GET /lalkitab-prediction/${windowId}] Generated ${lalkitabPrediction.predictions?.length || 0} predictions`);
    
    return res.json({
      ok: true,
      ...lalkitabPrediction
    });
  } catch (err) {
    console.error(`[GET /lalkitab-prediction/${windowId}] Error:`, err);
    return res.status(500).json({ 
      ok: false, 
      error: err.message || 'Failed to generate lalkitab prediction' 
    });
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
  const { user_id, chart_id, scope, start_at, end_at, timezone = 'Asia/Kolkata', chart_data, date } = req.body;

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
    // For time-based scopes (daily, monthly, yearly), auto-generate dates if not provided
    let finalStartAt = start_at;
    let finalEndAt = end_at;
    
    if (['daily', 'monthly', 'yearly'].includes(scope)) {
      if (!start_at || !end_at) {
        // Use provided date or current date
        const targetDate = date ? new Date(date) : new Date();
        const windowDates = getWindowDatesForScope(scope, targetDate, timezone);
        finalStartAt = windowDates.start_at;
        finalEndAt = windowDates.end_at;
      }
    }
    
    // Check if window already exists for this user/chart/scope/time
    // For yearly windows, we need exact start_at match (not just date range overlap)
    if (finalStartAt && finalEndAt) {
      let existingRes;
      
      if (scope === 'yearly') {
        // For yearly windows, check exact start_at match (to avoid returning old windows)
        existingRes = await query(
          `SELECT id FROM prediction_windows
           WHERE user_id = $1
             AND chart_id = $2
             AND scope = $3
             AND start_at = $4
           LIMIT 1`,
          [user_id, chart_id, scope, finalStartAt]
        );
      } else {
        // For other scopes, check both start_at and end_at
        existingRes = await query(
          `SELECT id FROM prediction_windows
           WHERE user_id = $1
             AND chart_id = $2
             AND scope = $3
             AND start_at = $4
             AND end_at = $5
           LIMIT 1`,
          [user_id, chart_id, scope, finalStartAt, finalEndAt]
        );
      }

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
      [user_id, chart_id, scope, finalStartAt || null, finalEndAt || null, timezone]
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
  // Normalize helpers: client sometimes sends inconsistent sign indices (e.g., 13 for Rahu)
  // We treat longitude as authoritative and compute sign as 1..12.
  function normalizeSignFromLongitude(longitude) {
    const lon = Number(longitude);
    if (!Number.isFinite(lon)) return null;
    // Normalize to [0, 360)
    const norm = ((lon % 360) + 360) % 360;
    const sign = Math.floor(norm / 30) + 1; // 1..12
    if (sign < 1 || sign > 12) return null;
    return sign;
  }

  function normalizeSignFallback(signNumber) {
    const s = Number(signNumber);
    if (!Number.isFinite(s)) return null;
    // Many clients send 0-based sign indices (0..11). Normalize those first.
    // 0=Aries ... 11=Pisces  => +1 to make 1..12
    if (Number.isInteger(s) && s >= 0 && s <= 11) return s + 1;

    // Otherwise wrap any integer into 1..12
    return ((Math.trunc(s) - 1) % 12 + 12) % 12 + 1;
  }

  // Extract planets from Swiss Ephemeris response
  // Chart data structure: { planets: [...], houses: [...], etc. }
  const planets = chartData.planets || chartData.planetsData || [];
  
  // Build planets_state array
  const planets_state = planets
    .map((p) => {
      const degree = p.longitude ?? p.long ?? p.position ?? null;
      const computedSign = normalizeSignFromLongitude(degree);
      const rawSign = p.sign ?? p.s ?? null;
      const sign = computedSign || normalizeSignFallback(rawSign);
      return {
        planet: p.name || p.planet || p.id,
        house: p.house || p.h || null,
        sign,
        degree,
        nakshatra: p.nakshatra || p.nakshatraId || null,
        pada: p.pada || null,
        is_retro: p.isRetrograde || p.retrograde || false,
        strength: p.strength || null,
      };
    })
    .filter((p) => p.planet); // Filter out invalid entries

  // Extract other data
  const houses_state = chartData.houses || chartData.housesData || null;
  const yogas_state = chartData.yogas || chartData.yogasData || [];
  const doshas_state = chartData.doshas || chartData.doshasData || [];
  const transits_raw = chartData.transits || chartData.transitsData || [];
  const transits_state = Array.isArray(transits_raw)
    ? transits_raw.map((t) => {
        const lon = t.longitude ?? t.long ?? t.position ?? t.degree ?? null;
        const computedSign = normalizeSignFromLongitude(lon);
        const rawSign = t.sign ?? t.s ?? null;
        return {
          ...t,
          longitude: lon ?? t.longitude,
          sign: computedSign || normalizeSignFallback(rawSign),
        };
      })
    : transits_raw;

  // Extract basic info
  const lagnaLongitude =
    chartData.lagna?.longitude ??
    chartData.lagna?.degree ??
    chartData.lagna?.long ??
    null;
  const lagna_sign =
    normalizeSignFromLongitude(lagnaLongitude) ||
    normalizeSignFallback(chartData.lagna?.sign || chartData.lagnaSign || null);

  // Prefer explicit moon info, else derive from Moon planet entry
  const moonPlanet = planets_state.find((p) => String(p.planet || '').toUpperCase() === 'MOON');
  const moonLongitude =
    chartData.moon?.longitude ??
    chartData.moon?.degree ??
    chartData.moon?.long ??
    moonPlanet?.degree ??
    null;
  const moon_sign =
    normalizeSignFromLongitude(moonLongitude) ||
    normalizeSignFallback(chartData.moon?.sign || chartData.moonSign || moonPlanet?.sign || null);

  // moon_nakshatra column is SMALLINT (nakshatraId). Avoid storing string names here.
  // If only the name is present (e.g., "Swati"), map it to the standard 1..27 ID.
  function normalizeNakshatraFromLongitude(longitude) {
    const lon = Number(longitude);
    if (!Number.isFinite(lon)) return null;
    const norm = ((lon % 360) + 360) % 360;
    const idx0 = Math.floor(norm / (360 / 27)); // 0..26
    const id = idx0 + 1; // 1..27
    return id >= 1 && id <= 27 ? id : null;
  }

  function normalizeNakshatraId(value) {
    if (value == null) return null;
    const n = Number(value);
    // Some clients send 0-based IDs (0..26). Normalize to 1..27.
    if (Number.isFinite(n) && n >= 0 && n <= 26) return Math.trunc(n) + 1;
    if (Number.isFinite(n) && n >= 1 && n <= 27) return Math.trunc(n);
    const name = String(value || '').trim().toLowerCase();
    if (!name) return null;
    const map = {
      ashwini: 1,
      bharani: 2,
      krittika: 3,
      rohini: 4,
      mrigashira: 5,
      mrigasira: 5,
      ardra: 6,
      punarvasu: 7,
      pushya: 8,
      ashlesha: 9,
      aslesha: 9,
      magha: 10,
      purva_phalguni: 11,
      'purva phalguni': 11,
      uttara_phalguni: 12,
      'uttara phalguni': 12,
      hasta: 13,
      chitra: 14,
      swati: 15,
      vishakha: 16,
      vishakhaaa: 16,
      anuradha: 17,
      jyeshtha: 18,
      jyestha: 18,
      mula: 19,
      purva_ashadha: 20,
      'purva ashadha': 20,
      uttara_ashadha: 21,
      'uttara ashadha': 21,
      shravana: 22,
      dhanishtha: 23,
      dhanishta: 23,
      shatabhisha: 24,
      satabhisha: 24,
      purva_bhadrapada: 25,
      'purva bhadrapada': 25,
      uttara_bhadrapada: 26,
      'uttara bhadrapada': 26,
      revati: 27,
    };
    return map[name] || null;
  }

  const moon_nakshatra =
    // Longitude is authoritative (north-Indian standard). Prefer it when available.
    normalizeNakshatraFromLongitude(moonLongitude) ||
    normalizeNakshatraId(chartData.moon?.nakshatraId) ||
    normalizeNakshatraId(chartData.moonNakshatraId) ||
    normalizeNakshatraId(chartData.moon?.nakshatra) ||
    normalizeNakshatraId(chartData.moonNakshatra) ||
    normalizeNakshatraId(moonPlanet?.nakshatra) ||
    null;

  // Extract varshaphal data (for yearly windows)
  const varshaphal_data = chartData.varshaphal || null;
  
  // Extract dasha data (for Mahadasha Phal)
  const dasha_data = chartData.dasha || null;
  
  // Debug logging for dasha data
  if (dasha_data) {
    console.log(`[createAstroSnapshot] Window ${windowId}: Found dasha data`);
    console.log(`[createAstroSnapshot] dasha keys: ${Object.keys(dasha_data).join(', ')}`);
    if (dasha_data.mahadashaPeriods) {
      console.log(`[createAstroSnapshot] mahadashaPeriods count: ${dasha_data.mahadashaPeriods.length}`);
    }
    if (dasha_data.mahadasha) {
      console.log(`[createAstroSnapshot] mahadasha: ${dasha_data.mahadasha.planet}`);
    }
  } else {
    console.log(`[createAstroSnapshot] Window ${windowId}: No dasha data in chartData`);
    console.log(`[createAstroSnapshot] chartData keys: ${Object.keys(chartData).join(', ')}`);
  }
  
  // Build metadata object
  const metadata = {};
  if (varshaphal_data) {
    metadata.varshaphal = varshaphal_data;
  }
  if (dasha_data) {
    metadata.dasha = dasha_data;
    console.log(`[createAstroSnapshot] Window ${windowId}: Storing dasha in metadata`);
  }
  // Also store birth datetime info if available (for server-side Vimshottari).
  // Preferred keys (English-only DB-bound text):
  // - birthDateTimeUtc: ISO string (e.g., "1986-12-27T02:44:00.000Z")
  // Fallback keys:
  // - birthDate: "YYYY-MM-DD"
  // - birthTime: "HH:mm:ss" (local clock time)
  // - timezoneOffsetMinutes: number (e.g., 330 for IST)
  const metaFromClient = (chartData && typeof chartData === 'object' && chartData.meta && typeof chartData.meta === 'object')
    ? chartData.meta
    : null;
  const birthDateTimeUtc =
    chartData.birthDateTimeUtc ||
    chartData.birth_datetime_utc ||
    metaFromClient?.birthDateTimeUtc ||
    metaFromClient?.birth_datetime_utc ||
    null;
  const birthDate =
    chartData.birthDate ||
    chartData.birth_date ||
    metaFromClient?.birthDate ||
    metaFromClient?.birth_date ||
    null;
  const birthTime =
    chartData.birthTime ||
    chartData.birth_time ||
    metaFromClient?.birthTime ||
    metaFromClient?.birth_time ||
    null;
  const timezoneOffsetMinutes =
    chartData.timezoneOffsetMinutes ||
    chartData.tzOffsetMinutes ||
    metaFromClient?.timezoneOffsetMinutes ||
    metaFromClient?.tzOffsetMinutes ||
    null;

  if (birthDateTimeUtc) metadata.birthDateTimeUtc = birthDateTimeUtc;
  if (birthDate) metadata.birthDate = birthDate;
  if (birthTime) metadata.birthTime = birthTime;
  if (timezoneOffsetMinutes != null) metadata.timezoneOffsetMinutes = timezoneOffsetMinutes;

  // If client sent UTC datetime but not a separate birthDate, derive YYYY-MM-DD for convenience.
  if (!metadata.birthDate && metadata.birthDateTimeUtc) {
    const dt = new Date(String(metadata.birthDateTimeUtc));
    if (!Number.isNaN(dt.getTime())) {
      metadata.birthDate = dt.toISOString().split('T')[0];
    }
  }

  // ----------------------------
  // Server-side Vimshottari: compute running MD/AD/PD planets for rule-engine dasha layer
  // Engine mapping (see src/engine/ruleEvaluator.js):
  // 1 SUN, 2 MOON, 3 MARS, 4 MERCURY, 5 JUPITER, 6 VENUS, 7 SATURN, 8 RAHU, 9 KETU
  // ----------------------------
  const DASHA_PLANET_NAME_TO_ENGINE_ID = {
    SUN: 1,
    MOON: 2,
    MARS: 3,
    MERCURY: 4,
    JUPITER: 5,
    VENUS: 6,
    SATURN: 7,
    RAHU: 8,
    KETU: 9,
  };

  let running_mahadasha_planet = null;
  let running_antardasha_planet = null;
  let running_pratyantardasha_planet = null;

  try {
    const birthUtc = metadata?.birthDateTimeUtc ? new Date(String(metadata.birthDateTimeUtc)) : null;
    const moonLonSid = Number(moonLongitude);
    if (birthUtc instanceof Date && !Number.isNaN(birthUtc.getTime()) && Number.isFinite(moonLonSid)) {
      // Evaluate dasha state at window start (preferred) else today.
      const winRes = await query('SELECT start_at FROM prediction_windows WHERE id = $1', [windowId]);
      const at = winRes.rowCount > 0 && winRes.rows[0]?.start_at ? new Date(winRes.rows[0].start_at) : new Date();

      const { computeVimshottariStateAt } = await import('./services/vimshottariDasha.js');
      const state = computeVimshottariStateAt({
        birthDateTimeUtc: birthUtc,
        moonLongitudeSidereal: moonLonSid,
        atUtc: at,
      });

      const mdName = state?.mahadasha?.planet ? String(state.mahadasha.planet).toUpperCase() : null;
      const adName = state?.antardasha?.planet ? String(state.antardasha.planet).toUpperCase() : null;
      const pdName = state?.pratyantardasha?.planet ? String(state.pratyantardasha.planet).toUpperCase() : null;

      running_mahadasha_planet = mdName ? (DASHA_PLANET_NAME_TO_ENGINE_ID[mdName] || null) : null;
      running_antardasha_planet = adName ? (DASHA_PLANET_NAME_TO_ENGINE_ID[adName] || null) : null;
      running_pratyantardasha_planet = pdName ? (DASHA_PLANET_NAME_TO_ENGINE_ID[pdName] || null) : null;
    } else {
      if (!metadata?.birthDateTimeUtc) metadata.ingest_warning_birth_datetime_missing_for_dasha = true;
      if (!Number.isFinite(moonLonSid)) metadata.ingest_warning_moon_longitude_missing_for_dasha = true;
    }
  } catch (e) {
    metadata.ingest_warning_dasha_compute_failed = true;
  }
  
  const hasMetadata = Object.keys(metadata).length > 0;

  // FIXED: Fetch existing metadata first (if any) to merge with new metadata
  // This ensures we don't lose existing dasha/varshaphal data when updating
  let existingMetadata = {};
  let existingPlanetsState = null;
  let existingTransitsState = null;
  const existingSnapshot = await query(
    'SELECT houses_state, planets_state, transits_state FROM astro_state_snapshots WHERE window_id = $1',
    [windowId]
  );
  
  if (existingSnapshot.rowCount > 0) {
    let existingHouses = existingSnapshot.rows[0].houses_state;
    let existingPlanets = existingSnapshot.rows[0].planets_state;
    let existingTransits = existingSnapshot.rows[0].transits_state;
    
    // Parse if string
    if (typeof existingHouses === 'string') {
      try {
        existingHouses = JSON.parse(existingHouses);
      } catch (e) {
        // ignore
      }
    }

    if (typeof existingPlanets === 'string') {
      try {
        existingPlanets = JSON.parse(existingPlanets);
      } catch (e) {
        // ignore
      }
    }
    if (typeof existingTransits === 'string') {
      try {
        existingTransits = JSON.parse(existingTransits);
      } catch (e) {
        // ignore
      }
    }
    existingPlanetsState = Array.isArray(existingPlanets) ? existingPlanets : null;
    existingTransitsState = Array.isArray(existingTransits) ? existingTransits : null;
    
    // Extract existing metadata
    if (existingHouses && typeof existingHouses === 'object' && existingHouses._metadata) {
      existingMetadata = existingHouses._metadata;
    }
  }
  
  // Merge metadata (new data takes precedence, but preserve existing)
  const mergedMetadata = {
    ...existingMetadata,
    ...metadata
  };

  // Preserve existing planets/transits if incoming payload is partial (common during incremental updates).
  let finalPlanetsState = planets_state;
  if (Array.isArray(existingPlanetsState) && existingPlanetsState.length >= 9 && Array.isArray(planets_state) && planets_state.length < 9) {
    finalPlanetsState = existingPlanetsState;
    mergedMetadata.ingest_warning_planets_partial = true;
  }

  let finalTransitsState = transits_state;
  const incomingTransitsCount = Array.isArray(transits_state) ? transits_state.length : 0;
  const existingTransitsCount = Array.isArray(existingTransitsState) ? existingTransitsState.length : 0;
  if (existingTransitsCount > 0 && incomingTransitsCount === 0) {
    finalTransitsState = existingTransitsState;
    mergedMetadata.ingest_warning_transits_missing = true;
  }

  // Detect "natal-as-transit" (when transits longitudes match natal longitudes).
  try {
    if (Array.isArray(finalTransitsState) && finalTransitsState.length >= 7 && Array.isArray(finalPlanetsState) && finalPlanetsState.length >= 7) {
      const pMap = new Map(finalPlanetsState.map(p => [String(p.planet || p.name || '').toUpperCase(), p]));
      let same = 0;
      let compared = 0;
      for (const t of finalTransitsState) {
        const key = String(t.planet || t.name || '').toUpperCase();
        const p = pMap.get(key);
        if (!p) continue;
        const tLon = Number(t.longitude ?? t.degree ?? t.long);
        const pLon = Number(p.degree ?? p.longitude ?? p.long);
        if (!Number.isFinite(tLon) || !Number.isFinite(pLon)) continue;
        compared++;
        if (Math.abs(tLon - pLon) < 0.001) same++;
      }
      if (compared >= 7 && same >= 7) {
        mergedMetadata.ingest_warning_transits_look_natal = true;
      }
    }
  } catch (e) {
    // ignore
  }
  
  // Prepare houses_with_metadata with merged metadata
  let houses_with_metadata = houses_state;
  if (Object.keys(mergedMetadata).length > 0) {
    if (Array.isArray(houses_state)) {
      houses_with_metadata = {
        houses: houses_state,
        _metadata: mergedMetadata
      };
    } else if (houses_state && typeof houses_state === 'object') {
      houses_with_metadata = {
        ...houses_state,
        _metadata: mergedMetadata
      };
    } else {
      houses_with_metadata = { _metadata: mergedMetadata };
    }
  }
  
  // FIXED: Use INSERT ... ON CONFLICT to handle race conditions atomically
  // This prevents "duplicate key" errors when multiple requests try to create snapshot simultaneously
  // The metadata merge above ensures we preserve existing data even in race conditions
  await query(
    `INSERT INTO astro_state_snapshots (
       user_id, chart_id, window_id,
       lagna_sign, moon_sign, moon_nakshatra,
       running_mahadasha_planet, running_antardasha_planet, running_pratyantardasha_planet,
       planets_state, houses_state, yogas_state, doshas_state, transits_state
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11::jsonb, $12::jsonb, $13::jsonb, $14::jsonb)
     ON CONFLICT (window_id) DO UPDATE SET
       planets_state = EXCLUDED.planets_state,
       houses_state = EXCLUDED.houses_state,
       yogas_state = EXCLUDED.yogas_state,
       doshas_state = EXCLUDED.doshas_state,
       transits_state = EXCLUDED.transits_state,
       lagna_sign = EXCLUDED.lagna_sign,
       moon_sign = EXCLUDED.moon_sign,
       moon_nakshatra = EXCLUDED.moon_nakshatra,
       running_mahadasha_planet = EXCLUDED.running_mahadasha_planet,
       running_antardasha_planet = EXCLUDED.running_antardasha_planet,
       running_pratyantardasha_planet = EXCLUDED.running_pratyantardasha_planet,
       computed_at = NOW()
     RETURNING id`,
    [
      userId,
      chartId,
      windowId,
      lagna_sign,
      moon_sign,
      moon_nakshatra,
      running_mahadasha_planet,
      running_antardasha_planet,
      running_pratyantardasha_planet,
      JSON.stringify(finalPlanetsState),
      JSON.stringify(houses_with_metadata),
      JSON.stringify(yogas_state),
      JSON.stringify(doshas_state),
      JSON.stringify(finalTransitsState),
    ]
  );
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
      if (scope === 'yearly') {
        // For yearly windows, find windows that start on or very close to the requested date
        // This ensures we get the correct yearly window for the requested date
        const requestedDate = new Date(date);
        const requestedDateStr = requestedDate.toISOString().split('T')[0];
        sql += ` AND DATE(start_at) = $${params.length + 1}::date`;
        params.push(requestedDateStr);
      } else {
        // For other scopes, find windows that contain this date
        sql += ` AND start_at <= $${params.length + 1}::date
                 AND end_at >= $${params.length + 1}::date`;
        params.push(date);
      }
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

  // Debug logging
  console.log(`[POST /windows/${windowId}/astro-snapshot] Received request`);
  console.log(`[POST /windows/${windowId}/astro-snapshot] chart_data keys: ${Object.keys(chart_data || {}).join(', ')}`);
  try {
    const rawTransits = chart_data?.transits || chart_data?.transitsData || null;
    const rawPlanets = chart_data?.planets || chart_data?.planetsData || null;
    const transitsCount = Array.isArray(rawTransits)
      ? rawTransits.length
      : (rawTransits && typeof rawTransits === 'object' ? Object.keys(rawTransits).length : 0);
    const planetsCount = Array.isArray(rawPlanets)
      ? rawPlanets.length
      : (rawPlanets && typeof rawPlanets === 'object' ? Object.keys(rawPlanets).length : 0);
    console.log(`[POST /windows/${windowId}/astro-snapshot] planets_count=${planetsCount}, transits_count=${transitsCount}`);
  } catch (e) {
    // ignore logging errors
  }
  if (chart_data.dasha) {
    console.log(`[POST /windows/${windowId}/astro-snapshot] ✅ dasha data present`);
    console.log(`[POST /windows/${windowId}/astro-snapshot] dasha keys: ${Object.keys(chart_data.dasha).join(', ')}`);
    if (chart_data.dasha.mahadashaPeriods) {
      console.log(`[POST /windows/${windowId}/astro-snapshot] mahadashaPeriods: ${chart_data.dasha.mahadashaPeriods.length} periods`);
    }
  } else {
    console.log(`[POST /windows/${windowId}/astro-snapshot] ❌ No dasha data in chart_data`);
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

    console.log(`[POST /windows/${windowId}/astro-snapshot] ✅ Snapshot updated successfully`);

    return res.json({
      ok: true,
      message: 'Astro snapshot created/updated successfully',
    });
  } catch (err) {
    console.error(`[POST /windows/${windowId}/astro-snapshot] ❌ Error:`, err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ---- Get prediction + applied rules for a window ---------------------------

app.get('/predictions/:windowId', async (req, res) => {
  const windowId = Number(req.params.windowId);
  const language = req.query.lang || 'en';
  const includeAppliedRules = String(req.query.include_applied_rules || '') === '1' || String(req.query.debug || '') === '1';

  try {
    // Fetch window context (needed for timing windows)
    const winCtxRes = await query(
      `SELECT id, user_id, chart_id, scope, start_at, end_at
       FROM prediction_windows
       WHERE id = $1
       LIMIT 1`,
      [windowId]
    );
    const windowCtx = winCtxRes.rowCount ? winCtxRes.rows[0] : null;

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
    // Include universal knowledge-aware fields
    const appliedRes = await query(
      `
      SELECT
        par.*,
        r.point_code,
        r.effect_json AS rule_effect_json,
        r.rule_nature,
        r.execution_status,
        r.raw_rule_type,
        r.confidence_level,
        r.source_book,
        r.rule_type,
        r.canonical_meaning
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

    // ---- Marriage timing month–year windows (deterministic, no guessing) ----
    // Rule: compute windows only if RELATIONSHIP_MARRIAGE_TIMING is present among applied rules.
    let marriageTimingWindows = null;
    try {
      const hasMarriageTiming = appliedRes.rows.some((r) => String(r.point_code || '') === 'RELATIONSHIP_MARRIAGE_TIMING');
      if (hasMarriageTiming && windowCtx?.user_id && windowCtx?.chart_id && windowCtx?.start_at) {
        const winResult = await findBestMonthYearWindowsForPoint({
          userId: Number(windowCtx.user_id),
          chartId: Number(windowCtx.chart_id),
          pointCodes: ['RELATIONSHIP_MARRIAGE_TIMING'],
          contextKey: 'marriage',
          startAt: windowCtx.start_at,
          monthsAhead: 24,
          limit: 3,
          minBaseScore: 0.25,
        });

        const ranges = Array.isArray(winResult.monthYearRanges) ? winResult.monthYearRanges : [];
        const primary = ranges[0]?.range_text || null;
        const secondary = ranges[1]?.range_text || null;
        const tertiary = ranges[2]?.range_text || null;

        // Narrative (English-only; no exact date, no guarantees)
        let narrative_hi = null;
        if (primary) {
          narrative_hi =
            `A marriage yog is present.\n` +
            `Strongest window appears to be ${primary}.\n` +
            (secondary ? `Secondary window: ${secondary}.\n` : '') +
            (tertiary ? `Additional window: ${tertiary}.\n` : '');
          narrative_hi = narrative_hi.trim();
        }

        marriageTimingWindows = {
          ok: true,
          point_code: 'RELATIONSHIP_MARRIAGE_TIMING',
          primary_window: primary,
          secondary_window: secondary,
          additional_window: tertiary,
          windows: ranges.map((r) => ({ range_text: r.range_text, avgScore: r.avgScore, monthCount: r.monthCount })),
          narrative_hi,
          source: 'timingWindowFinder_v1',
        };
      }
    } catch (e) {
      // Non-blocking: do not fail the prediction response if windows cannot be computed.
      marriageTimingWindows = { ok: false, error: String(e?.message || e), point_code: 'RELATIONSHIP_MARRIAGE_TIMING' };
    }

    // ---- Career month–year windows (deterministic, no guessing) ----
    let careerTimingWindows = null;
    try {
      const careerPointCodes = [
        'CAREER_STABILITY',
        'CAREER_GROWTH_PROMOTION',
        'CAREER_JOB_CHANGE',
        'CAREER_WORKPLACE_CONFLICT',
        'CAREER_SKILL_STAGNATION',
      ];

      const presentCareerPoints = careerPointCodes.filter((pc) =>
        appliedRes.rows.some((r) => String(r.point_code || '') === pc)
      );

      if (presentCareerPoints.length && windowCtx?.user_id && windowCtx?.chart_id && windowCtx?.start_at) {
        const windowsByPoint = {};

        for (const pc of presentCareerPoints) {
          // eslint-disable-next-line no-await-in-loop
          const winResult = await findBestMonthYearWindowsForPoint({
            userId: Number(windowCtx.user_id),
            chartId: Number(windowCtx.chart_id),
            pointCodes: [pc],
            contextKey: 'career',
            startAt: windowCtx.start_at,
            monthsAhead: 24,
            limit: 3,
            minBaseScore: 0.25,
          });

          const ranges = Array.isArray(winResult.monthYearRanges) ? winResult.monthYearRanges : [];
          const primary = ranges[0]?.range_text || null;
          const secondary = ranges[1]?.range_text || null;
          const tertiary = ranges[2]?.range_text || null;

          let headingHi = null;
          if (pc === 'CAREER_STABILITY') headingHi = 'A career stability yog is present.';
          else if (pc === 'CAREER_GROWTH_PROMOTION') headingHi = 'A career growth/promotion yog is present.';
          else if (pc === 'CAREER_JOB_CHANGE') headingHi = 'A career change/role-shift yog is present.';
          else if (pc === 'CAREER_WORKPLACE_CONFLICT') headingHi = 'Workplace stress/politics sensitivity may be higher.';
          else if (pc === 'CAREER_SKILL_STAGNATION') headingHi = 'A slower-growth / skill-stagnation phase may be active.';

          let narrative_hi = null;
          if (primary && headingHi) {
            narrative_hi =
              `${headingHi}\n` +
              `Strongest window appears to be ${primary}.\n` +
              (secondary ? `Secondary window: ${secondary}.\n` : '') +
              (tertiary ? `Additional window: ${tertiary}.\n` : '');
            narrative_hi = narrative_hi.trim();
          }

          windowsByPoint[pc] = {
            ok: true,
            point_code: pc,
            primary_window: primary,
            secondary_window: secondary,
            additional_window: tertiary,
            windows: ranges.map((r) => ({ range_text: r.range_text, avgScore: r.avgScore, monthCount: r.monthCount })),
            narrative_hi,
            source: 'timingWindowFinder_v1',
          };
        }

        careerTimingWindows = {
          ok: true,
          context: 'career',
          windowsByPoint,
        };
      }
    } catch (e) {
      careerTimingWindows = { ok: false, error: String(e?.message || e), context: 'career' };
    }

    // ---- Business month–year windows (deterministic, no guessing) ----
    let businessTimingWindows = null;
    try {
      const businessPointCodes = [
        'MONEY_BUSINESS_GENERAL',
        'MONEY_BUSINESS_GROWTH_WIN',
        'MONEY_BUSINESS_LOSS_RISK',
        'MONEY_BUSINESS_START',
        'MONEY_BUSINESS_PARTNERSHIP_COMPLEX',
      ];

      const presentBusinessPoints = businessPointCodes.filter((pc) =>
        appliedRes.rows.some((r) => String(r.point_code || '') === pc)
      );

      if (presentBusinessPoints.length && windowCtx?.user_id && windowCtx?.chart_id && windowCtx?.start_at) {
        const windowsByPoint = {};

        for (const pc of presentBusinessPoints) {
          // eslint-disable-next-line no-await-in-loop
          const winResult = await findBestMonthYearWindowsForPoint({
            userId: Number(windowCtx.user_id),
            chartId: Number(windowCtx.chart_id),
            pointCodes: [pc],
            contextKey: 'business',
            startAt: windowCtx.start_at,
            monthsAhead: 24,
            limit: 3,
            minBaseScore: 0.25,
          });

          const ranges = Array.isArray(winResult.monthYearRanges) ? winResult.monthYearRanges : [];
          const primary = ranges[0]?.range_text || null;
          const secondary = ranges[1]?.range_text || null;
          const tertiary = ranges[2]?.range_text || null;

          let headingHi = null;
          if (pc === 'MONEY_BUSINESS_GENERAL') headingHi = 'A business-support yog is present.';
          else if (pc === 'MONEY_BUSINESS_GROWTH_WIN') headingHi = 'A business growth/expansion yog is present.';
          else if (pc === 'MONEY_BUSINESS_START') headingHi = 'A business-start yog is present.';
          else if (pc === 'MONEY_BUSINESS_PARTNERSHIP_COMPLEX') headingHi = 'A business partnership signal is active.';
          else if (pc === 'MONEY_BUSINESS_LOSS_RISK') headingHi = 'Risk management is important in this phase.';

          let narrative_hi = null;
          if (primary && headingHi) {
            narrative_hi =
              `${headingHi}\n` +
              `Strongest window appears to be ${primary}.\n` +
              (secondary ? `Secondary window: ${secondary}.\n` : '') +
              (tertiary ? `Additional window: ${tertiary}.\n` : '');
            narrative_hi = narrative_hi.trim();
          }

          windowsByPoint[pc] = {
            ok: true,
            point_code: pc,
            primary_window: primary,
            secondary_window: secondary,
            additional_window: tertiary,
            windows: ranges.map((r) => ({ range_text: r.range_text, avgScore: r.avgScore, monthCount: r.monthCount })),
            narrative_hi,
            source: 'timingWindowFinder_v1',
          };
        }

        businessTimingWindows = {
          ok: true,
          context: 'business',
          windowsByPoint,
        };
      }
    } catch (e) {
      businessTimingWindows = { ok: false, error: String(e?.message || e), context: 'business' };
    }

    // ---- Finance month–year windows (deterministic, no guessing) ----
    let financeTimingWindows = null;
    try {
      const financePointCodes = [
        'FINANCE_GENERAL',
        'FINANCE_INCOME_FLOW',
        'FINANCE_EXPENSE_PRESSURE',
        'FINANCE_SAVINGS_GROWTH',
        'FINANCE_DEBT_LOAN',
        'FINANCE_INVESTMENT_TIMING',
        'FINANCE_SUDDEN_GAIN_LOSS',
        'FINANCE_LONG_TERM_WEALTH',
      ];

      const presentFinancePoints = financePointCodes.filter((pc) =>
        appliedRes.rows.some((r) => String(r.point_code || '') === pc)
      );

      if (presentFinancePoints.length && windowCtx?.user_id && windowCtx?.chart_id && windowCtx?.start_at) {
        const windowsByPoint = {};

        for (const pc of presentFinancePoints) {
          // eslint-disable-next-line no-await-in-loop
          const winResult = await findBestMonthYearWindowsForPoint({
            userId: Number(windowCtx.user_id),
            chartId: Number(windowCtx.chart_id),
            pointCodes: [pc],
            contextKey: 'finance',
            startAt: windowCtx.start_at,
            monthsAhead: 24,
            limit: 3,
            minBaseScore: 0.25,
          });

          const ranges = Array.isArray(winResult.monthYearRanges) ? winResult.monthYearRanges : [];
          const primary = ranges[0]?.range_text || null;
          const secondary = ranges[1]?.range_text || null;
          const tertiary = ranges[2]?.range_text || null;

          let headingHi = null;
          if (pc === 'FINANCE_GENERAL') headingHi = 'A wealth-support yog is present.';
          else if (pc === 'FINANCE_INCOME_FLOW') headingHi = 'An income-flow signal is strong.';
          else if (pc === 'FINANCE_EXPENSE_PRESSURE') headingHi = 'Expense pressure may be higher in this phase.';
          else if (pc === 'FINANCE_SAVINGS_GROWTH') headingHi = 'A gains-and-savings yog is present.';
          else if (pc === 'FINANCE_DEBT_LOAN') headingHi = 'Debt/loan risk control is important in this phase.';
          else if (pc === 'FINANCE_INVESTMENT_TIMING') headingHi = 'Investment timing may be supportive.';
          else if (pc === 'FINANCE_SUDDEN_GAIN_LOSS') headingHi = 'Volatility direction may be more sensitive in this phase.';
          else if (pc === 'FINANCE_LONG_TERM_WEALTH') headingHi = 'Long-term wealth direction can be supportive.';

          let narrative_hi = null;
          if (primary && headingHi) {
            narrative_hi =
              `${headingHi}\n` +
              `Strongest window appears to be ${primary}.\n` +
              (secondary ? `Secondary window: ${secondary}.\n` : '') +
              (tertiary ? `Additional window: ${tertiary}.\n` : '');
            narrative_hi = narrative_hi.trim();
          }

          windowsByPoint[pc] = {
            ok: true,
            point_code: pc,
            primary_window: primary,
            secondary_window: secondary,
            additional_window: tertiary,
            windows: ranges.map((r) => ({ range_text: r.range_text, avgScore: r.avgScore, monthCount: r.monthCount })),
            narrative_hi,
            source: 'timingWindowFinder_v1',
          };
        }

        financeTimingWindows = {
          ok: true,
          context: 'finance',
          windowsByPoint,
        };
      }
    } catch (e) {
      financeTimingWindows = { ok: false, error: String(e?.message || e), context: 'finance' };
    }

    // ---- Health month–year windows (deterministic, no guessing) ----
    let healthTimingWindows = null;
    try {
      const healthPointCodes = [
        'HEALTH_GENERAL',
        'HEALTH_ENERGY_LEVEL',
        'HEALTH_STRESS_PRESSURE',
        'HEALTH_RECOVERY_PHASE',
        'HEALTH_IMMUNITY_BALANCE',
        'HEALTH_LIFESTYLE_IMPACT',
        'HEALTH_WORK_HEALTH_TRADEOFF',
        'HEALTH_LONG_TERM_VITALITY',
      ];

      const presentHealthPoints = healthPointCodes.filter((pc) =>
        appliedRes.rows.some((r) => String(r.point_code || '') === pc)
      );

      if (presentHealthPoints.length && windowCtx?.user_id && windowCtx?.chart_id && windowCtx?.start_at) {
        const windowsByPoint = {};

        for (const pc of presentHealthPoints) {
          // eslint-disable-next-line no-await-in-loop
          const winResult = await findBestMonthYearWindowsForPoint({
            userId: Number(windowCtx.user_id),
            chartId: Number(windowCtx.chart_id),
            pointCodes: [pc],
            contextKey: 'health',
            startAt: windowCtx.start_at,
            monthsAhead: 24,
            limit: 3,
            minBaseScore: 0.25,
          });

          const ranges = Array.isArray(winResult.monthYearRanges) ? winResult.monthYearRanges : [];
          const primary = ranges[0]?.range_text || null;
          const secondary = ranges[1]?.range_text || null;
          const tertiary = ranges[2]?.range_text || null;

          let headingHi = null;
          if (pc === 'HEALTH_GENERAL') headingHi = 'A vitality-support yog is present.';
          else if (pc === 'HEALTH_ENERGY_LEVEL') headingHi = 'Energy balance may be supportive.';
          else if (pc === 'HEALTH_STRESS_PRESSURE') headingHi = 'Stress sensitivity may be higher in this phase.';
          else if (pc === 'HEALTH_RECOVERY_PHASE') headingHi = 'A recovery/healing yog is strong.';
          else if (pc === 'HEALTH_IMMUNITY_BALANCE') headingHi = 'A resilience/balance yog is present.';
          else if (pc === 'HEALTH_LIFESTYLE_IMPACT') headingHi = 'Routine balance can provide support.';
          else if (pc === 'HEALTH_WORK_HEALTH_TRADEOFF') headingHi = 'Work–health tradeoff needs active management.';
          else if (pc === 'HEALTH_LONG_TERM_VITALITY') headingHi = 'Long-term vitality direction may be supportive.';

          let narrative_hi = null;
          if (primary && headingHi) {
            narrative_hi =
              `${headingHi}\n` +
              `Strongest window appears to be ${primary}.\n` +
              (secondary ? `Secondary window: ${secondary}.\n` : '') +
              (tertiary ? `Additional window: ${tertiary}.\n` : '');
            narrative_hi = narrative_hi.trim();
          }

          windowsByPoint[pc] = {
            ok: true,
            point_code: pc,
            primary_window: primary,
            secondary_window: secondary,
            additional_window: tertiary,
            windows: ranges.map((r) => ({ range_text: r.range_text, avgScore: r.avgScore, monthCount: r.monthCount })),
            narrative_hi,
            source: 'timingWindowFinder_v1',
          };
        }

        healthTimingWindows = {
          ok: true,
          context: 'health',
          windowsByPoint,
        };
      }
    } catch (e) {
      healthTimingWindows = { ok: false, error: String(e?.message || e), context: 'health' };
    }

    // ---- Varshfal data (for yearly windows only) ----
    let varshfal = null;
    if (windowCtx && windowCtx.scope === 'yearly') {
      try {
        const { generateVarshfal } = await import('./services/varshfalGeneration.js');
        varshfal = await generateVarshfal(windowId);
        // Remove 'ok' field from varshfal as it's already in parent response
        if (varshfal && varshfal.ok) {
          delete varshfal.ok;
        }
      } catch (varshfalErr) {
        // Non-blocking: do not fail the prediction response if varshfal cannot be generated
        console.warn('Varshfal generation failed for yearly window:', varshfalErr.message);
        varshfal = { error: String(varshfalErr?.message || varshfalErr) };
      }
    }

    // Clean prediction object - remove internal debugging data
    // Mobile app only needs user-facing fields, not internal rule IDs
    const cleanPrediction = {
      id: prediction.id,
      window_id: prediction.window_id,
      user_id: prediction.user_id,
      chart_id: prediction.chart_id,
      scope: prediction.scope,
      status: prediction.status,
      language_code: prediction.language_code,
      short_summary: prediction.short_summary,
      final_text: prediction.final_text,
      highlight_on_home: prediction.highlight_on_home,
      generated_at: prediction.generated_at,
      // Exclude summary_json (internal rule IDs - not needed by mobile app)
      // Exclude error_message (internal debugging)
    };

    // Quality + payload guardrail:
    // - Mobile app doesn't need the entire appliedRules dump (it's internal/diagnostic)
    // - Applied rules may contain generic universal-knowledge phrases that harm UX
    const appliedRuleCount = Array.isArray(appliedRes.rows) ? appliedRes.rows.length : 0;
    const isGenericRuleText = (t) => {
      const s = String(t || '').toLowerCase();
      return (
        s.includes('this planetary configuration creates specific influences') ||
        s.includes('planetary positions reflect karmic patterns') ||
        s.includes('creates specific influences that shape life experiences')
      );
    };

    const appliedRulesSlim = (Array.isArray(appliedRes.rows) ? appliedRes.rows : [])
      .filter((r) => !isGenericRuleText(r?.canonical_meaning))
      .slice(0, 200)
      .map((r) => ({
        id: r.id,
        prediction_id: r.prediction_id,
        rule_id: r.rule_id,
        score: r.score,
        weight: r.weight,
        point_code: r.point_code || null,
        source_book: r.source_book || null,
        rule_type: r.rule_type || null,
        confidence_level: r.confidence_level || null,
        canonical_meaning: r.canonical_meaning || null,
      }));

    return res.json({
      ok: true,
      prediction: cleanPrediction,
      appliedRuleCount,
      appliedRules: includeAppliedRules ? appliedRulesSlim : [],
      remedies: remediesRes.rows,
      marriageTimingWindows,
      careerTimingWindows,
      businessTimingWindows,
      financeTimingWindows,
      healthTimingWindows,
      varshfal, // Added for yearly windows
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


