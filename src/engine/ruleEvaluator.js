// Rule Evaluation Engine (V1)
// - Pure functions: no direct DB access.
// - Evaluates rules against a normalized astro_state_snapshot.

import {
  canonicalizeNakshatra,
  canonicalizeNakshatraPada,
  classifyNakshatraStrength,
} from '../config/nakshatraStrengthModel.js';

/**
 * Normalize astro_state_snapshots row into a query-friendly object.
 *
 * Expected planets_state formats (we support both):
 * 1) Array of objects: [{ planet: 'JUPITER', house: 2, ... }, ...]
 * 2) Map object: { JUPITER: { house: 2, ... }, VENUS: { ... } }
 */
export function normalizeAstroState(row) {
  const planetsByName = {};
  const transitsByName = {};

  const rawPlanets = row.planets_state || row.planets || null;

  if (Array.isArray(rawPlanets)) {
    for (const p of rawPlanets) {
      if (!p || !p.planet) continue;
      const name = String(p.planet).toUpperCase();
      planetsByName[name] = { ...p };
    }
  } else if (rawPlanets && typeof rawPlanets === 'object') {
    for (const [key, value] of Object.entries(rawPlanets)) {
      const name = String(key).toUpperCase();
      planetsByName[name] = { ...value, planet: name };
    }
  }

  const rawTransits = row.transits_state || row.transits || null;
  if (Array.isArray(rawTransits)) {
    for (const t of rawTransits) {
      if (!t) continue;
      const key = t.planet ?? t.name ?? t.id;
      if (key == null) continue;
      const name = String(key).toUpperCase();
      transitsByName[name] = { ...t, planet: name };
    }
  } else if (rawTransits && typeof rawTransits === 'object') {
    for (const [key, value] of Object.entries(rawTransits)) {
      const name = String(key).toUpperCase();
      transitsByName[name] = { ...value, planet: name };
    }
  }

  return {
    row,
    planetsByName,
    transitsByName,
    yogas: row.yogas_state || [],
    doshas: row.doshas_state || [],
    transits: row.transits_state || [],
    houses: row.houses_state || null,
  };
}

export function getPlanetHouse(astro, planetName) {
  if (!planetName) return null;
  const planet = astro.planetsByName[String(planetName).toUpperCase()];
  if (!planet) return null;
  
  // Handle both formats:
  // 1) house as number: { house: 2 }
  // 2) house as object: { house: { number: 2, ... } }
  let houseValue = planet.house;
  if (houseValue != null && typeof houseValue === 'object' && houseValue.number != null) {
    houseValue = houseValue.number;
  }
  
  if (houseValue == null) return null;
  const h = Number(houseValue);
  return Number.isFinite(h) ? h : null;
}

export function getTransitPlanetHouse(astro, planetName) {
  if (!planetName) return null;
  const planet = astro.transitsByName[String(planetName).toUpperCase()];
  if (!planet) return null;

  let houseValue = planet.house;
  if (houseValue != null && typeof houseValue === 'object' && houseValue.number != null) {
    houseValue = houseValue.number;
  }

  if (houseValue == null) return null;
  const h = Number(houseValue);
  return Number.isFinite(h) ? h : null;
}

function getPlanetRecord(astro, planetName) {
  if (!planetName) return null;
  return astro.planetsByName[String(planetName).toUpperCase()] || null;
}

function getTransitPlanetRecord(astro, planetName) {
  if (!planetName) return null;
  return astro.transitsByName[String(planetName).toUpperCase()] || null;
}

function getPlanetNakshatra(astro, planetName) {
  const p = getPlanetRecord(astro, planetName);
  if (!p) return null;

  // Support multiple key styles without enforcing a specific snapshot schema.
  const raw =
    p.nakshatra ??
    p.nakshatra_name ??
    p.nakshatraName ??
    p.nakshatra_id ??
    p.nakshatraId ??
    null;

  return canonicalizeNakshatra(raw);
}

function getPlanetNakshatraPada(astro, planetName) {
  const p = getPlanetRecord(astro, planetName);
  if (!p) return null;
  const raw = p.nakshatra_pada ?? p.pada ?? p.nakshatraPada ?? null;
  return canonicalizeNakshatraPada(raw);
}

