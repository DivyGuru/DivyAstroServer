#!/usr/bin/env node

// Generate a prediction for a given window using the rule engine.
// Usage:
//   npm run generate:window -- WINDOW_ID

import { generatePredictionForWindowCore } from '../src/services/predictionEngine.js';

function printHeader(title) {
  console.log('='.repeat(60));
  console.log(title);
  console.log('='.repeat(60));
}

async function main() {
  const windowId = Number(process.argv[2]);

  printHeader('📡 Generate Prediction for Window');

  if (!windowId || Number.isNaN(windowId)) {
    console.error('❌ WINDOW_ID missing or invalid.');
    console.error('   Usage: npm run generate:window -- <WINDOW_ID>');
    process.exit(1);
  }

  console.log(`➡️  Window ID: ${windowId}`);

  const { predictionId, summary, shortSummary, applied } = await generatePredictionForWindowCore(
    windowId,
    { language: 'en' }
  );

  console.log('\n📊 Theme summary JSON:');
  console.log(JSON.stringify(summary, null, 2));

  console.log('\n📝 Short summary:');
  console.log(shortSummary || '(empty)');

  console.log(`\n✅ Upserted prediction id=${predictionId}`);
  console.log(`✅ Inserted ${applied.length} prediction_applied_rules rows.`);
  console.log('\n🎉 Prediction generation completed.\n');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ generatePredictionForWindow fatal error:', err.message);
  console.error(err.stack);
  process.exit(1);
});


