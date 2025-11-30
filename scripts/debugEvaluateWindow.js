#!/usr/bin/env node

// Debug script: evaluate rules for a given prediction window.
// Usage:
//   node scripts/debugEvaluateWindow.js WINDOW_ID [SCOPE]

import { query } from '../config/db.js';
import { evaluateRulesForWindow } from '../src/engine/ruleEvaluator.js';

function printHeader(title) {
  console.log('='.repeat(60));
  console.log(title);
  console.log('='.repeat(60));
}

async function main() {
  const windowId = Number(process.argv[2]);
  const scopeArg = process.argv[3] || null;

  printHeader('🧪 Debug Rule Evaluation for Window');

  if (!windowId || Number.isNaN(windowId)) {
    console.error('❌ WINDOW_ID missing or invalid.');
    console.error('   Usage: node scripts/debugEvaluateWindow.js WINDOW_ID [SCOPE]');
    process.exit(1);
  }

  console.log(`➡️  Window ID: ${windowId}`);

  // 1. Load window + astro snapshot
  const winRes = await query(
    'SELECT id, scope, user_id, chart_id FROM prediction_windows WHERE id = $1',
    [windowId]
  );
  if (winRes.rowCount === 0) {
    console.error(`❌ prediction_window not found: id=${windowId}`);
    process.exit(1);
  }
  const windowRow = winRes.rows[0];
  const scope = scopeArg || windowRow.scope;

  console.log(`   Scope: ${scope}`);

  const astroRes = await query(
    'SELECT * FROM astro_state_snapshots WHERE window_id = $1',
    [windowId]
  );
  if (astroRes.rowCount === 0) {
    console.error(`❌ astro_state_snapshot not found for window_id=${windowId}`);
    process.exit(1);
  }
  const astroRow = astroRes.rows[0];

  // 2. Load rules for this scope
  const rulesRes = await query(
    'SELECT * FROM rules WHERE is_active = TRUE AND $1 = ANY(applicable_scopes)',
    [scope]
  );
  const rules = rulesRes.rows;

  console.log(`\n📚 Loaded rules for scope="${scope}": ${rules.length}`);

  // 3. Evaluate
  const applied = evaluateRulesForWindow({ rules, astroRow, windowScope: scope });

  console.log(`\n✅ Active rules for window ${windowId}: ${applied.length}\n`);
  applied.forEach((r, idx) => {
    console.log(`#${idx + 1}: ruleId=${r.ruleId}, pointCode=${r.pointCode}`);
    console.log(
      `   theme=${r.theme}, area=${r.area}, trend=${r.trend}, tone=${r.tone}, score=${r.score.toFixed(
        3
      )}`
    );
  });

  console.log('\nDone.\n');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ debugEvaluateWindow fatal error:', err.message);
  console.error(err.stack);
  process.exit(1);
});


