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

    res.json({
      ok: true,
      windowId,
      predictionId: result.predictionId,
      prediction: result.prediction,
      summary: result.summary,
      shortSummary: result.shortSummary,
      appliedRuleCount: result.applied.length,
      remedies: remediesRes.rows,
      // Include rule execution metadata
      ruleExecutionInfo: {
        totalRulesEvaluated: result.applied.length,
        executableRules: result.applied.filter(r => r.rule_nature === 'EXECUTABLE').length,
        advisoryRules: result.applied.filter(r => r.rule_nature === 'ADVISORY').length,
      },
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
  // Also store birth date if available
  if (chartData.birthDate || chartData.birth_date) {
    metadata.birthDate = chartData.birthDate || chartData.birth_date;
  }
  
  const hasMetadata = Object.keys(metadata).length > 0;

  // Check if snapshot already exists
  const existing = await query(
    'SELECT id FROM astro_state_snapshots WHERE window_id = $1',
    [windowId]
  );
  
  if (existing.rowCount > 0) {
    // Update existing snapshot
    // IMPORTANT: Merge with existing metadata instead of overwriting
    const existingSnapshot = await query(
      'SELECT houses_state FROM astro_state_snapshots WHERE window_id = $1',
      [windowId]
    );
    
    let existingMetadata = {};
    if (existingSnapshot.rowCount > 0) {
      let existingHouses = existingSnapshot.rows[0].houses_state;
      
      // Parse if string
      if (typeof existingHouses === 'string') {
        try {
          existingHouses = JSON.parse(existingHouses);
        } catch (e) {
          // ignore
        }
      }
      
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
    
    // Store merged metadata (including varshaphal and dasha) in houses_state
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
        JSON.stringify(houses_with_metadata),
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
    // Store metadata (including varshaphal and dasha) in houses_state as extra field
    let houses_with_metadata = houses_state;
    if (hasMetadata) {
      if (Array.isArray(houses_state)) {
        // If houses_state is an array, convert to object with array and metadata
        houses_with_metadata = {
          houses: houses_state,
          _metadata: metadata
        };
      } else if (houses_state && typeof houses_state === 'object') {
        // If already an object, add metadata
        houses_with_metadata = {
          ...houses_state,
          _metadata: metadata
        };
      } else {
        // If null or invalid, create object with just metadata
        houses_with_metadata = { _metadata: metadata };
      }
    }
    
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
        JSON.stringify(houses_with_metadata),
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

    return res.json({
      ok: true,
      prediction,
      appliedRules: appliedRes.rows,
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


