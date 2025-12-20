#!/usr/bin/env node

// Authoring script: Set initial planetary conditions for a problem taxonomy point.
// Usage:
//   node scripts/setPlanetaryConditions.js MONEY_BUSINESS_GENERAL

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getPointById, THEMES } from '../src/config/problemTaxonomy.js';
import { planetaryRegistry } from '../src/authoring/planetary/index.js';
import { query } from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function printHeader(title) {
  console.log('='.repeat(60));
  console.log(title);
  console.log('='.repeat(60));
}

async function saveConditionsJson(point, mock) {
  const rulesDir = path.resolve(
    __dirname,
    '../astro-authoring/rules',
    point.theme,
    point.subtype
  );
  await fs.promises.mkdir(rulesDir, { recursive: true });

  const filePath = path.join(rulesDir, `${point.id}.json`);

  const variants = Array.isArray(mock) ? mock : [mock];
  const payload = {
    pointId: point.id,
    theme: point.theme,
    subtype: point.subtype,
    polarity: point.polarity,
    kind: point.kind,
    defaultScopes: point.defaultScopes,
    possibilities: variants.map((v, idx) => ({
      index: idx + 1,
      code: v.code || `P${String(idx + 1).padStart(2, '0')}`,
      label: v.label || null,
      scopes: v.scopes || null,
      condition_tree: v.condition_tree,
      effect_json: v.effect_json,
    })),
  };

  await fs.promises.writeFile(filePath, JSON.stringify(payload, null, 2), 'utf8');
  console.log(`\n💾 Saved draft conditions to ${filePath}`);
}

// Map taxonomy theme → effect_json.theme
function mapEffectTheme(theme) {
  switch (theme) {
    case THEMES.MONEY_FINANCE:
      return 'money';
    case THEMES.CAREER_DIRECTION:
      return 'career';
    case THEMES.RELATIONSHIPS:
      return 'relationship';
    case THEMES.FAMILY_HOME:
      return 'family';
    case THEMES.HEALTH_BODY:
      return 'health';
    case THEMES.MENTAL_STATE:
      return 'mental_state';
    case THEMES.SPIRITUAL_GROWTH:
      return 'spiritual';
    case THEMES.TIMING_LUCK:
      return 'timing';
    case THEMES.EVENTS_CHANGES:
      return 'events';
    case THEMES.SELF_IDENTITY:
      return 'self';
    default:
      return 'general';
  }
}

function genericFallback(point) {
  const effectTheme = mapEffectTheme(point.theme);
  const astro = point.astroHints || {};

  const trend =
    point.polarity === 'positive'
      ? 'up'
      : point.polarity === 'negative'
      ? 'down'
      : 'mixed';

  const tone = point.polarity === 'negative' ? 'cautious' : 'positive';

  const allConditions = [];

  if (astro.houses && astro.houses.length && astro.keyPlanets && astro.keyPlanets.length) {
    allConditions.push({
      planet_in_house: {
        planet_in: astro.keyPlanets,
        house_in: astro.houses,
      },
    });
  }

  // Fallback generic condition if no astroHints present
  if (allConditions.length === 0) {
    allConditions.push({
      generic_condition: {
        note: 'No astroHints specified; generic draft condition.',
      },
    });
  }

  const baseConditionTree = { all: allConditions };

  // Default: return multiple generic variants so we can author point-by-point later.
  const variants = [
    {
      code: 'GENERIC_BASE',
      label: 'Generic draft condition based on astroHints (baseline).',
      condition_tree: baseConditionTree,
      effect_json: { theme: effectTheme, area: point.subtype, trend, intensity: 0.6, tone, trigger: 'natal' },
    },
    {
      code: 'GENERIC_SUPPORT',
      label: 'Generic supportive variant (benefic bias).',
      condition_tree: baseConditionTree,
      effect_json: { theme: effectTheme, area: point.subtype, trend: 'up', intensity: 0.7, tone: 'positive', trigger: 'natal' },
    },
    {
      code: 'GENERIC_CHALLENGE',
      label: 'Generic challenging variant (malefic bias).',
      condition_tree: baseConditionTree,
      effect_json: { theme: effectTheme, area: point.subtype, trend: 'down', intensity: 0.7, tone: 'challenging', trigger: 'natal' },
    },
    {
      code: 'TRANSIT_GENERIC',
      label: 'Generic transit variant (short-term movement).',
      scopes: ['hourly', 'daily', 'weekly'],
      condition_tree: { generic_condition: { note: 'Replace with real transit conditions during authoring.' } },
      effect_json: { theme: effectTheme, area: point.subtype, trend: trend === 'down' ? 'down' : 'mixed', intensity: 0.5, tone, trigger: 'transit' },
    },
    {
      code: 'DASHA_GENERIC',
      label: 'Generic dasha variant (longer-term phase).',
      scopes: ['monthly', 'yearly', 'life_theme'],
      condition_tree: { generic_condition: { note: 'Replace with real dasha conditions during authoring.' } },
      effect_json: { theme: effectTheme, area: point.subtype, trend, intensity: 0.5, tone, trigger: 'dasha' },
    },
  ];

  // Basic validation
  for (const v of variants) {
    if (!v.condition_tree || !v.effect_json) {
      throw new Error('Invalid mock variants: condition_tree/effect_json missing');
    }
  }

  return variants;
}

