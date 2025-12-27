/**
 * Test Script: Micro-Context Enrichment Verification
 * 
 * Tests if micro-context is being added to remedies in:
 * 1. Kundli predictions (theme-based)
 * 2. Mahadasha predictions (planet-based)
 * 3. Lal Kitab predictions (planet-based)
 * 
 * Usage:
 *   node scripts/testMicroContextEnrichment.js <windowId>
 * 
 * Example:
 *   node scripts/testMicroContextEnrichment.js 1
 */

import { query } from '../config/db.js';
import { generateKundli } from '../src/services/kundliGeneration.js';
import { generateMahadashaPhal } from '../src/services/mahadashaPhalGeneration.js';
import { generateLalkitabPrediction } from '../src/services/lalkitabPredictionGeneration.js';

const windowId = process.argv[2] ? Number(process.argv[2]) : null;

if (!windowId || Number.isNaN(windowId)) {
  console.error('\n❌ Error: Please provide a valid window_id');
  console.error('   Usage: node scripts/testMicroContextEnrichment.js <windowId>\n');
  process.exit(1);
}

// Context indicators to check for
const contextIndicators = [
  'Especially helpful during',
  'Useful when',
  'Supports',
  'Helpful when',
  'Helps maintain',
  'This is especially helpful'
];

function hasMicroContext(description) {
  if (!description || typeof description !== 'string') return false;
  return contextIndicators.some(indicator => 
    description.toLowerCase().includes(indicator.toLowerCase())
  );
}

function analyzeRemedies(remedies, source) {
  if (!Array.isArray(remedies) || remedies.length === 0) {
    return { total: 0, enriched: 0, notEnriched: 0, details: [] };
  }

  const details = remedies.map((r, index) => {
    const description = r.description || '';
    const isEnriched = hasMicroContext(description);
    return {
      index: index + 1,
      type: r.type || 'unknown',
      title: r.title || r.number || 'N/A',
      hasContext: isEnriched,
      description: description.substring(0, 150) + (description.length > 150 ? '...' : '')
    };
  });

  const enriched = details.filter(d => d.hasContext).length;
  const notEnriched = details.filter(d => !d.hasContext).length;

  return {
    total: remedies.length,
    enriched,
    notEnriched,
    details,
    source
  };
}

async function testKundliPredictions(windowId) {
  console.log('\n📋 Testing Kundli Predictions (Theme-based)...\n');
  
  try {
    const kundli = await generateKundli(windowId);
    
    if (!kundli || !kundli.sections || !Array.isArray(kundli.sections)) {
      console.log('   ⚠️  No sections found in kundli response');
      return null;
    }

    let totalRemedies = 0;
    let totalEnriched = 0;
    const sectionDetails = [];

    for (const section of kundli.sections) {
      if (section.remedies && Array.isArray(section.remedies) && section.remedies.length > 0) {
        const analysis = analyzeRemedies(section.remedies, section.domain);
        totalRemedies += analysis.total;
        totalEnriched += analysis.enriched;
        
        if (analysis.total > 0) {
          sectionDetails.push({
            domain: section.domain,
            ...analysis
          });
        }
      }
    }

    console.log(`   ✅ Total remedies: ${totalRemedies}`);
    console.log(`   ✅ Enriched (with context): ${totalEnriched}`);
    console.log(`   ⚠️  Not enriched: ${totalRemedies - totalEnriched}`);
    
    if (sectionDetails.length > 0) {
      console.log('\n   📊 By Section:');
      sectionDetails.forEach(s => {
        console.log(`      ${s.domain}: ${s.enriched}/${s.total} enriched`);
        s.details.forEach(d => {
          const status = d.hasContext ? '✅' : '❌';
          console.log(`         ${status} [${d.index}] ${d.type}: ${d.hasContext ? 'HAS CONTEXT' : 'NO CONTEXT'}`);
        });
      });
    }

    return {
      total: totalRemedies,
      enriched: totalEnriched,
      notEnriched: totalRemedies - totalEnriched,
      sections: sectionDetails
    };
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    return null;
  }
}

async function testMahadashaPredictions(windowId) {
  console.log('\n📋 Testing Mahadasha Predictions (Planet-based)...\n');
  
  try {
    const mahadasha = await generateMahadashaPhal(windowId);
    
    if (!mahadasha || !mahadasha.mahadasha_periods || !Array.isArray(mahadasha.mahadasha_periods)) {
      console.log('   ⚠️  No mahadasha periods found');
      return null;
    }

    const currentPeriod = mahadasha.mahadasha_periods.find(p => p.is_current);
    
    if (!currentPeriod || !currentPeriod.remedies || !Array.isArray(currentPeriod.remedies)) {
      console.log('   ⚠️  No current mahadasha period or no remedies found');
      return null;
    }

    const analysis = analyzeRemedies(currentPeriod.remedies, `Mahadasha: ${currentPeriod.planet}`);
    
    console.log(`   ✅ Current Mahadasha: ${currentPeriod.planet}`);
    console.log(`   ✅ Total remedies: ${analysis.total}`);
    console.log(`   ✅ Enriched (with context): ${analysis.enriched}`);
    console.log(`   ⚠️  Not enriched: ${analysis.notEnriched}`);
    
    if (analysis.details.length > 0) {
      console.log('\n   📊 Remedy Details:');
      analysis.details.forEach(d => {
        const status = d.hasContext ? '✅' : '❌';
        console.log(`      ${status} [${d.index}] ${d.type}: ${d.hasContext ? 'HAS CONTEXT' : 'NO CONTEXT'}`);
        if (d.description) {
          console.log(`         "${d.description.substring(0, 100)}..."`);
        }
      });
    }

    return analysis;
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    return null;
  }
}