function getTransitPlanetNakshatra(astro, planetName) {
  const p = getTransitPlanetRecord(astro, planetName);
  if (!p) return null;
  const raw =
    p.nakshatra ??
    p.nakshatra_name ??
    p.nakshatraName ??
    p.nakshatra_id ??
    p.nakshatraId ??
    null;
  return canonicalizeNakshatra(raw);
}

function getTransitPlanetNakshatraPada(astro, planetName) {
  const p = getTransitPlanetRecord(astro, planetName);
  if (!p) return null;
  const raw = p.nakshatra_pada ?? p.pada ?? p.nakshatraPada ?? null;
  return canonicalizeNakshatraPada(raw);
}

const DASHA_PLANET_ID_TO_NAME = {
  1: 'SUN',
  2: 'MOON',
  3: 'MARS',
  4: 'MERCURY',
  5: 'JUPITER',
  6: 'VENUS',
  7: 'SATURN',
  8: 'RAHU',
  9: 'KETU',
};

function getRunningDashaPlanetName(row, level) {
  if (!row) return null;
  const l = String(level || '').toLowerCase();
  let current = null;
  if (l === 'mahadasha') current = row.running_mahadasha_planet;
  else if (l === 'antardasha') current = row.running_antardasha_planet;
  else if (l === 'pratyantardasha') current = row.running_pratyantardasha_planet;
  else return null;
  if (current == null) return null;
  const id = Number(current);
  if (!Number.isFinite(id)) return null;
  return DASHA_PLANET_ID_TO_NAME[id] || null;
}

const SIGN_LORD_BY_RASHI = {
  1: 'MARS', // Aries
  2: 'VENUS', // Taurus
  3: 'MERCURY', // Gemini
  4: 'MOON', // Cancer
  5: 'SUN', // Leo
  6: 'MERCURY', // Virgo
  7: 'VENUS', // Libra
  8: 'MARS', // Scorpio
  9: 'JUPITER', // Sagittarius
  10: 'SATURN', // Capricorn
  11: 'SATURN', // Aquarius
  12: 'JUPITER', // Pisces
};

function getHouseSign(astro, houseNumber) {
  const h = Number(houseNumber);
  if (!Number.isFinite(h)) return null;
  const houses = astro?.houses || null;
  if (!houses) return null;

  // Support array format: [{ house: 1, sign: 4 }, ...] or [{ number: 1, sign: 4 }, ...]
  if (Array.isArray(houses)) {
    for (const item of houses) {
      if (!item) continue;
      const hn = item.house ?? item.number ?? item.id ?? null;
      if (hn == null) continue;
      if (Number(hn) !== h) continue;
      const sign = item.sign ?? item.rashi ?? item.sign_number ?? item.signNumber ?? null;
      const s = Number(sign);
      return Number.isFinite(s) ? s : null;
    }
    return null;
  }

  // Support object-map format: { "1": { sign: 4 }, ... }
  if (typeof houses === 'object') {
    const key = String(h);
    const item = houses[key] || houses[h] || null;
    if (!item) return null;
    const sign = item.sign ?? item.rashi ?? item.sign_number ?? item.signNumber ?? null;
    const s = Number(sign);
    return Number.isFinite(s) ? s : null;
  }

  return null;
}

function getHouseLordPlanetName(astro, houseNumber) {
  // Determine house sign, then map sign -> lord planet.
  const sign = getHouseSign(astro, houseNumber);
  if (!sign) return null;
  return SIGN_LORD_BY_RASHI[sign] || null;
}

function checkPlanetStrength(config, astro, isTransit = false) {
  if (!config) return false;
  const planetName = String(config.planet || '').toUpperCase();
  if (!planetName) return false;
  const rec = isTransit ? getTransitPlanetRecord(astro, planetName) : getPlanetRecord(astro, planetName);
  if (!rec) return false;
  const raw = rec.strength ?? rec.shadbala ?? rec.power ?? null;
  if (raw == null) return false;
  const v = Number(raw);
  if (!Number.isFinite(v)) return false;
  const min = config?.min != null ? Number(config.min) : null;
  const max = config?.max != null ? Number(config.max) : null;
  if (min != null && Number.isFinite(min) && v < min) return false;
  if (max != null && Number.isFinite(max) && v > max) return false;
  return true;
}

function checkNatalPlanetStrength(config, astro) {
  return checkPlanetStrength(config, astro, false);
}

