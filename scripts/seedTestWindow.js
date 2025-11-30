#!/usr/bin/env node

// Seed script: create a test prediction_window + mock astro snapshot
// Usage:
//   npm run seed:test-window

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function printHeader(title) {
  console.log('='.repeat(60));
  console.log(title);
  console.log('='.repeat(60));
}

function runCommand(cmd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      stdio: 'inherit',
      cwd: path.resolve(__dirname, '..'),
      env: process.env,
    });
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} ${args.join(' ')} exited with code ${code}`));
    });
  });
}

async function main() {
  printHeader('🌱 Seed Test Prediction Window');

  // 1. Create a simple daily window for user_id=1, chart_id=1
  const insertSql = `
    INSERT INTO prediction_windows (
      user_id,
      chart_id,
      scope,
      start_at,
      end_at,
      timezone
    )
    VALUES (
      1,
      1,
      'daily',
      NOW(),
      NOW() + INTERVAL '1 day',
      'Asia/Kolkata'
    )
    RETURNING id, scope;
  `;

  const res = await query(insertSql);
  const window = res.rows[0];
  console.log(`✅ Created prediction_window id=${window.id}, scope=${window.scope}`);

  // 2. Create mock astro snapshot for this window
  console.log('\n➡️  Creating mock astro_state_snapshot ...');
  await runCommand('node', [path.join(__dirname, 'createMockAstroSnapshot.js'), String(window.id)]);

  console.log('\n✅ Seed completed. You can now run:');
  console.log(`   npm run debug:window -- ${window.id}`);
  console.log(`   npm run generate:window -- ${window.id}`);

  process.exit(0);
}

main().catch((err) => {
  console.error('❌ seedTestWindow fatal error:', err.message);
  console.error(err.stack);
  process.exit(1);
});


