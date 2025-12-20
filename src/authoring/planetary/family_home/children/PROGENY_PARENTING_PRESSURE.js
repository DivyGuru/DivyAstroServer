export function getPROGENY_PARENTING_PRESSUREVariants() {
  const effectTheme = 'family';
  const area = 'family_children';
  const pointId = 'PROGENY_PARENTING_PRESSURE';

  const responsibilityHouses = [4, 6, 10, 2];
  const childHouses = [5, 4];
  const stressHouses = [6, 12, 8];

  const benefics = ['JUPITER', 'VENUS', 'MOON'];
  const trade = ['MERCURY'];
  const malefics = ['SATURN', 'MARS', 'RAHU', 'KETU'];

  return [
    // 1) High parenting responsibility pressure (dominant)
    {
      code: 'HIGH_PARENTING_PRESSURE',
      label: 'High parenting responsibility pressure: elevated malefic score with responsibility load.',
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: ['SATURN'], house_in: [4, 6, 10], match_mode: 'any', min_planets: 1 } },
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
        scenario: 'high_pressure',
        outcome_text:
          'Parenting responsibilities may feel heavier in this phase. Clear routines, fair division of effort, and calm boundaries can reduce burnout and support steadier caregiving.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'high',
          dominance: 'dominant',
          certainty_note: 'Strong pressure indicators are present; guidance emphasizes pacing, boundaries, and sustainability.',
        },
        point_id: pointId,
      },
    },

    // 2) Workload-driven pressure (6/10)
    {
      code: 'WORKLOAD_DRIVEN_PRESSURE',
      label: 'Workload-driven pressure reduces emotional bandwidth.',
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: ['SATURN'], house_in: [6, 10], match_mode: 'any', min_planets: 1 } },
          { overall_malefic_score: { min: 0.6 } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.7,
        tone: 'cautious',
        trigger: 'natal',
        scenario: 'workload_pressure',
        outcome_text:
          'Workload may increase parenting pressure. Simplifying priorities, building predictable routines, and asking for support can reduce stress.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'This frames pressure as bandwidth + workload; structure is emphasized.',
        },
        point_id: pointId,
      },
    },

    // 3) Emotional fatigue / withdrawal risk (12th)
    {
      code: 'EMOTIONAL_FATIGUE',
      label: 'Emotional fatigue: rest and boundaries support caregiving.',
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: ['SATURN', 'KETU'], house_in: [12], match_mode: 'any', min_planets: 1 } },
          { overall_malefic_score: { min: 0.55 } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.65,
        tone: 'cautious',
        trigger: 'natal',
        scenario: 'emotional_fatigue',
        outcome_text:
          'Emotional fatigue may increase pressure. Clear boundaries, rest, and a simpler routine can help you stay steady and present.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'background',
          certainty_note: 'This is framed as sustainability guidance: reduce overload and protect emotional energy.',
        },
        point_id: pointId,
      },
    },

    // 4) Reactivity risk under pressure (Mars)
    {
      code: 'REACTIVITY_UNDER_PRESSURE',
      label: 'Reactivity under pressure: calmer pacing reduces conflict.',
      condition_tree: {
        planet_in_house: { planet_in: ['MARS'], house_in: [4, 6, 5], match_mode: 'any', min_planets: 1 },
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'down',
        intensity: 0.7,
        tone: 'challenging',
        trigger: 'natal',
        scenario: 'reactivity',
        outcome_text:
          'Reactivity may rise when responsibilities feel heavy. Pausing, keeping routines simple, and returning to calm repair can reduce avoidable stress.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'This is treated as a risk-control note to reduce escalation under stress.',
        },
        point_id: pointId,
      },
    },

    // 5) Support through nurturing (Moon/Venus)
    {
      code: 'NURTURING_SUPPORT',
      label: 'Nurturing support: emotional warmth helps manage responsibilities.',
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: ['MOON', 'VENUS'], house_in: childHouses, match_mode: 'any', min_planets: 1 } },
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
        scenario: 'nurturing_support',
        outcome_text:
          'Emotional warmth and nurturing may help ease pressure. Consistent reassurance, predictable routines, and shared support can improve steadiness.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'This emphasizes emotional grounding as a practical support factor.',
        },
        point_id: pointId,
      },
    },

    // 6) Practical systems reduce pressure (Mercury)
    {
      code: 'PRACTICAL_SYSTEMS',
      label: 'Practical systems reduce pressure: organization supports steadiness.',
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: ['MERCURY'], house_in: [2, 4, 11], match_mode: 'any', min_planets: 1 } },
          { overall_benefic_score: { min: 0.55 } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.5,
        tone: 'positive',
        trigger: 'natal',
        scenario: 'practical_systems',
        outcome_text:
          'Organization and clear routines may reduce pressure. Simple planning, shared responsibilities, and clear expectations can help you feel more in control.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'background',
          certainty_note: 'Signals suggest systems and planning are useful levers for reducing stress.',
        },
        point_id: pointId,
      },
    },

    // 7) Short-term sensitivity window (transit malefics)
    {
      code: 'TRANSIT_SENSITIVITY',
      label: 'Short-term sensitivity: malefic transits increase pressure.',
      scopes: ['hourly', 'daily', 'weekly'],
      condition_tree: {
        transit_planet_in_house: {
          planet_in: ['SATURN', 'MARS', 'RAHU', 'KETU'],
          house_in: [5, ...stressHouses],
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
          'This may be a more sensitive short-term window. Slower responses, clearer boundaries, and extra rest can reduce avoidable stress.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'low',
          dominance: 'background',
          certainty_note: 'Time-bound caution is treated as background guidance to reduce avoidable strain.',
        },
        point_id: pointId,
      },
    },

    // 8) Short-term relief window (transit benefics)
    {
      code: 'TRANSIT_RELIEF_WINDOW',
      label: 'Short-term relief: supportive transits reduce pressure.',
      scopes: ['daily', 'weekly'],
      condition_tree: {
        transit_planet_in_house: {
          planet_in: ['JUPITER', 'VENUS', 'MOON'],
          house_in: [4, 5, 11],
          match_mode: 'any',
          min_planets: 1,
        },
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.45,
        tone: 'positive',
        trigger: 'transit',
        scenario: 'relief_window',
        outcome_text:
          'Pressure may ease slightly in the short term. It can be a good time to reset routines and clarify responsibilities calmly.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'low',
          dominance: 'background',
          certainty_note: 'This is time-bound and used mainly to support stabilization.',
        },
        point_id: pointId,
      },
    },

    // 9) Long-term pressure phase (malefic dasha)
    {
      code: 'DASHA_PRESSURE_PHASE',
      label: 'Longer pressure phase: boundaries and pacing protect sustainability.',
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
          'A longer sensitive phase may increase pressure. Clear boundaries, steady routines, and shared support can protect emotional well-being.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'This guides longer-term sustainability strategy without fear-based language.',
        },
        point_id: pointId,
      },
    },

    // 10) Long-term supportive phase (benefic/trade dasha)
    {
      code: 'DASHA_SUPPORT_PHASE',
      label: 'Longer supportive phase: steadier routines feel easier.',
      scopes: ['monthly', 'yearly', 'life_theme'],
      condition_tree: {
        any: [
          { dasha_running: { level: 'mahadasha', planet_in: [2, 5, 6, 4] } },
          { dasha_running: { level: 'antardasha', planet_in: [2, 5, 6, 4] } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.5,
        tone: 'positive',
        trigger: 'dasha',
        scenario: 'long_term_support',
        outcome_text:
          'Over time, routines and support may feel steadier. Consistency, clear planning, and emotional grounding can help reduce pressure gradually.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'background',
          certainty_note: 'This is framed as gradual support and does not imply certainty.',
        },
        point_id: pointId,
      },
    },

    // 11) Mixed: support and pressure coexist (dominant)
    {
      code: 'MIXED_SUPPORT_AND_PRESSURE',
      label: 'Mixed: support exists, but pressure requires careful pacing.',
      condition_tree: {
        all: [
          { overall_benefic_score: { min: 0.6 } },
          { overall_malefic_score: { min: 0.6 } },
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
          'Support and pressure may coexist. A paced approach, clear communication, and steady routines can help you stay grounded.',
        variant_meta: {
          tone: 'informational',
          confidence_level: 'medium',
          dominance: 'dominant',
          certainty_note: 'Mixed indicators require balanced guidance focused on sustainability.',
        },
        point_id: pointId,
      },
    },

    // 12) High-benefic baseline (background)
    {
      code: 'HIGH_BENEFIC_BASELINE',
      label: 'Broad supportive baseline for steadiness (high benefic environment).',
      condition_tree: { overall_benefic_score: { min: 0.7 } },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'up',
        intensity: 0.4,
        tone: 'positive',
        trigger: 'natal',
        scenario: 'benefic_baseline',
        outcome_text:
          'Overall support may feel stronger for steadiness. Using this time to simplify routines and build supportive habits can reduce stress.',
        variant_meta: {
          tone: 'opportunity',
          confidence_level: 'low',
          dominance: 'background',
          certainty_note: 'This is a broad supportive baseline and does not imply certainty.',
        },
        point_id: pointId,
      },
    },

    // 13) Pressure from finances / resources (2nd + malefic)
    {
      code: 'RESOURCE_PRESSURE',
      label: 'Resource pressure: practical planning reduces stress.',
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: ['SATURN', 'RAHU', 'KETU'], house_in: [2], match_mode: 'any', min_planets: 1 } },
          { overall_malefic_score: { min: 0.55 } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.6,
        tone: 'cautious',
        trigger: 'natal',
        scenario: 'resource_pressure',
        outcome_text:
          'Resource-related stress may add pressure. Clear budgeting, shared planning, and setting realistic expectations can help reduce anxiety.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'This frames pressure as practical stress; planning is emphasized.',
        },
        point_id: pointId,
      },
    },

    // 14) Informational baseline
    {
      code: 'PARENTING_PRESSURE_INFORMATIONAL_BASELINE',
      label: 'Baseline informational variant for parenting pressure context.',
      condition_tree: { generic_condition: { note: 'Parenting pressure baseline (background).' } },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.35,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'informational_baseline',
        outcome_text:
          'No single strong pressure signal stands out here. Simple routines, calm communication, and shared support can help maintain balance.',
        variant_meta: {
          tone: 'informational',
          confidence_level: 'low',
          dominance: 'background',
          certainty_note: 'Used as a baseline when stronger parenting-pressure variants do not match.',
        },
        point_id: pointId,
      },
    },
  ];
}


