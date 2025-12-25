#!/usr/bin/env node

/**
 * POST-INGESTION QUALITY POLISH
 * 
 * Improves user-facing prediction quality:
 * - Makes generic narratives more specific
 * - Fixes ordinal house grammar (1th → 1st)
 * - Reduces repetition
 * - Removes placeholder text
 * 
 * IMPORTANT: Only modifies text content, NOT logic or counts
 */

import { query } from '../../config/db.js';

/**
 * Fix ordinal house grammar
 */
function fixOrdinalGrammar(text) {
  if (!text) return text;
  
  // Fix incorrect ordinals: 1th, 2th, 3th, etc.
  return text
    .replace(/(\d+)th\s+house/gi, (match, num) => {
      const n = parseInt(num);
      if (n === 1) return '1st house';
      if (n === 2) return '2nd house';
      if (n === 3) return '3rd house';
      return `${n}th house`;
    })
    .replace(/(\d+)th\s+/gi, (match, num) => {
      const n = parseInt(num);
      if (n === 1) return '1st ';
      if (n === 2) return '2nd ';
      if (n === 3) return '3rd ';
      return `${n}th `;
    });
}

/**
 * House domain mapping for making narratives specific
 */
const HOUSE_DOMAINS = {
  1: ['self-identity', 'personality', 'physical appearance', 'personal confidence', 'how you present yourself'],
  2: ['wealth', 'possessions', 'family resources', 'speech', 'food habits', 'financial stability'],
  3: ['communication', 'siblings', 'courage', 'short journeys', 'writing', 'learning'],
  4: ['home', 'mother', 'property', 'emotional foundations', 'inner peace', 'domestic life'],
  5: ['creativity', 'children', 'education', 'romance', 'speculation', 'intelligence'],
  6: ['health', 'service', 'daily routines', 'enemies', 'workplace challenges', 'diseases'],
  7: ['partnerships', 'marriage', 'business relationships', 'public dealings', 'spouse'],
  8: ['transformation', 'occult', 'longevity', 'shared resources', 'sudden changes', 'mysteries'],
  9: ['spirituality', 'higher learning', 'father', 'dharma', 'philosophy', 'long journeys'],
  10: ['career', 'reputation', 'public standing', 'authority', 'profession', 'status'],
  11: ['gains', 'income', 'friendships', 'aspirations', 'social networks', 'fulfillment of desires'],
  12: ['losses', 'expenses', 'spirituality', 'isolation', 'hidden enemies', 'karma', 'liberation'],
};

/**
 * Planet influence keywords
 */
const PLANET_INFLUENCES = {
  'SUN': ['authority', 'leadership', 'ego', 'vitality', 'father', 'government', 'power'],
  'MOON': ['emotions', 'mind', 'mother', 'intuition', 'fluctuations', 'public', 'nurturing'],
  'MARS': ['energy', 'action', 'courage', 'conflict', 'passion', 'sports', 'surgery'],
  'MERCURY': ['communication', 'intelligence', 'business', 'writing', 'learning', 'siblings'],
  'JUPITER': ['wisdom', 'expansion', 'guru', 'philosophy', 'wealth', 'children', 'spirituality'],
  'VENUS': ['love', 'relationships', 'beauty', 'arts', 'luxury', 'comfort', 'marriage'],
  'SATURN': ['discipline', 'delays', 'karma', 'hard work', 'restrictions', 'longevity', 'patience'],
  'RAHU': ['desires', 'materialism', 'foreign', 'technology', 'unconventional', 'sudden gains'],
  'KETU': ['detachment', 'spirituality', 'mysticism', 'loss', 'liberation', 'past karma'],
};

/**
 * Make generic narrative more specific using planet + house info
 */
