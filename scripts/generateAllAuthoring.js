#!/usr/bin/env node

// Generate conditions + remedies for ALL points in the taxonomy, one by one.
// Usage:
//   npm run author:all

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';
import { allPoints } from '../src/config/problemTaxonomy.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function printHeader(title) {
  console.log('='.repeat(60));
  console.log(title);
  console.log('='.repeat(60));
}

function runCommand(cmd, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      stdio: 'inherit',
      cwd: options.cwd || process.cwd(),
      env: process.env,
    });

    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${cmd} ${args.join(' ')} exited with code ${code}`));
      }
    });
  });
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const delayMs = Number(process.env.AUTHOR_DELAY_MS || '250');

  printHeader('🔁 Generating conditions + remedies for ALL taxonomy points');
  console.log(`Total points: ${allPoints.length}`);
  console.log(`Delay between operations: ${delayMs} ms\n`);

  // Optional: sort by theme → subtype → id for nicer grouping
  const sortedPoints = [...allPoints].sort((a, b) => {
    if (a.theme !== b.theme) return a.theme.localeCompare(b.theme);
    if (a.subtype !== b.subtype) return a.subtype.localeCompare(b.subtype);
    return a.id.localeCompare(b.id);
  });

  for (const point of sortedPoints) {
    console.log('\n');
    console.log('-'.repeat(60));
    console.log(`Point: ${point.id}  |  Theme: ${point.theme}  |  Subtype: ${point.subtype}`);
    console.log('-'.repeat(60));

    try {
      // Conditions
      console.log(`\n▶ Conditions for ${point.id}`);
      await runCommand('node', [path.join(__dirname, 'setPlanetaryConditions.js'), point.id], {
        cwd: path.resolve(__dirname, '..'),
      });
    } catch (err) {
      console.error(`❌ Failed set:conditions for ${point.id}: ${err.message}`);
    }

    await delay(delayMs);

    try {
      // Remedies
      console.log(`\n▶ Remedies for ${point.id}`);
      await runCommand('node', [path.join(__dirname, 'setRemedies.js'), point.id], {
        cwd: path.resolve(__dirname, '..'),
      });
    } catch (err) {
      console.error(`❌ Failed set:remedies for ${point.id}: ${err.message}`);
    }

    await delay(delayMs);
  }

  console.log('\n');
  printHeader('✅ Completed authoring for all points (conditions + remedies)');
}

main().catch((err) => {
  console.error('❌ generateAllAuthoring fatal error:', err.message);
  process.exit(1);
});


