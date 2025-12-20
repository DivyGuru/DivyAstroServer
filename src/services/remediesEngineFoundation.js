import { query } from '../../config/db.js';

/**
 * Remedies Engine Foundation (Decoupled)
 * - Does NOT depend on prediction logic / rule evaluator.
 * - Operates on a minimal "signal" input (pointCode + severity + triggers).
 * - Enforces strict global rules at runtime:
 *   - Allowed categories only (schema enforces)
 *   - Minimum inner + outer practice per active plan (schema enforces via triggers)
 *   - Prevent contradictory actions (engine enforces via compatibility table)
 *   - Safety text validation (engine enforces; schema also blocks death/lifespan keywords)
 */

const BANNED_TEXT_PATTERNS = [
  // Non-negotiable: no death/lifespan prediction language
  /\bdeath\b/i,
  /\bdie\b/i,
  /\blife\s*span\b/i,
  /\blifespan\b/i,

  // Non-negotiable: no caste/religion/food/dress/violence based restrictions
  /\bcaste\b/i,
  /\breligion\b/i,
  /\bviolence\b/i,
  /\bmurder\b/i,
  /\bsuicide\b/i,

  // broad "diet/dress restriction" keywords (soft enforcement)
  /\bban\s+food\b/i,
  /\brestrict\s+food\b/i,
  /\bdress\b/i,
  /\bhijab\b/i,
  /\bhalal\b/i,
  /\bkosher\b/i,
];

export function validateRemedyTextSafety(text, { fieldName = 'text' } = {}) {
  const s = String(text || '').trim();
  if (!s) return;

  for (const re of BANNED_TEXT_PATTERNS) {
    if (re.test(s)) {
      throw new Error(`Safety validation failed for ${fieldName}: contains banned content`);
    }
  }
}

export function severityToIntensityLevel(severity01) {
  const s = Number(severity01);
  if (!Number.isFinite(s)) return 'medium';
  if (s >= 0.75) return 'high';
  if (s >= 0.4) return 'medium';
  return 'low';
}

/**
 * Fetch a matching remedy plan template for a given signal.
 * This is a *rule-layer* selection, independent of prediction evaluation.
 */
export async function selectRemedyPlanTemplate({
  pointCode = null,
  severity = 0.5,
  triggers = {},
} = {}) {
  const intensity = severityToIntensityLevel(severity);

  const rows = (
    await query(
      `
      SELECT
        rtr.id AS rule_id,
        rtr.code AS rule_code,
        rtr.point_code,
        rtr.trigger_conditions,
        rtr.severity_min,
        rtr.severity_max,
        rtr.intensity_level,
        rtr.timeframe,
        rtr.priority,
        rtr.rule_reference,
        rpt.id AS plan_id,
        rpt.code AS plan_code,
        rpt.name AS plan_name,
        rpt.description AS plan_description,
        rpt.intensity_level AS plan_intensity_level,
        rpt.timeframe AS plan_timeframe,
        rpt.is_active AS plan_is_active,
        rpt.inner_action_count,
        rpt.outer_action_count
      FROM remedy_trigger_rules rtr
      JOIN remedy_plan_templates rpt ON rpt.id = rtr.plan_id
      WHERE rtr.is_active = TRUE
        AND rpt.is_active = TRUE
        AND ($1::text IS NULL OR rtr.point_code IS NULL OR rtr.point_code = $1)
        AND $2::numeric BETWEEN rtr.severity_min AND rtr.severity_max
        AND rtr.intensity_level = $3
      ORDER BY
        (CASE WHEN rtr.point_code = $1 THEN 1 ELSE 0 END) DESC,
        rtr.priority DESC,
        rtr.id DESC
      LIMIT 1;
      `,
      [pointCode, Number(severity), intensity]
    )
  ).rows;

  if (!rows.length) return null;

  const chosen = rows[0];
  // Safety check: schema already enforces inner/outer for active plans, but keep runtime guard.
  if (chosen.inner_action_count < 1 || chosen.outer_action_count < 1) {
    throw new Error('Selected plan violates inner+outer rule (should be prevented by DB trigger)');
  }

  // Trigger condition matching (minimal):
  // If rule has trigger_conditions, the engine requires that provided triggers contain those keys/values.
  // This is intentionally conservative and deterministic.
  const required = chosen.trigger_conditions || {};
  for (const [k, v] of Object.entries(required)) {
    if (v == null) continue;
    const provided = triggers?.[k];
    if (Array.isArray(v)) {
      if (!v.includes(provided)) return null;
    } else if (typeof v === 'object') {
      // shallow object match
      if (provided == null) return null;
      for (const [kk, vv] of Object.entries(v)) {
        if (provided?.[kk] !== vv) return null;
      }
    } else {
      if (provided !== v) return null;
    }
  }

  validateRemedyTextSafety(chosen.plan_description, { fieldName: 'plan_description' });

  return chosen;
}