function checkTransitPlanetStrength(config, astro) {
  return checkPlanetStrength(config, astro, true);
}

function checkHouseLordInHouse(config, astro) {
  if (!config) return false;
  const baseHouse = Number(config.house);
  const targetHouses = Array.isArray(config.lord_house_in) ? config.lord_house_in.map(Number) : [];
  if (!Number.isFinite(baseHouse) || !targetHouses.length) return false;
  const lord = getHouseLordPlanetName(astro, baseHouse);
  if (!lord) return false;
  const h = getPlanetHouse(astro, lord);
  if (h == null) return false;
  return targetHouses.includes(h);
}

function checkTransitHouseLordInHouse(config, astro) {
  if (!config) return false;
  const baseHouse = Number(config.house);
  const targetHouses = Array.isArray(config.lord_house_in) ? config.lord_house_in.map(Number) : [];
  if (!Number.isFinite(baseHouse) || !targetHouses.length) return false;
  const lord = getHouseLordPlanetName(astro, baseHouse);
  if (!lord) return false;
  const h = getTransitPlanetHouse(astro, lord);
  if (h == null) return false;
  return targetHouses.includes(h);
}

// ---- Leaf evaluators -------------------------------------------------------

function checkPlanetInHouse(config, astro) {
  if (!config) return false;

  const planets = Array.isArray(config.planet_in) ? config.planet_in : [];
  const houses = Array.isArray(config.house_in) ? config.house_in.map(Number) : [];
  if (!planets.length || !houses.length) return false;

  const mode = config.match_mode === 'all' ? 'all' : 'any';
  const min = typeof config.min_planets === 'number' && config.min_planets > 0
    ? Math.min(config.min_planets, planets.length)
    : 1;

  let matchCount = 0;
  for (const p of planets) {
    const h = getPlanetHouse(astro, p);
    if (h != null && houses.includes(h)) {
      matchCount += 1;
    }
  }

  if (mode === 'all') {
    return matchCount === planets.length;
  }
  // mode === 'any'
  return matchCount >= min;
}

function checkPlanetInNakshatra(config, astro) {
  if (!config) return false;
  const planets = Array.isArray(config.planet_in) ? config.planet_in : [];
  const nakListRaw = Array.isArray(config.nakshatra_in) ? config.nakshatra_in : [];
  const padaListRaw = Array.isArray(config.pada_in) ? config.pada_in : null;
  if (!planets.length || !nakListRaw.length) return false;

  const nakList = nakListRaw.map(canonicalizeNakshatra).filter(Boolean);
  if (!nakList.length) return false;

  const padaList = padaListRaw
    ? padaListRaw.map(canonicalizeNakshatraPada).filter((x) => x != null)
    : null;

  const mode = config.match_mode === 'all' ? 'all' : 'any';
  const min = typeof config.min_planets === 'number' && config.min_planets > 0
    ? Math.min(config.min_planets, planets.length)
    : 1;

  let matchCount = 0;
  for (const p of planets) {
    const n = getPlanetNakshatra(astro, p);
    if (!n) continue;
    if (!nakList.includes(n)) continue;
    if (padaList) {
      const pada = getPlanetNakshatraPada(astro, p);
      if (pada == null || !padaList.includes(pada)) continue;
    }
    matchCount += 1;
  }

  if (mode === 'all') return matchCount === planets.length;
  return matchCount >= min;
}

function checkTransitPlanetInNakshatra(config, astro) {
  if (!config) return false;
  const planets = Array.isArray(config.planet_in) ? config.planet_in : [];
  const nakListRaw = Array.isArray(config.nakshatra_in) ? config.nakshatra_in : [];
  const padaListRaw = Array.isArray(config.pada_in) ? config.pada_in : null;
  if (!planets.length || !nakListRaw.length) return false;

  const nakList = nakListRaw.map(canonicalizeNakshatra).filter(Boolean);
  if (!nakList.length) return false;

  const padaList = padaListRaw
    ? padaListRaw.map(canonicalizeNakshatraPada).filter((x) => x != null)
    : null;

  const mode = config.match_mode === 'all' ? 'all' : 'any';
  const min = typeof config.min_planets === 'number' && config.min_planets > 0
    ? Math.min(config.min_planets, planets.length)
    : 1;

  let matchCount = 0;
  for (const p of planets) {
    const n = getTransitPlanetNakshatra(astro, p);
    if (!n) continue;
    if (!nakList.includes(n)) continue;
    if (padaList) {
      const pada = getTransitPlanetNakshatraPada(astro, p);
      if (pada == null || !padaList.includes(pada)) continue;
    }
    matchCount += 1;
  }

  if (mode === 'all') return matchCount === planets.length;
  return matchCount >= min;
}