/**
 * Generate planetary conditions + effect for a point.
 *
 * JSON schema (for AI integration later):
 * {
 *   "condition_tree": {
 *     "all": [
 *       { "planet_in_house": { "planet_in": ["JUPITER"], "house_in": [2,11] } },
 *       { "planet_strength": { "planet": "JUPITER", "min_score": 0.6 } }
 *     ]
 *   },
 *   "effect_json": {
 *     "theme": "money",
 *     "area": "business",
 *     "trend": "up",
 *     "intensity": 0.7,
 *     "tone": "positive",
 *     "polarity": "positive",
 *     "kind": "achievement"
 *   }
 * }
 */
function generateConditionsForPoint(point) {
  const fn = planetaryRegistry[point.id];
  if (fn) return fn();
  return genericFallback(point);
}

async function upsertRuleGroup(point) {
  const code = point.id;
  const name = `${point.label} [${point.id}]`;
  const description = point.description;

  const sql = `
    INSERT INTO rule_groups (code, name, category, description, is_active)
    VALUES ($1, $2, 'prediction', $3, TRUE)
    ON CONFLICT (code) DO UPDATE
      SET name = EXCLUDED.name,
          description = EXCLUDED.description
    RETURNING *;
  `;

  const res = await query(sql, [code, name, description]);
  return res.rows[0];
}

