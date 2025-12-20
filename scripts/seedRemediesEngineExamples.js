#!/usr/bin/env node

// Seed script: Remedies Engine Foundation examples
// NOTE: This uses the remedies-engine tables added to schema_divyastrodb.sql.
// Usage:
//   node scripts/seedRemediesEngineExamples.js

import { query } from '../config/db.js';

function printHeader(title) {
  console.log('='.repeat(60));
  console.log(title);
  console.log('='.repeat(60));
}

function assertSafeText(text) {
  const s = String(text || '');
  const banned = [
    /\bdeath\b/i,
    /\bdie\b/i,
    /\blife\s*span\b/i,
    /\blifespan\b/i,
    /\bcaste\b/i,
    /\breligion\b/i,
    /\bviolence\b/i,
    /\bmurder\b/i,
    /\bsuicide\b/i,
  ];
  for (const re of banned) {
    if (re.test(s)) {
      throw new Error('Seed contains banned content: ' + s);
    }
  }
}

async function upsertAction({ code, name, category, description, applicable_planets = null }) {
  assertSafeText(name);
  assertSafeText(description);

  const existing = await query('SELECT id FROM remedy_actions WHERE code = $1 LIMIT 1', [code]);
  if (existing.rowCount > 0) {
    const id = existing.rows[0].id;
    const res = await query(
      `
      UPDATE remedy_actions
      SET name = $2,
          category = $3,
          description = $4,
          applicable_planets = $5,
          is_active = TRUE,
          updated_at = NOW()
      WHERE id = $1
      RETURNING *;
      `,
      [id, name, category, description, applicable_planets]
    );
    return res.rows[0];
  }

  const res = await query(
    `
    INSERT INTO remedy_actions (code, name, category, description, applicable_planets, is_active)
    VALUES ($1, $2, $3, $4, $5, TRUE)
    RETURNING *;
    `,
    [code, name, category, description, applicable_planets]
  );
  return res.rows[0];
}

async function upsertPlan({ code, name, intensity_level, timeframe, description }) {
  assertSafeText(name);
  assertSafeText(description);

  const existing = await query('SELECT id FROM remedy_plan_templates WHERE code = $1 LIMIT 1', [code]);
  if (existing.rowCount > 0) {
    const id = existing.rows[0].id;
    const res = await query(
      `
      UPDATE remedy_plan_templates
      SET name = $2,
          intensity_level = $3,
          timeframe = $4,
          description = $5,
          is_active = TRUE,
          updated_at = NOW()
      WHERE id = $1
      RETURNING *;
      `,
      [id, name, intensity_level, timeframe, description]
    );
    return res.rows[0];
  }

  const res = await query(
    `
    INSERT INTO remedy_plan_templates (code, name, intensity_level, timeframe, description, is_active)
    VALUES ($1, $2, $3, $4, $5, FALSE)
    RETURNING *;
    `,
    [code, name, intensity_level, timeframe, description]
  );
  return res.rows[0];
}

async function setPlanActions(planId, actions) {
  await query('DELETE FROM remedy_plan_actions WHERE plan_id = $1', [planId]);
  for (const [idx, a] of actions.entries()) {
    // eslint-disable-next-line no-await-in-loop
    await query(
      `
      INSERT INTO remedy_plan_actions (plan_id, action_id, sort_order)
      VALUES ($1, $2, $3)
      ON CONFLICT (plan_id, action_id) DO UPDATE SET sort_order = EXCLUDED.sort_order;
      `,
      [planId, a.id, idx]
    );
  }
}

async function activatePlan(planId) {
  // Activation will be blocked by DB trigger if inner+outer requirement is not satisfied.
  await query('UPDATE remedy_plan_templates SET is_active = TRUE WHERE id = $1', [planId]);
}

async function upsertTriggerRule({
  code,
  point_code = null,
  trigger_conditions = {},
  severity_min = 0,
  severity_max = 1,
  intensity_level,
  timeframe,
  plan_id,
  rule_reference = null,
  priority = 0,
}) {
  const existing = await query('SELECT id FROM remedy_trigger_rules WHERE code = $1 LIMIT 1', [code]);
  if (existing.rowCount > 0) {
    const id = existing.rows[0].id;
    const res = await query(
      `
      UPDATE remedy_trigger_rules
      SET point_code = $2,
          trigger_conditions = $3::jsonb,
          severity_min = $4,
          severity_max = $5,
          intensity_level = $6,
          timeframe = $7,
          plan_id = $8,
          rule_reference = $9,
          priority = $10,
          is_active = TRUE,
          updated_at = NOW()
      WHERE id = $1
      RETURNING *;
      `,
      [
        id,
        point_code,
        JSON.stringify(trigger_conditions),
        severity_min,
        severity_max,
        intensity_level,
        timeframe,
        plan_id,
        rule_reference,
        priority,
      ]
    );
    return res.rows[0];
  }

  const res = await query(
    `
    INSERT INTO remedy_trigger_rules (
      code, point_code, trigger_conditions,
      severity_min, severity_max,
      intensity_level, timeframe,
      plan_id, rule_reference, priority, is_active
    )
    VALUES ($1, $2, $3::jsonb, $4, $5, $6, $7, $8, $9, $10, TRUE)
    RETURNING *;
    `,
    [
      code,
      point_code,
      JSON.stringify(trigger_conditions),
      severity_min,
      severity_max,
      intensity_level,
      timeframe,
      plan_id,
      rule_reference,
      priority,
    ]
  );
  return res.rows[0];
}