function checkPlanetInNakshatraGroup(config, astro) {
  if (!config) return false;
  const planets = Array.isArray(config.planet_in) ? config.planet_in : [];
  const group = config.group || null;
  if (!planets.length || !group) return false;

  const context = String(group.context || '').toLowerCase();
  const kind = String(group.kind || '').toLowerCase(); // supportive|neutral|sensitive|obstructive
  if (!context || !kind) return false;

  const mode = config.match_mode === 'all' ? 'all' : 'any';
  const min = typeof config.min_planets === 'number' && config.min_planets > 0
    ? Math.min(config.min_planets, planets.length)
    : 1;

  let matchCount = 0;
  for (const p of planets) {
    const n = getPlanetNakshatra(astro, p);
    if (!n) continue;
    const cls = classifyNakshatraStrength(context, n);
    if (cls === kind) matchCount += 1;
  }

  if (mode === 'all') return matchCount === planets.length;
  return matchCount >= min;
}

function checkTransitPlanetInNakshatraGroup(config, astro) {
  if (!config) return false;
  const planets = Array.isArray(config.planet_in) ? config.planet_in : [];
  const group = config.group || null;
  if (!planets.length || !group) return false;

  const context = String(group.context || '').toLowerCase();
  const kind = String(group.kind || '').toLowerCase();
  if (!context || !kind) return false;

  const mode = config.match_mode === 'all' ? 'all' : 'any';
  const min = typeof config.min_planets === 'number' && config.min_planets > 0
    ? Math.min(config.min_planets, planets.length)
    : 1;

  let matchCount = 0;
  for (const p of planets) {
    const n = getTransitPlanetNakshatra(astro, p);
    if (!n) continue;
    const cls = classifyNakshatraStrength(context, n);
    if (cls === kind) matchCount += 1;
  }

  if (mode === 'all') return matchCount === planets.length;
  return matchCount >= min;
}

function checkDashaLordInNakshatra(config, astro) {
  if (!config) return false;
  const row = astro?.row || {};
  const level = String(config.level || '').toLowerCase();
  const nakListRaw = Array.isArray(config.nakshatra_in) ? config.nakshatra_in : [];
  const padaListRaw = Array.isArray(config.pada_in) ? config.pada_in : null;
  if (!level || !nakListRaw.length) return false;

  const dashaPlanetName = getRunningDashaPlanetName(row, level);
  if (!dashaPlanetName) return false;

  const nakList = nakListRaw.map(canonicalizeNakshatra).filter(Boolean);
  if (!nakList.length) return false;

  const padaList = padaListRaw
    ? padaListRaw.map(canonicalizeNakshatraPada).filter((x) => x != null)
    : null;

  const n = getPlanetNakshatra(astro, dashaPlanetName);
  if (!n) return false;
  if (!nakList.includes(n)) return false;
  if (padaList) {
    const pada = getPlanetNakshatraPada(astro, dashaPlanetName);
    if (pada == null || !padaList.includes(pada)) return false;
  }
  return true;
}

function checkDashaLordInNakshatraGroup(config, astro) {
  if (!config) return false;
  const row = astro?.row || {};
  const level = String(config.level || '').toLowerCase();
  const group = config.group || null;
  if (!level || !group) return false;

  const context = String(group.context || '').toLowerCase();
  const kind = String(group.kind || '').toLowerCase();
  if (!context || !kind) return false;

  const dashaPlanetName = getRunningDashaPlanetName(row, level);
  if (!dashaPlanetName) return false;

  const n = getPlanetNakshatra(astro, dashaPlanetName);
  if (!n) return false;
  return classifyNakshatraStrength(context, n) === kind;
}