function improveGenericNarrative(text, planet, house) {
  if (!text) return text;
  
  // Check if text is generic
  const genericPatterns = [
    /this planetary configuration creates specific influences/i,
    /this placement affects life experiences/i,
    /this configuration affects events and experiences/i,
    /this planetary placement influences various aspects/i,
    /creates specific influences that shape/i,
    /affects the native's life/i,
  ];
  
  const isGeneric = genericPatterns.some(pattern => pattern.test(text));
  
  if (!isGeneric || (!planet && !house)) {
    return text; // Not generic or no context to improve
  }
  
  // Extract house number
  const houseNum = house ? parseInt(house) : null;
  const planetName = planet ? planet.toUpperCase() : null;
  
  // Build specific narrative
  let specificText = '';
  
  if (houseNum && HOUSE_DOMAINS[houseNum]) {
    const domains = HOUSE_DOMAINS[houseNum];
    const primaryDomain = domains[0];
    const secondaryDomain = domains[1] || domains[0];
    
    if (planetName && PLANET_INFLUENCES[planetName]) {
      const influences = PLANET_INFLUENCES[planetName];
      const primaryInfluence = influences[0];
      
      specificText = `This placement influences ${primaryDomain} and ${secondaryDomain}, ` +
                    `bringing ${primaryInfluence} and related energies to these areas of life.`;
    } else {
      specificText = `This placement influences ${primaryDomain} and ${secondaryDomain}, ` +
                    `shaping experiences related to these life areas.`;
    }
  } else if (planetName && PLANET_INFLUENCES[planetName]) {
    const influences = PLANET_INFLUENCES[planetName];
    specificText = `This placement brings ${influences[0]} and ${influences[1] || influences[0]} ` +
                  `into focus, influencing related life experiences.`;
  } else {
    return text; // Can't improve without context
  }
  
  return specificText;
}

/**
 * Remove repetition between sentences
 */
function removeRepetition(text) {
  if (!text) return text;
  
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  if (sentences.length < 2) return text;
  
  const cleaned = [];
  let prevSentence = '';
  
  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    
    // Check if this sentence is too similar to previous
    if (prevSentence) {
      const similarity = calculateSimilarity(trimmed, prevSentence);
      
      // If >70% similar and same meaning, skip
      if (similarity > 0.7 && hasSameMeaning(trimmed, prevSentence)) {
        continue; // Skip repetitive sentence
      }
    }
    
    cleaned.push(trimmed);
    prevSentence = trimmed;
  }
  
  return cleaned.join('. ').trim() + (cleaned.length > 0 ? '.' : '');
}

/**
 * Calculate similarity between two sentences
 */
function calculateSimilarity(s1, s2) {
  const words1 = new Set(s1.toLowerCase().split(/\s+/));
  const words2 = new Set(s2.toLowerCase().split(/\s+/));
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
}

/**
 * Check if two sentences have the same meaning
 */
function hasSameMeaning(s1, s2) {
  const keyVerbs = ['influences', 'shapes', 'affects', 'creates', 'brings', 'determines'];
  const s1Lower = s1.toLowerCase();
  const s2Lower = s2.toLowerCase();
  
  // Check if they use similar verbs
  const s1Verb = keyVerbs.find(v => s1Lower.includes(v));
  const s2Verb = keyVerbs.find(v => s2Lower.includes(v));
  
  if (s1Verb && s2Verb && s1Verb !== s2Verb) {
    // Different verbs but might mean same thing
    return calculateSimilarity(s1, s2) > 0.6;
  }
  
  return false;
}

/**
 * Remove placeholder text
 */