async function main() {
  printHeader('🧩 Seed Remedies Engine Examples');

  // --- Atomic actions (3 example pairs: each includes one inner + one outer) ---

  // 1) Business Loss Risk (neutral, practical)
  const aLossInner = await upsertAction({
    code: 'INNER_BREATH_12MIN',
    name: 'Breath awareness (12 minutes)',
    category: 'meditation',
    description:
      'Spend 12 minutes daily observing the breath and noticing financial stress thoughts without reacting; end by writing one calm next step.',
    applicable_planets: null,
  });
  const aLossOuter = await upsertAction({
    code: 'OUTER_WEEKLY_STAPLES_GIVING',
    name: 'Weekly staples giving',
    category: 'donation',
    description:
      'Once a week, donate basic staples (or a small equivalent amount) to a verified local need with a steady, guilt-free mindset.',
    applicable_planets: null,
  });

  // 2) Partnership Conflict (repair + clarity)
  const aPartnerInner = await upsertAction({
    code: 'INNER_METTA_10MIN',
    name: 'Loving-kindness (10 minutes)',
    category: 'meditation',
    description:
      'Spend 10 minutes daily practicing loving-kindness toward yourself first, then toward the partner or team (only if emotionally safe).',
    applicable_planets: null,
  });
  const aPartnerOuter = await upsertAction({
    code: 'OUTER_FEEDING_BEINGS_WEEKLY',
    name: 'Weekly feeding beings',
    category: 'feeding_beings',
    description:
      'Once a week, feed animals or support a local feeding initiative as a grounded act of service and humility.',
    applicable_planets: null,
  });

  // 3) Growth Blockage (discipline + uplift)
  const aGrowthInner = await upsertAction({
    code: 'INNER_JAP_STEADY_INTENT',
    name: 'Steady intention jap',
    category: 'jap',
    description:
      'Repeat a short, calming intention phrase for 7–10 minutes daily to support focus, patience and consistent effort.',
    applicable_planets: null,
  });
  const aGrowthOuter = await upsertAction({
    code: 'OUTER_SKILL_SUPPORT_MONTHLY',
    name: 'Monthly skill-support contribution',
    category: 'donation',
    description:
      'Once a month, support a practical learning initiative (for yourself or others) that improves capability and long-term stability.',
    applicable_planets: null,
  });

  // --- Plan templates (bundles) ---

  const planLoss = await upsertPlan({
    code: 'PLAN_BUSINESS_LOSS_RISK_LOW',
    name: 'Business risk stabilisation (low intensity)',
    intensity_level: 'low',
    timeframe: 'period_based',
    description:
      'A light, stabilising plan focused on calmer decision-making and small, consistent generosity during a risk-sensitive period.',
  });
  await setPlanActions(planLoss.id, [aLossInner, aLossOuter]);
  await activatePlan(planLoss.id);

  const planPartner = await upsertPlan({
    code: 'PLAN_PARTNERSHIP_CONFLICT_MED',
    name: 'Partnership repair and clarity (medium intensity)',
    intensity_level: 'medium',
    timeframe: 'temporary',
    description:
      'A short repair plan to reduce reactivity and support clearer agreements and healthier collaboration.',
  });
  await setPlanActions(planPartner.id, [aPartnerInner, aPartnerOuter]);
  await activatePlan(planPartner.id);

  const planGrowth = await upsertPlan({
    code: 'PLAN_GROWTH_BLOCKAGE_MED',
    name: 'Unblocking momentum (medium intensity)',
    intensity_level: 'medium',
    timeframe: 'period_based',
    description:
      'A medium plan focused on steady inner discipline and outward support for capability-building to break stagnation.',
  });
  await setPlanActions(planGrowth.id, [aGrowthInner, aGrowthOuter]);
  await activatePlan(planGrowth.id);

  // --- Trigger rules (mapping severity → plan) ---

  await upsertTriggerRule({
    code: 'RTR_BUSINESS_LOSS_RISK_LOW',
    point_code: 'MONEY_BUSINESS_LOSS_RISK',
    trigger_conditions: { kind: 'severity_only' },
    severity_min: 0,
    severity_max: 0.4,
    intensity_level: 'low',
    timeframe: 'period_based',
    plan_id: planLoss.id,
    rule_reference: 'point:MONEY_BUSINESS_LOSS_RISK',
    priority: 50,
  });

  await upsertTriggerRule({
    code: 'RTR_PARTNERSHIP_CONFLICT_MED',
    point_code: 'MONEY_BUSINESS_PARTNERSHIP_COMPLEX',
    trigger_conditions: { kind: 'severity_only' },
    severity_min: 0.4,
    severity_max: 0.85,
    intensity_level: 'medium',
    timeframe: 'temporary',
    plan_id: planPartner.id,
    rule_reference: 'point:MONEY_BUSINESS_PARTNERSHIP_COMPLEX',
    priority: 60,
  });

  await upsertTriggerRule({
    code: 'RTR_GROWTH_BLOCKAGE_MED',
    point_code: 'CAREER_GROWTH_BLOCKED',
    trigger_conditions: { kind: 'severity_only' },
    severity_min: 0.4,
    severity_max: 0.85,
    intensity_level: 'medium',
    timeframe: 'period_based',
    plan_id: planGrowth.id,
    rule_reference: 'point:CAREER_GROWTH_BLOCKED',
    priority: 60,
  });

  console.log('✅ Seed completed: actions, plans, and trigger rules upserted.');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ seedRemediesEngineExamples failed:', err.message);
  console.error(err.stack);
  process.exit(1);
});