function checkTransitPlanetInHouse(config, astro) {
  if (!config) return false;

  const planets = Array.isArray(config.planet_in) ? config.planet_in : [];
  const houses = Array.isArray(config.house_in) ? config.house_in.map(Number) : [];
  if (!planets.length || !houses.length) return false;

  const mode = config.match_mode === 'all' ? 'all' : 'any';
  const min = typeof config.min_planets === 'number' && config.min_planets > 0
    ? Math.min(config.min_planets, planets.length)
    : 1;

  let matchCount = 0;
  for (const p of planets) {
    const h = getTransitPlanetHouse(astro, p);
    if (h != null && houses.includes(h)) {
      matchCount += 1;
    }
  }

  if (mode === 'all') {
    return matchCount === planets.length;
  }
  return matchCount >= min;
}

function checkDashaRunning(config, astro) {
  const row = astro?.row || {};
  if (!config) return false;
  const level = String(config.level || '').toLowerCase();
  const list = Array.isArray(config.planet_in) ? config.planet_in : [];
  if (!level || !list.length) return false;

  let current = null;
  if (level === 'mahadasha') current = row.running_mahadasha_planet;
  else if (level === 'antardasha') current = row.running_antardasha_planet;
  else if (level === 'pratyantardasha') current = row.running_pratyantardasha_planet;
  else return false;

  if (current == null) return false;
  const curNum = Number(current);
  if (!Number.isFinite(curNum)) return false;

  for (const p of list) {
    const n = typeof p === 'number' ? p : Number(p);
    if (Number.isFinite(n) && n === curNum) return true;
  }
  return false;
}

function checkOverallScore(config, astro, key) {
  const row = astro?.row || {};
  const v = row[key];
  if (v == null) return false;
  const score = Number(v);
  if (!Number.isFinite(score)) return false;
  const min = config?.min != null ? Number(config.min) : null;
  const max = config?.max != null ? Number(config.max) : null;
  if (min != null && Number.isFinite(min) && score < min) return false;
  if (max != null && Number.isFinite(max) && score > max) return false;
  return true;
}

function checkOverallBeneficScore(config, astro) {
  return checkOverallScore(config, astro, 'overall_benefic_score');
}

function checkOverallMaleficScore(config, astro) {
  return checkOverallScore(config, astro, 'overall_malefic_score');
}

function checkGenericCondition(_config, _astro) {
  // V1: always true so that draft rules can still be tested.
  return true;
}

const leafEvaluators = {
  planet_in_house: checkPlanetInHouse,
  transit_planet_in_house: checkTransitPlanetInHouse,
  dasha_running: checkDashaRunning,
  planet_strength: checkNatalPlanetStrength,
  transit_planet_strength: checkTransitPlanetStrength,
  house_lord_in_house: checkHouseLordInHouse,
  transit_house_lord_in_house: checkTransitHouseLordInHouse,
  planet_in_nakshatra: checkPlanetInNakshatra,
  transit_planet_in_nakshatra: checkTransitPlanetInNakshatra,
  planet_in_nakshatra_group: checkPlanetInNakshatraGroup,
  transit_planet_in_nakshatra_group: checkTransitPlanetInNakshatraGroup,
  dasha_lord_in_nakshatra: checkDashaLordInNakshatra,
  dasha_lord_in_nakshatra_group: checkDashaLordInNakshatraGroup,
  overall_benefic_score: checkOverallBeneficScore,
  overall_malefic_score: checkOverallMaleficScore,
  generic_condition: checkGenericCondition,
};

function evaluateLeaf(node, astro) {
  const keys = Object.keys(node || {});
  if (keys.length !== 1) return false;
  const key = keys[0];
  const cfg = node[key];
  const fn = leafEvaluators[key];
  if (!fn) return false;
  return fn(cfg, astro);
}

// ---- Recursive condition_tree evaluation -----------------------------------

function evalAll(list, astro) {
  if (!Array.isArray(list) || !list.length) return true;
  for (const child of list) {
    if (!evalNode(child, astro)) return false;
  }
  return true;
}

function evalAny(list, astro) {
  if (!Array.isArray(list) || !list.length) return false;
  for (const child of list) {
    if (evalNode(child, astro)) return true;
  }
  return false;
}

export function evalNode(node, astro) {
  if (!node || typeof node !== 'object') return false;

  if (Array.isArray(node.all)) {
    return evalAll(node.all, astro);
  }
  if (Array.isArray(node.any)) {
    return evalAny(node.any, astro);
  }

  // Leaf node
  return evaluateLeaf(node, astro);
}

// ---- Rule-level evaluation --------------------------------------------------