function removePlaceholders(text) {
  if (!text) return text;
  
  return text
    .replace(/\(house\)/gi, '')
    .replace(/unknown sign/gi, '')
    .replace(/sign\s*:\s*null/gi, '')
    .replace(/signName\s*:\s*null/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Improve a single rule's narrative
 */
function improveRuleNarrative(rule) {
  let improved = rule.canonical_meaning || '';
  
  if (!improved) return improved;
  
  // Extract planet and house from condition_tree or effect_json
  let planet = null;
  let house = null;
  
  if (rule.condition_tree) {
    const ct = typeof rule.condition_tree === 'string' 
      ? JSON.parse(rule.condition_tree) 
      : rule.condition_tree;
    
    if (ct?.planet_in_house) {
      const planets = ct.planet_in_house.planet_in || [];
      const houses = ct.planet_in_house.house_in || [];
      
      if (planets.length > 0) planet = planets[0];
      if (houses.length > 0) house = houses[0];
    }
  }
  
  // Apply improvements
  improved = fixOrdinalGrammar(improved);
  improved = removePlaceholders(improved);
  improved = improveGenericNarrative(improved, planet, house);
  improved = removeRepetition(improved);
  
  return improved;
}

/**
 * Improve a single remedy's description
 */
function improveRemedyDescription(remedy) {
  let improved = remedy.description || '';
  
  if (!improved) return improved;
  
  // Apply improvements
  improved = fixOrdinalGrammar(improved);
  improved = removePlaceholders(improved);
  improved = removeRepetition(improved);
  
  return improved;
}

/**
 * Main polish function
 */
async function polishDatabase() {
  console.log('\n✨ POST-INGESTION QUALITY POLISH\n');
  console.log('='.repeat(70));
  
  let rulesUpdated = 0;
  let remediesUpdated = 0;
  
  try {
    // Get all rules
    console.log('\n📋 Polishing Rules...');
    const rulesRes = await query(`
      SELECT 
        id, 
        rule_id,
        canonical_meaning,
        condition_tree,
        effect_json,
        source_book
      FROM rules
      WHERE is_active = TRUE
      ORDER BY id
    `);
    
    console.log(`   Found ${rulesRes.rows.length} rules to check`);
    
    for (const rule of rulesRes.rows) {
      const original = rule.canonical_meaning || '';
      const improved = improveRuleNarrative(rule);
      
      if (improved !== original && improved) {
        await query(`
          UPDATE rules
          SET canonical_meaning = $1
          WHERE id = $2
        `, [improved, rule.id]);
        
        rulesUpdated++;
        
        if (rulesUpdated % 100 === 0) {
          console.log(`   Updated ${rulesUpdated} rules...`);
        }
      }
    }
    
    console.log(`   ✅ Updated ${rulesUpdated} rules`);
    
    // Get all remedies
    console.log('\n💊 Polishing Remedies...');
    const remediesRes = await query(`
      SELECT 
        id,
        name,
        description
      FROM remedies
      WHERE is_active = TRUE
      ORDER BY id
    `);
    
    console.log(`   Found ${remediesRes.rows.length} remedies to check`);
    
    // Batch updates for better performance
    const remedyUpdates = [];
    
    for (const remedy of remediesRes.rows) {
      const original = remedy.description || '';
      const improved = improveRemedyDescription(remedy);
      
      if (improved !== original && improved && improved.trim().length > 0) {
        remedyUpdates.push({ id: remedy.id, text: improved });
      }
    }
    
    // Execute batch updates
    console.log(`   Processing ${remedyUpdates.length} remedies to update...`);
    
    for (let i = 0; i < remedyUpdates.length; i += 100) {
      const batch = remedyUpdates.slice(i, i + 100);
      
      // Update in parallel batches
      await Promise.all(
        batch.map(update =>
          query(`
            UPDATE remedies
            SET description = $1
            WHERE id = $2
          `, [update.text, update.id])
        )
      );
      
      remediesUpdated += batch.length;
      console.log(`   Updated ${remediesUpdated} / ${remedyUpdates.length} remedies...`);
    }
    
    console.log(`   ✅ Updated ${remediesUpdated} remedies`);
    
    console.log('\n' + '='.repeat(70));
    console.log(`\n✅ QUALITY POLISH COMPLETE`);
    console.log(`   Rules updated: ${rulesUpdated}`);
    console.log(`   Remedies updated: ${remediesUpdated}\n`);
    
  } catch (err) {
    console.error('❌ Error:', err);
    throw err;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  polishDatabase().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}

export { polishDatabase, improveRuleNarrative, improveRemedyDescription };