export async function getPlanActions(planId) {
  const res = await query(
    `
    SELECT
      ra.id,
      ra.code,
      ra.name,
      ra.category,
      ra.description,
      ra.applicable_planets,
      ra.is_active,
      rpa.sort_order
    FROM remedy_plan_actions rpa
    JOIN remedy_actions ra ON ra.id = rpa.action_id
    WHERE rpa.plan_id = $1
      AND ra.is_active = TRUE
    ORDER BY rpa.sort_order ASC, ra.id ASC;
    `,
    [planId]
  );

  for (const a of res.rows) {
    validateRemedyTextSafety(a.name, { fieldName: 'action_name' });
    validateRemedyTextSafety(a.description, { fieldName: 'action_description' });
  }

  return res.rows;
}

export async function enforceCompatibility(actions) {
  if (!Array.isArray(actions) || actions.length <= 1) return actions || [];

  const ids = actions.map((a) => a.id);
  const comp = await query(
    `
    SELECT action_id, other_action_id, relation
    FROM remedy_action_compatibility
    WHERE relation = 'disallowed'
      AND action_id = ANY($1::bigint[])
      AND other_action_id = ANY($1::bigint[]);
    `,
    [ids]
  );

  const disallowedPairs = new Set(
    comp.rows.map((r) => `${r.action_id}:${r.other_action_id}`).concat(comp.rows.map((r) => `${r.other_action_id}:${r.action_id}`))
  );

  const kept = [];
  for (const a of actions) {
    let ok = true;
    for (const k of kept) {
      if (disallowedPairs.has(`${a.id}:${k.id}`)) {
        ok = false;
        break;
      }
    }
    if (ok) kept.push(a);
  }
  return kept;
}

/**
 * Public API: recommend a remedies plan (plan template + actions) from a minimal signal.
 * The output is deterministic and DB-driven.
 */
export async function recommendRemedies({
  pointCode = null,
  severity = 0.5,
  triggers = {},
} = {}) {
  const plan = await selectRemedyPlanTemplate({ pointCode, severity, triggers });
  if (!plan) {
    return {
      ok: true,
      plan: null,
      actions: [],
      note: 'No matching remedy plan found for the given signal.',
    };
  }

  let actions = await getPlanActions(plan.plan_id);
  actions = await enforceCompatibility(actions);

  // Runtime guard: ensure at least 1 inner + 1 outer remain after compatibility pruning.
  const innerCount = actions.filter((a) => a.category === 'meditation' || a.category === 'jap').length;
  const outerCount = actions.filter((a) => a.category === 'donation' || a.category === 'feeding_beings').length;
  if (innerCount < 1 || outerCount < 1) {
    throw new Error('Remedy plan violates inner+outer rule after compatibility pruning');
  }

  return {
    ok: true,
    plan: {
      id: plan.plan_id,
      code: plan.plan_code,
      name: plan.plan_name,
      description: plan.plan_description,
      intensity_level: plan.plan_intensity_level,
      timeframe: plan.plan_timeframe,
      rule_reference: plan.rule_reference || null,
    },
    actions,
  };
}