/**
 * Evaluates a single rule against astro state
 * 
 * 5-LAYER COMPATIBILITY:
 * - Handles all rule types: BASE, NAKSHATRA, DASHA, TRANSIT, STRENGTH, YOGA
 * - Safely handles PENDING_OPERATOR rules (returns null but doesn't break)
 * - Tracks rule_type and engine_status for downstream layers
 * 
 * @param {Object} rule - Rule object with condition_tree, effect_json, rule_type, engine_status
 * @param {Object} astro - Normalized astro state
 * @param {String} windowScope - Window scope (yearly, monthly, daily, etc.)
 * @returns {Object|null} Evaluation result or null if rule doesn't match
 */
export function evaluateRule(rule, astro, windowScope) {
  if (!rule || !astro) return null;

  // Basic filters
  if (rule.is_active === false) return null;

  const scopes = Array.isArray(rule.applicable_scopes) ? rule.applicable_scopes : [];
  if (windowScope && scopes.length && !scopes.includes(windowScope)) {
    return null;
  }

  // 5-LAYER COMPATIBILITY: Handle PENDING_OPERATOR rules gracefully
  // PENDING rules are tracked but not evaluated (they represent potential future influence)
  if (rule.engine_status === 'PENDING_OPERATOR') {
    // Return null for evaluation, but mark as potential influence
    // Downstream layers can check rule_trace.pending_rules to see these
    return null;
  }

  const conditionTree = rule.condition_tree || rule.conditionTree || null;
  if (!conditionTree) return null;

  // Evaluate condition tree
  let ok = false;
  try {
    ok = evalNode(conditionTree, astro);
  } catch (err) {
    // If evaluation fails (e.g., missing operator), skip this rule
    // This is graceful degradation - system continues without this rule
    console.warn(`Rule evaluation failed for rule ${rule.rule_id || rule.id}: ${err.message}`);
    return null;
  }
  
  if (!ok) return null;

  const effect = rule.effect_json || rule.effectJson || {};
  const intensityRaw = typeof effect.intensity === 'number' ? effect.intensity : 1.0;
  const intensity = Math.max(0, Math.min(1, intensityRaw));
  const baseWeightRaw = typeof rule.base_weight === 'number' ? rule.base_weight : 1.0;
  const baseWeight = baseWeightRaw >= 0 ? baseWeightRaw : 0;
  const score = intensity * baseWeight;

  // 5-LAYER COMPATIBILITY: Include rule_type and engine_status in result
  return {
    ruleId: rule.id,
    rule_id: rule.rule_id || rule.id, // For traceability
    rule_type: rule.rule_type || 'BASE', // Track layer
    engine_status: rule.engine_status || 'READY', // Track status
    pointCode: rule.point_code || null,
    theme: effect.theme || null,
    area: effect.area || null,
    trend: effect.trend || null,
    tone: effect.tone || null,
    score,
    weight: baseWeight,
    effect_json: effect,
  };
}

export function evaluateRulesForWindow({ rules, astroRow, windowScope }) {
  const astro = normalizeAstroState(astroRow);
  const applied = [];

  for (const rule of rules || []) {
    const res = evaluateRule(rule, astro, windowScope);
    if (res) applied.push(res);
  }

  return applied;
}

// ---- Theme scoring & prediction assembly ------------------------------------

function levelFromScore(score) {
  if (score >= 3) return 'high';
  if (score >= 1.5) return 'medium';
  return 'low';
}

/**
 * Aggregate applied rules into a theme/area summary.
 *
 * @param {Array} appliedRules - Output from evaluateRulesForWindow
 * @returns {{themes: Record<string, any>}}
 */
