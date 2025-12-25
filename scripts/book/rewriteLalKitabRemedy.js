/**
 * REWRITE LAL KITAB REMEDIES IN CALM, HUMAN ENGLISH
 * 
 * This should sound like an experienced Lal Kitab practitioner
 * gently advising after understanding the karmic imbalance.
 * 
 * No fear. No threats. No guarantees. No absolutes.
 */

function rewriteLalKitabRemedy(understanding, sourceText, detectedEntities) {
  const { remedy_understanding, life_areas, jyotish_context } = understanding;
  const { planets, houses } = detectedEntities || {};
  
  if (!remedy_understanding || !remedy_understanding.has_remedies) {
    return null;
  }
  
  const { target_problems, detected_remedy_types, effect_type, karmic_intent } = remedy_understanding;
  
  // Build calm, human description
  let description = '';
  
  // Start with context if available
  if (planets && houses && planets.length > 0 && houses.length > 0) {
    description += `When ${planets.join(' and ')} ${planets.length === 1 ? 'is' : 'are'} in ${houses.length === 1 ? `house ${houses[0]}` : `houses ${houses.join(', ')}`}, `;
  }
  
  // Describe the problem/imbalance being addressed
  if (target_problems && target_problems.length > 0) {
    const problemNames = {
      'financial': 'financial challenges or money-related concerns',
      'health': 'health-related imbalances',
      'relationship': 'relationship difficulties or conflicts',
      'career': 'career or professional challenges',
      'mental': 'mental or emotional stress',
      'spiritual': 'spiritual or karmic imbalances',
      'conflict': 'conflicts or instability',
      'delay': 'delays or obstacles'
    };
    
    const problems = target_problems.map(p => problemNames[p] || p).join(' or ');
    description += `there may be a tendency toward ${problems}. `;
  }
  
  // Describe the remedy approach
  const remedyNames = {
    'meditation': 'meditation',
    'jap': 'mantra recitation (jap)',
    'donation': 'donation or giving',
    'feeding_beings': 'feeding animals or birds',
    'puja': 'puja or worship',
    'fast': 'fasting'
  };
  
  const remedies = detected_remedy_types.map(r => remedyNames[r] || r).join(' or ');
  
  // Explain the purpose
  if (effect_type === 'corrective') {
    description += `Practicing ${remedies} may help address these tendencies through karmic correction. `;
  } else if (effect_type === 'preventive') {
    description += `Practicing ${remedies} may help prevent or reduce these tendencies. `;
  } else if (effect_type === 'stabilizing') {
    description += `Practicing ${remedies} may help stabilize and bring balance to these areas. `;
  } else {
    description += `Practicing ${remedies} may support well-being in these areas. `;
  }
  
  // Add karmic intent if available
  if (karmic_intent) {
    description += `This approach aligns with the principle of karmic balance and conscious correction. `;
  }
  
  // Final calming note
  description += `As with all traditional practices, individual circumstances and personal approach play important roles.`;
  
  return description.trim();
}

export { rewriteLalKitabRemedy };

