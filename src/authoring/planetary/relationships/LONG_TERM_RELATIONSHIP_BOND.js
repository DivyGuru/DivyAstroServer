export function getLONG_TERM_RELATIONSHIP_BONDVariants() {
  const effectTheme = 'relationship';
  const area = 'long_term_relationship_bond';
  const pointId = 'LONG_TERM_RELATIONSHIP_BOND';

  const bondHouses = [7, 4, 2, 11];
  const repairHouses = [4, 6, 7];
  const distanceHouses = [12, 8];

  const benefics = ['JUPITER', 'VENUS'];
  const trade = ['MERCURY'];
  const malefics = ['SATURN', 'MARS', 'RAHU', 'KETU'];

  return [
    // 1) Strong long-term bond foundation
    {
      code: 'STRONG_LONG_TERM_FOUNDATION',
      label: 'Strong long-term bond foundation: supportive indicators across bonding houses.',
      condition_tree: {
        planet_in_house: {
          planet_in: [...benefics, ...trade],
          house_in: bondHouses,
          match_mode: 'any',
          min_planets: 2,
        },
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'up',
        intensity: 0.8,
        tone: 'positive',
        trigger: 'natal',
        scenario: 'strong_foundation',
        outcome_text:
          'Long-term bonding may feel easier to strengthen. Consistent care, reliability, and healthy routines can help the relationship mature steadily.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'high',
          dominance: 'dominant',
          certainty_note: 'Multiple supportive long-term indicators are present; this is treated as a primary stabilizing signal.',
        },
        point_id: pointId,
      },
    },

    // 2) Bond grows through structure (Saturn + benefic balance)
    {
      code: 'BOND_THROUGH_STRUCTURE',
      label: 'Bond strengthens through structure and follow-through (balanced Saturn + benefic).',
      scopes: ['monthly', 'yearly', 'life_theme'],
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: ['SATURN'], house_in: repairHouses, match_mode: 'any', min_planets: 1 } },
          { overall_benefic_score: { min: 0.6 } },
          { overall_malefic_score: { max: 0.75 } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.65,
        tone: 'cautious',
        trigger: 'natal',
        scenario: 'structure_strengthens',
        outcome_text:
          'Long-term stability can improve through structure. Clear agreements, predictable routines, and calm repair after misunderstandings can strengthen the bond over time.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'This is framed as a mitigation path: structure supports resilience and reduces recurring friction.',
        },
        point_id: pointId,
      },
    },

    // 3) Long-term support phase (benefic/trade dasha)
    {
      code: 'DASHA_LONG_TERM_SUPPORT',
      label: 'Long-term support during benefic/trade dasha phases.',
      scopes: ['monthly', 'yearly', 'life_theme'],
      condition_tree: {
        any: [
          { dasha_running: { level: 'mahadasha', planet_in: [5, 6, 4] } },
          { dasha_running: { level: 'antardasha', planet_in: [5, 6, 4] } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'up',
        intensity: 0.6,
        tone: 'positive',
        trigger: 'dasha',
        scenario: 'long_term_support',
        outcome_text:
          'A longer supportive phase may help the bond deepen. Consistent communication and shared routines can compound stability over time.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'background',
          certainty_note: 'This is framed as longer-term support; it informs strategy more than short-term decisions.',
        },
        point_id: pointId,
      },
    },

    // 4) Long-term pressure phase (malefic dasha)
    {
      code: 'DASHA_LONG_TERM_PRESSURE',
      label: 'Long-term pressure phase: bond needs intentional repair and boundaries.',
      scopes: ['monthly', 'yearly', 'life_theme'],
      condition_tree: {
        any: [
          { dasha_running: { level: 'mahadasha', planet_in: [7, 3, 8, 9] } },
          { dasha_running: { level: 'antardasha', planet_in: [7, 3, 8, 9] } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'down',
        intensity: 0.65,
        tone: 'challenging',
        trigger: 'dasha',
        scenario: 'long_term_pressure',
        outcome_text:
          'A longer sensitive phase may require patience and structure. Clear boundaries, calm communication, and consistent repair can protect the long-term bond.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'This guides long-term pacing and repair strategy without making absolute claims.',
        },
        point_id: pointId,
      },
    },

    // 5) Distance cycles threaten bonding (12th/8th malefic)
    {
      code: 'DISTANCE_CYCLES_RISK',
      label: 'Distance cycles risk: emotional availability is reduced by stress patterns.',
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: ['SATURN', 'KETU', 'RAHU'], house_in: distanceHouses, match_mode: 'any', min_planets: 1 } },
          { overall_malefic_score: { min: 0.6 } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'down',
        intensity: 0.7,
        tone: 'challenging',
        trigger: 'natal',
        scenario: 'distance_cycles',
        outcome_text:
          'Distance cycles may feel stronger. Predictable check-ins, emotional safety, and clear expectations can help protect the bond during sensitive periods.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'high',
          dominance: 'dominant',
          certainty_note: 'Strong distance-style indicators are present; guidance focuses on stability and reconnection practices.',
        },
        point_id: pointId,
      },
    },

    // 6) Repair via communication and clarity (Mercury)
    {
      code: 'CLARITY_STRENGTHENS_BOND',
      label: 'Clarity strengthens bond: communication hygiene reduces repeated misunderstandings.',
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: ['MERCURY'], house_in: [7, 11, 2], match_mode: 'any', min_planets: 1 } },
          { overall_benefic_score: { min: 0.55 } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'up',
        intensity: 0.55,
        tone: 'positive',
        trigger: 'natal',
        scenario: 'clarity_strengthens',
        outcome_text:
          'Communication and clarity may be a strong long-term lever. Confirming expectations, summarizing agreements, and staying consistent can deepen trust.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'Signals suggest clarity and consistency reduce recurring friction patterns over time.',
        },
        point_id: pointId,
      },
    },

    // 7) Shared values and resources alignment (2nd house)
    {
      code: 'VALUES_RESOURCES_ALIGNMENT',
      label: 'Shared values/resources alignment supports long-term bond.',
      condition_tree: {
        planet_in_house: { planet_in: ['JUPITER', 'VENUS'], house_in: [2], match_mode: 'any', min_planets: 1 },
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'up',
        intensity: 0.55,
        tone: 'positive',
        trigger: 'natal',
        scenario: 'values_alignment',
        outcome_text:
          'Shared values and practical alignment may support long-term stability. Clear agreements around responsibilities can reduce future friction.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'background',
          certainty_note: 'This is treated as a supportive factor for long-term stability.',
        },
        point_id: pointId,
      },
    },

    // 8) Social/community support strengthens bond (11th)
    {
      code: 'COMMUNITY_SUPPORT',
      label: 'Community and shared circle support long-term bonding.',
      condition_tree: {
        planet_in_house: { planet_in: ['VENUS', 'MERCURY', 'JUPITER'], house_in: [11], match_mode: 'any', min_planets: 1 },
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'up',
        intensity: 0.5,
        tone: 'positive',
        trigger: 'natal',
        scenario: 'community_support',
        outcome_text:
          'Supportive community or shared networks may strengthen the bond. Clear priorities and consistent behavior can help maintain stability.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'background',
          certainty_note: 'This is treated as a supportive factor, not a guarantee.',
        },
        point_id: pointId,
      },
    },

    // 9) Mixed: support + strain coexist
    {
      code: 'MIXED_LONG_TERM_SIGNALS',
      label: 'Mixed long-term signals: support exists alongside strain.',
      condition_tree: {
        all: [
          { overall_benefic_score: { min: 0.55 } },
          { overall_malefic_score: { min: 0.55 } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.6,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'mixed_signals',
        outcome_text:
          'Support and stress may coexist. Focusing on calm repair, clear boundaries, and consistent follow-through can strengthen the bond over time.',
        variant_meta: {
          tone: 'informational',
          confidence_level: 'medium',
          dominance: 'dominant',
          certainty_note: 'Mixed indicators require balanced guidance: protect the relationship with clarity and consistency.',
        },
        point_id: pointId,
      },
    },

    // 10) Short-term bonding window (transit benefics)
    {
      code: 'TRANSIT_BONDING_WINDOW',
      label: 'Short-term bonding window via benefic transits.',
      scopes: ['daily', 'weekly'],
      condition_tree: {
        transit_planet_in_house: {
          planet_in: ['VENUS', 'JUPITER'],
          house_in: [7, 5, 4, 11],
          match_mode: 'any',
          min_planets: 1,
        },
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'up',
        intensity: 0.45,
        tone: 'positive',
        trigger: 'transit',
        scenario: 'short_term_bonding',
        outcome_text:
          'A short-term bonding window may help. Small gestures, clear communication, and shared time can strengthen connection.',
        variant_meta: {
          tone: 'opportunity',
          confidence_level: 'low',
          dominance: 'background',
          certainty_note: 'This is time-bound support and is treated as background guidance.',
        },
        point_id: pointId,
      },
    },

    // 11) Short-term sensitivity window (transit malefics)
    {
      code: 'TRANSIT_SENSITIVITY_WINDOW',
      label: 'Short-term sensitivity: malefic transits activate distance/conflict houses.',
      scopes: ['hourly', 'daily', 'weekly'],
      condition_tree: {
        transit_planet_in_house: {
          planet_in: ['SATURN', 'MARS', 'RAHU', 'KETU'],
          house_in: [12, 8, 6, 7],
          match_mode: 'any',
          min_planets: 1,
        },
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'down',
        intensity: 0.5,
        tone: 'challenging',
        trigger: 'transit',
        scenario: 'short_term_sensitivity',
        outcome_text:
          'This may be a more sensitive window. Slower conversations, clearer boundaries, and avoiding reactive decisions can protect long-term trust.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'low',
          dominance: 'background',
          certainty_note: 'Time-bound caution is treated as background guidance to reduce avoidable friction.',
        },
        point_id: pointId,
      },
    },

    // 12) Repair capacity when both benefic and malefic present
    {
      code: 'REPAIR_CAPACITY_MIXED',
      label: 'Repair capacity: support exists even when stress is active.',
      scopes: ['monthly', 'yearly'],
      condition_tree: {
        all: [
          { overall_benefic_score: { min: 0.6 } },
          { overall_malefic_score: { min: 0.5 } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.5,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'repair_capacity',
        outcome_text:
          'Even with stress, repair may be possible. Calm communication, accountability, and consistent follow-through can protect the long-term bond.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'low',
          dominance: 'background',
          certainty_note: 'Used as a balancing note when both supportive and challenging signals are present.',
        },
        point_id: pointId,
      },
    },

    // 13) Bond erosion risk through repeated conflict (Mars/Saturn + high malefic)
    {
      code: 'BOND_EROSION_RISK',
      label: 'Bond erosion risk: repeated conflict patterns require intentional repair.',
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: ['MARS', 'SATURN'], house_in: [7, 6], match_mode: 'any', min_planets: 1 } },
          { overall_malefic_score: { min: 0.75 } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'down',
        intensity: 0.8,
        tone: 'challenging',
        trigger: 'natal',
        scenario: 'erosion_risk',
        outcome_text:
          'Repeated conflict patterns may strain long-term trust. Focusing on de-escalation, repair, and clear boundaries can prevent avoidable damage.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'high',
          dominance: 'dominant',
          certainty_note: 'High-pressure indicators are present; guidance focuses on risk-control and repair without fear-based language.',
        },
        point_id: pointId,
      },
    },

    // 14) Long-term bond strengthening through shared goals (11th + Mercury)
    {
      code: 'SHARED_GOALS_STRENGTHEN',
      label: 'Shared goals strengthen bond: planning and coordination reduce friction.',
      condition_tree: {
        planet_in_house: { planet_in: ['MERCURY'], house_in: [11, 7], match_mode: 'any', min_planets: 1 },
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'up',
        intensity: 0.5,
        tone: 'positive',
        trigger: 'natal',
        scenario: 'shared_goals',
        outcome_text:
          'Shared goals and consistent coordination may strengthen the bond. Clear responsibilities and predictable routines can reduce recurring misunderstandings.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'background',
          certainty_note: 'This emphasizes practical coordination as a long-term stabilizer.',
        },
        point_id: pointId,
      },
    },

    // 15) High-benefic baseline
    {
      code: 'BENEFIC_LONG_TERM_BASELINE',
      label: 'Broad supportive baseline for long-term bond (high benefic environment).',
      condition_tree: { overall_benefic_score: { min: 0.7 } },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'up',
        intensity: 0.45,
        tone: 'positive',
        trigger: 'natal',
        scenario: 'benefic_baseline',
        outcome_text:
          'Overall support may feel stronger for bonding. Small consistent gestures and calm communication can strengthen trust over time.',
        variant_meta: {
          tone: 'opportunity',
          confidence_level: 'low',
          dominance: 'background',
          certainty_note: 'This is a broad supportive baseline and does not imply certainty.',
        },
        point_id: pointId,
      },
    },

    // 16) Informational baseline
    {
      code: 'LONG_TERM_BOND_INFORMATIONAL_BASELINE',
      label: 'Baseline informational variant for long-term relationship bond context.',
      condition_tree: { generic_condition: { note: 'Long-term bond baseline (background).' } },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.35,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'informational_baseline',
        outcome_text:
          'No single strong long-term bond signal stands out here. Consistent communication, respectful boundaries, and steady follow-through can help maintain stability.',
        variant_meta: {
          tone: 'informational',
          confidence_level: 'low',
          dominance: 'background',
          certainty_note: 'Used as a baseline when stronger long-term bond variants do not match.',
        },
        point_id: pointId,
      },
    },
  ];
}