export function aggregateThemeScores(appliedRules) {
  const themes = {};

  for (const r of appliedRules || []) {
    const themeKey = r.theme || 'general';
    const areaKey = r.area || 'general';
    const score = typeof r.score === 'number' ? r.score : 0;
    if (score <= 0) continue;

    if (!themes[themeKey]) {
      themes[themeKey] = {
        total_score: 0,
        level: 'low',
        rank: null,
        areas: {},
      };
    }
    const theme = themes[themeKey];

    if (!theme.areas[areaKey]) {
      theme.areas[areaKey] = {
        score: 0,
        level: 'low',
        trend: null,
        tone: null,
        rules: new Set(),
        _topRuleScore: 0,
      };
    }
    const area = theme.areas[areaKey];

    area.score += score;
    theme.total_score += score;

    // Track rules involved in this area
    if (r.pointCode) {
      area.rules.add(r.pointCode);
    } else if (r.ruleId != null) {
      area.rules.add(`RULE_${r.ruleId}`);
    }

    // Pick trend/tone from the highest-scoring rule for this area
    if (score >= area._topRuleScore) {
      area._topRuleScore = score;
      area.trend = r.trend || area.trend;
      area.tone = r.tone || area.tone;
    }
  }

  // Finalize levels and convert Sets to arrays
  const themeEntries = Object.entries(themes);
  for (const [, theme] of themeEntries) {
    theme.level = levelFromScore(theme.total_score);

    const areaEntries = Object.entries(theme.areas);
    for (const [areaKey, area] of areaEntries) {
      area.level = levelFromScore(area.score);
      area.rules = Array.from(area.rules);
      delete area._topRuleScore;
      theme.areas[areaKey] = area;
    }
  }

  // Rank themes by total_score (1 = highest)
  themeEntries
    .sort(([, a], [, b]) => b.total_score - a.total_score)
    .forEach(([key, theme], idx) => {
      themes[key].rank = idx + 1;
    });

  return { themes };
}

function humanThemeLabel(themeKey) {
  switch (themeKey) {
    case 'money_finance':
    case 'money':
      return 'Money and finances';
    case 'career_direction':
    case 'career':
      return 'Career and work';
    case 'relationships':
      return 'Relationships';
    case 'family_home':
    case 'family':
      return 'Family and home';
    case 'health_body':
    case 'health':
      return 'Health and body';
    case 'mental_state':
      return 'Mind and emotional state';
    case 'spiritual_growth':
    case 'spirituality':
      return 'Spiritual growth';
    case 'timing_luck':
    case 'timing':
      return 'Timing and luck';
    case 'events_changes':
      return 'Life events and changes';
    default:
      return 'General themes';
  }
}

/**
 * Build a short human-readable summary text from theme summary.
 *
 * @param {{themes: Record<string, any>}} summary
 * @param {string} language - currently only 'en' supported
 * @returns {string}
 */
export function buildShortSummary(summary, language = 'en') {
  if (!summary || !summary.themes) return '';

  const themeArr = Object.entries(summary.themes);
  if (!themeArr.length) return '';

  // Sort by total_score and take top 3 themes
  const topThemes = themeArr
    .sort(([, a], [, b]) => b.total_score - a.total_score)
    .slice(0, 3);

  const sentences = [];

  for (const [themeKey, theme] of topThemes) {
    const label = humanThemeLabel(themeKey);
    const level = theme.level || 'low';

    // Find top area to refine tone/trend
    let topArea = null;
    let topAreaScore = -Infinity;
    for (const [areaKey, area] of Object.entries(theme.areas || {})) {
      if (area.score > topAreaScore) {
        topAreaScore = area.score;
        topArea = { key: areaKey, ...area };
      }
    }

    const tone = topArea?.tone || 'neutral';
    const trend = topArea?.trend || 'mixed';

    let sentence = '';

    if (language === 'en') {
      if (level === 'high') {
        if (tone === 'positive') {
          sentence = `${label} look strongly supported right now.`;
        } else if (tone === 'challenging' || tone === 'mixed') {
          sentence = `${label} are strongly activated with some challenges or mixed signals.`;
        } else {
          sentence = `${label} are very active at this time.`;
        }
      } else if (level === 'medium') {
        if (tone === 'positive') {
          sentence = `${label} show moderate support with generally encouraging trends.`;
        } else if (tone === 'challenging' || tone === 'mixed') {
          sentence = `${label} show movement with a few uncertainties to navigate.`;
        } else {
          sentence = `${label} are in a fairly balanced state at the moment.`;
        }
      } else {
        if (trend === 'positive') {
          sentence = `${label} are relatively calm with gentle positive undertones.`;
        } else if (tone === 'challenging') {
          sentence = `${label} are sensitive but not strongly highlighted right now.`;
        } else {
          sentence = `${label} are quiet, without strong pushes in either direction.`;
        }
      }
    }

    if (sentence) {
      sentences.push(sentence);
    }
  }

  return sentences.join(' ');
}