async function testLalkitabPredictions(windowId) {
  console.log('\n📋 Testing Lal Kitab Predictions (Planet-based)...\n');
  
  try {
    const lalkitab = await generateLalkitabPrediction(windowId);
    
    if (!lalkitab || !lalkitab.predictions || !Array.isArray(lalkitab.predictions)) {
      console.log('   ⚠️  No predictions found');
      return null;
    }

    let totalRemedies = 0;
    let totalEnriched = 0;
    const predictionDetails = [];

    for (const prediction of lalkitab.predictions) {
      if (prediction.remedies && Array.isArray(prediction.remedies) && prediction.remedies.length > 0) {
        const analysis = analyzeRemedies(prediction.remedies, `${prediction.planet} in ${prediction.house}`);
        totalRemedies += analysis.total;
        totalEnriched += analysis.enriched;
        
        if (analysis.total > 0) {
          predictionDetails.push({
            planet: prediction.planet,
            house: prediction.house,
            ...analysis
          });
        }
      }
    }

    console.log(`   ✅ Total remedies: ${totalRemedies}`);
    console.log(`   ✅ Enriched (with context): ${totalEnriched}`);
    console.log(`   ⚠️  Not enriched: ${totalRemedies - totalEnriched}`);
    
    if (predictionDetails.length > 0) {
      console.log('\n   📊 By Planet:');
      predictionDetails.forEach(p => {
        console.log(`      ${p.planet} in House ${p.house}: ${p.enriched}/${p.total} enriched`);
        p.details.forEach(d => {
          const status = d.hasContext ? '✅' : '❌';
          console.log(`         ${status} [${d.index}] ${d.hasContext ? 'HAS CONTEXT' : 'NO CONTEXT'}`);
        });
      });
    }

    return {
      total: totalRemedies,
      enriched: totalEnriched,
      notEnriched: totalRemedies - totalEnriched,
      predictions: predictionDetails
    };
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    return null;
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  MICRO-CONTEXT ENRICHMENT TEST');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`\n   Window ID: ${windowId}\n`);

  // Verify window exists
  try {
    const windowRes = await query('SELECT id, scope FROM prediction_windows WHERE id = $1', [windowId]);
    if (windowRes.rowCount === 0) {
      console.error(`\n❌ Error: Window ${windowId} not found\n`);
      process.exit(1);
    }
    console.log(`   ✅ Window found (scope: ${windowRes.rows[0].scope})\n`);
  } catch (error) {
    console.error(`\n❌ Error checking window: ${error.message}\n`);
    process.exit(1);
  }

  const results = {
    kundli: null,
    mahadasha: null,
    lalkitab: null
  };

  // Test all three prediction types
  results.kundli = await testKundliPredictions(windowId);
  results.mahadasha = await testMahadashaPredictions(windowId);
  results.lalkitab = await testLalkitabPredictions(windowId);

  // Summary
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  SUMMARY');
  console.log('═══════════════════════════════════════════════════════════\n');

  const totalRemedies = (results.kundli?.total || 0) + 
                        (results.mahadasha?.total || 0) + 
                        (results.lalkitab?.total || 0);
  
  const totalEnriched = (results.kundli?.enriched || 0) + 
                        (results.mahadasha?.enriched || 0) + 
                        (results.lalkitab?.enriched || 0);

  console.log(`   Total Remedies Found: ${totalRemedies}`);
  console.log(`   Total Enriched: ${totalEnriched}`);
  console.log(`   Not Enriched: ${totalRemedies - totalEnriched}`);
  
  if (totalRemedies > 0) {
    const enrichmentRate = ((totalEnriched / totalRemedies) * 100).toFixed(1);
    console.log(`   Enrichment Rate: ${enrichmentRate}%`);
    
    if (enrichmentRate >= 50) {
      console.log('\n   ✅✅✅ ENRICHMENT WORKING WELL ✅✅✅\n');
    } else if (enrichmentRate > 0) {
      console.log('\n   ⚠️  PARTIAL ENRICHMENT - Check context sources\n');
    } else {
      console.log('\n   ❌ NO ENRICHMENT DETECTED - Check implementation\n');
    }
  } else {
    console.log('\n   ⚠️  NO REMEDIES FOUND - Check window data\n');
  }

  process.exit(0);
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});

