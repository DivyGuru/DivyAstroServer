// Rule Evaluation Engine (V1)
// - Pure functions: no direct DB access.
// - Evaluates rules against a normalized astro_state_snapshot.

/**
 * Normalize astro_state_snapshots row into a query-friendly object.
 *
 * Expected planets_state formats (we support both):
 * 1) Array of objects: [{ planet: 'JUPITER', house: 2, ... }, ...]
 * 2) Map object: { JUPITER: { house: 2, ... }, VENUS: { ... } }
 */
export function normalizeAstroState(row) {
  const planetsByName = {};

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

  return {
    row,
    planetsByName,
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

function checkGenericCondition(_config, _astro) {
  // V1: always true so that draft rules can still be tested.
  return true;
}

const leafEvaluators = {
  planet_in_house: checkPlanetInHouse,
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

export function evaluateRule(rule, astro, windowScope) {
  if (!rule || !astro) return null;

  // Basic filters
  if (rule.is_active === false) return null;

  const scopes = Array.isArray(rule.applicable_scopes) ? rule.applicable_scopes : [];
  if (windowScope && scopes.length && !scopes.includes(windowScope)) {
    return null;
  }

  const conditionTree = rule.condition_tree || rule.conditionTree || null;
  if (!conditionTree) return null;

  const ok = evalNode(conditionTree, astro);
  if (!ok) return null;

  const effect = rule.effect_json || rule.effectJson || {};
  const intensityRaw = typeof effect.intensity === 'number' ? effect.intensity : 1.0;
  const intensity = Math.max(0, Math.min(1, intensityRaw));
  const baseWeightRaw = typeof rule.base_weight === 'number' ? rule.base_weight : 1.0;
  const baseWeight = baseWeightRaw >= 0 ? baseWeightRaw : 0;
  const score = intensity * baseWeight;

  return {
    ruleId: rule.id,
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