async function upsertRulesForPoint(point, ruleGroup, variants) {
  const list = Array.isArray(variants) ? variants : [variants];

  const basePriority =
    point.kind === 'problem'
      ? 80
      : point.kind === 'achievement'
      ? 70
      : point.kind === 'event'
      ? 60
      : 50;

  const results = [];

  for (let i = 0; i < list.length; i += 1) {
    const v = list[i];
    const code = v.code || `P${String(i + 1).padStart(2, '0')}`;
    const variantCode = code.startsWith(`${point.id}__`) ? code : `${point.id}__${code}`;
    const ruleName = `${point.id} - ${variantCode}`;
    const ruleDescription =
      (v.label ? `${v.label} ` : '') +
      `Draft planetary condition variant for point ${point.id} (auto-generated by setPlanetaryConditions).`;

    const applicableScopes = Array.isArray(v.scopes) && v.scopes.length ? v.scopes : point.defaultScopes;
    const priority = basePriority + Math.max(0, Math.min(20, Math.round((v.effect_json?.intensity || 0.5) * 10)));

    // Idempotency: key by group + point_code + variant_code (stable across refactors)
    const existingRes = await query(
      'SELECT id FROM rules WHERE rule_group_id = $1 AND point_code = $2 AND variant_code = $3 LIMIT 1',
      [ruleGroup.id, point.id, variantCode]
    );

    const paramsBase = [
      ruleGroup.id,
      ruleName,
      ruleDescription,
      priority,
      applicableScopes,
      0, // min_score
      1, // max_score
      'AND',
      JSON.stringify(v.condition_tree),
      JSON.stringify(v.effect_json),
      1.0, // base_weight
      null, // template_id
      false, // is_active (draft)
      point.id, // point_code
      variantCode, // variant_code
    ];

    if (existingRes.rows.length > 0) {
      const ruleId = existingRes.rows[0].id;
      const sql = `
        UPDATE rules
        SET name = $2,
            description = $3,
            priority = $4,
            applicable_scopes = $5,
            min_score = $6,
            max_score = $7,
            condition_logic = $8,
            condition_tree = $9::jsonb,
            effect_json = $10::jsonb,
            base_weight = $11,
            template_id = $12,
            is_active = $13,
            point_code = $14,
            variant_code = $15
        WHERE id = $1
        RETURNING *;
      `;

      // eslint-disable-next-line no-await-in-loop
      const res = await query(sql, [ruleId, ...paramsBase.slice(1)]);
      results.push({ rule: res.rows[0], action: 'updated', code: variantCode });
    } else {
      const insertSql = `
        INSERT INTO rules (
          rule_group_id,
          name,
          description,
          priority,
          applicable_scopes,
          min_score,
          max_score,
          condition_logic,
          condition_tree,
          effect_json,
          base_weight,
          template_id,
          is_active,
          point_code,
          variant_code
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9::jsonb, $10::jsonb,
          $11, $12, $13, $14, $15
        )
        RETURNING *;
      `;

      // eslint-disable-next-line no-await-in-loop
      const res = await query(insertSql, paramsBase);
      results.push({ rule: res.rows[0], action: 'inserted', code: variantCode });
    }
  }

  return results;
}

async function main() {
  const pointId = process.argv[2];

  printHeader('🔧 setPlanetaryConditions');

  if (!pointId) {
    console.error('❌ pointId missing.');
    console.error('   Usage: node scripts/setPlanetaryConditions.js MONEY_BUSINESS_GENERAL');
    process.exit(1);
  }

  console.log(`➡️  Point ID: ${pointId}\n`);

  const point = getPointById(pointId);
  if (!point) {
    console.error(`❌ Point not found in taxonomy: ${pointId}`);
    process.exit(1);
  }

  console.log('🧩 Point metadata:');
  console.log(JSON.stringify(point, null, 2));

  try {
    // 1. Generate mock condition + effect JSON
    const mock = generateConditionsForPoint(point);
    console.log('\n📝 Mock condition_tree + effect_json (preview):');
    console.log(JSON.stringify(mock, null, 2));

    // 2. Save to authoring JSON file (for AI / manual editing)
    await saveConditionsJson(point, mock);

    // 3. Upsert rule_group
    const group = await upsertRuleGroup(point);
    console.log('\n📁 Rule group upserted:');
    console.log(`   id=${group.id}, code=${group.code}, name=${group.name}`);

    // 4. Upsert rules (multiple variants)
    const upserts = await upsertRulesForPoint(point, group, mock);
    console.log(`\n📏 Rules upserted (${upserts.length} variants):`);
    upserts.forEach(({ rule, action, code }) => {
      const scopes = Array.isArray(rule.applicable_scopes)
        ? rule.applicable_scopes
        : typeof rule.applicable_scopes === 'string'
        ? rule.applicable_scopes
            .replace(/^\{/, '')
            .replace(/\}$/, '')
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : [];
      console.log(
        `   [${code}] ${action} id=${rule.id}, point_code=${rule.point_code}, scopes={${scopes.join(
          ', '
        )}}, is_active=${rule.is_active}`
      );
    });

    console.log('\n✅ setPlanetaryConditions completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error in setPlanetaryConditions:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  // eslint-disable-next-line no-console
  main();
}


