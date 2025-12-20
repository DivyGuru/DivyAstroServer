export function getPROGENY_TIMING_WINDOWVariants() {
  const effectTheme = 'family';
  const area = 'family_children';
  const pointId = 'PROGENY_TIMING_WINDOW';

  const childHouses = [5, 2, 4, 9, 11];
  const readinessHouses = [1, 4, 5];
  const stressHouses = [6, 12, 8];

  const benefics = ['JUPITER', 'VENUS', 'MOON'];
  const trade = ['MERCURY'];
  const malefics = ['SATURN', 'MARS', 'RAHU', 'KETU'];

  // Planet ids: Sun=1, Moon=2, Mars=3, Mercury=4, Jupiter=5, Venus=6, Saturn=7, Rahu=8, Ketu=9
  const SUPPORT_IDS = [2, 5, 6, 4];
  const CAUTION_IDS = [7, 3, 8, 9];

  return [
    // 1) Supportive timing window (natal)
    {
      code: 'NATAL_SUPPORTIVE_TIMING',
      label: 'Supportive timing window: benefics/trade planets active in children/support houses.',
      condition_tree: {
        planet_in_house: {
          planet_in: [...benefics, ...trade],
          house_in: childHouses,
          match_mode: 'any',
          min_planets: 2,
        },
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'up',
        intensity: 0.7,
        tone: 'positive',
        trigger: 'natal',
        scenario: 'supportive_timing',
        outcome_text:
          'A progeny-support yog is present. Timing may be supportive—step-by-step planning, emotional readiness, and calm communication can improve clarity.',
        variant_meta: {
          tone: 'opportunity',
          confidence_level: 'high',
          dominance: 'dominant',
          certainty_note: 'Supportive timing indicators are stronger, so this is treated as a primary yog-window.',
        },
        point_id: pointId,
      },
    },

    // 2) Readiness alignment (1/4/5)
    {
      code: 'READINESS_ALIGNMENT',
      label: 'Readiness alignment: emotional stability and preparation support timing.',
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: ['MOON', 'VENUS', 'MERCURY'], house_in: readinessHouses, match_mode: 'any', min_planets: 1 } },
          { overall_benefic_score: { min: 0.55 } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'up',
        intensity: 0.6,
        tone: 'positive',
        trigger: 'natal',
        scenario: 'readiness_alignment',
        outcome_text:
          'Readiness may feel more aligned. Keeping plans realistic and focusing on stable routines can support smoother progress.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'Signals emphasize readiness and stability; outcomes still depend on practical planning.',
        },
        point_id: pointId,
      },
    },

    // 3) Transit supportive window (short-term)
    {
      code: 'TRANSIT_SUPPORT_WINDOW',
      label: 'Short-term supportive window: benefic transits activate children/support houses.',
      scopes: ['daily', 'weekly'],
      condition_tree: {
        transit_planet_in_house: {
          planet_in: ['JUPITER', 'VENUS', 'MOON'],
          house_in: [5, 4, 2, 11],
          match_mode: 'any',
          min_planets: 1,
        },
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'up',
        intensity: 0.5,
        tone: 'positive',
        trigger: 'transit',
        scenario: 'short_term_support',
        outcome_text:
          'A short-term supportive window may be available for important conversations and planning. Moving step-by-step and staying grounded can help.',
        variant_meta: {
          tone: 'opportunity',
          confidence_level: 'low',
          dominance: 'background',
          certainty_note: 'This is time-bound support and is treated as background guidance.',
        },
        point_id: pointId,
      },
    },

    // 4) Transit sensitivity window (short-term)
    {
      code: 'TRANSIT_SENSITIVITY_WINDOW',
      label: 'Short-term sensitivity: malefic transits activate stress houses.',
      scopes: ['daily', 'weekly'],
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
          'This may be a more sensitive window. Extra patience, calmer communication, and avoiding rushed decisions can reduce stress.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'low',
          dominance: 'background',
          certainty_note: 'Time-bound caution is treated as background guidance to reduce avoidable strain.',
        },
        point_id: pointId,
      },
    },

    // 5) Dasha supportive phase (long-term)
    {
      code: 'DASHA_SUPPORT_PHASE',
      label: 'Long-term supportive timing phase during benefic/trade dasha.',
      scopes: ['monthly', 'yearly', 'life_theme'],
      condition_tree: {
        any: [
          { dasha_running: { level: 'mahadasha', planet_in: SUPPORT_IDS } },
          { dasha_running: { level: 'antardasha', planet_in: SUPPORT_IDS } },
          { dasha_running: { level: 'pratyantardasha', planet_in: SUPPORT_IDS } },
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
          'A progeny-support yog is present, and this phase may support progress gradually. With consistent routines, readiness, and practical planning, stability can improve over time.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'This is treated as a longer supportive yog-phase where pacing and readiness are prioritized.',
        },
        point_id: pointId,
      },
    },

    // 6) Dasha caution phase (long-term)
    {
      code: 'DASHA_CAUTION_PHASE',
      label: 'Longer sensitive phase: pacing helps during malefic dasha patterns.',
      scopes: ['monthly', 'yearly', 'life_theme'],
      condition_tree: {
        any: [
          { dasha_running: { level: 'mahadasha', planet_in: CAUTION_IDS } },
          { dasha_running: { level: 'antardasha', planet_in: CAUTION_IDS } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'down',
        intensity: 0.6,
        tone: 'challenging',
        trigger: 'dasha',
        scenario: 'long_term_caution',
        outcome_text:
          'Timing may feel more sensitive during longer pressure patterns. Moving more slowly, focusing on readiness, and reducing external stressors can help.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'This guides pacing and readiness without making absolute claims.',
        },
        point_id: pointId,
      },
    },

    // 7) Delay then gradual improvement pattern (Saturn + benefic)
    {
      code: 'DELAY_THEN_IMPROVE',
      label: 'Delayed but improving pattern: structure plus support helps over time.',
      scopes: ['monthly', 'yearly'],
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: ['SATURN'], house_in: [5, 4], match_mode: 'any', min_planets: 1 } },
          { overall_benefic_score: { min: 0.6 } },
          { overall_malefic_score: { max: 0.75 } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.55,
        tone: 'cautious',
        trigger: 'natal',
        scenario: 'delay_then_improve',
        outcome_text:
          'A progeny-support yog is present, but it may activate after delay. With stability, routine, and calm planning, timing can improve gradually.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'background',
          certainty_note: 'This shows a delay-style pattern; with support, the yog may produce results gradually rather than immediately.',
        },
        point_id: pointId,
      },
    },

    // 8) External pressure affects timing (workload)
    {
      code: 'EXTERNAL_PRESSURE_AFFECTS_TIMING',
      label: 'External pressure affects timing: workload and stress reduce bandwidth.',
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: ['SATURN'], house_in: [6, 10], match_mode: 'any', min_planets: 1 } },
          { overall_malefic_score: { min: 0.55 } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.55,
        tone: 'cautious',
        trigger: 'natal',
        scenario: 'external_pressure',
        outcome_text:
          'External responsibilities may affect timing and readiness. Planning for stability and reducing pressure where possible can help you stay grounded.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'background',
          certainty_note: 'This frames sensitivity as readiness + bandwidth rather than a fixed outcome.',
        },
        point_id: pointId,
      },
    },

    // 9) Mixed environment: support + stress both active
    {
      code: 'MIXED_SUPPORT_STRESS',
      label: 'Mixed environment: supportive and challenging indicators both present.',
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
        intensity: 0.55,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'mixed_environment',
        outcome_text:
          'Support and stress may coexist. Stepwise planning, calm communication, and patience can help you make grounded decisions.',
        variant_meta: {
          tone: 'informational',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'Balanced guidance is emphasized under mixed indicators.',
        },
        point_id: pointId,
      },
    },

    // 10) High malefic sensitivity (dominant)
    {
      code: 'HIGH_SENSITIVITY_PHASE',
      label: 'High sensitivity phase: elevated malefic score requires extra patience.',
      condition_tree: {
        all: [
          { overall_malefic_score: { min: 0.75 } },
          { planet_in_house: { planet_in: malefics, house_in: [5, ...stressHouses], match_mode: 'any', min_planets: 1 } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'down',
        intensity: 0.7,
        tone: 'challenging',
        trigger: 'natal',
        scenario: 'high_sensitivity',
        outcome_text:
          'This may be a more sensitive phase for timing and readiness. Extra patience, emotional support, and avoiding pressure-driven decisions can help.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'high',
          dominance: 'dominant',
          certainty_note: 'Strong sensitivity indicators are present; guidance focuses on pacing and emotional safety.',
        },
        point_id: pointId,
      },
    },

    // 11) High benefic baseline (background)
    {
      code: 'HIGH_BENEFIC_BASELINE',
      label: 'Broad supportive baseline (high benefic environment).',
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
          'Overall support may feel stronger. Using this time for calm planning and readiness can be helpful.',
        variant_meta: {
          tone: 'opportunity',
          confidence_level: 'low',
          dominance: 'background',
          certainty_note: 'This is a broad supportive baseline and does not imply certainty.',
        },
        point_id: pointId,
      },
    },

    // 12) Gap/spacing tendency (soft) via Saturn influence
    {
      code: 'SPACING_GAP_TENDENCY',
      label: 'Spacing tendency: timing may naturally feel more spaced and paced.',
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: ['SATURN'], house_in: [5], match_mode: 'any', min_planets: 1 } },
          { overall_malefic_score: { min: 0.55 } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.5,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'spacing_tendency',
        outcome_text:
          'A more paced approach may suit you. Allowing time for stability between responsibilities and keeping expectations realistic can reduce stress.',
        variant_meta: {
          tone: 'informational',
          confidence_level: 'medium',
          dominance: 'background',
          certainty_note: 'This is framed as pacing/spacing guidance, not as an exact timing statement.',
        },
        point_id: pointId,
      },
    },

    // 13) Communication & planning support (Mercury)
    {
      code: 'PLANNING_COMMUNICATION_SUPPORT',
      label: 'Planning and communication support: clarity reduces uncertainty.',
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: ['MERCURY'], house_in: [2, 11, 4], match_mode: 'any', min_planets: 1 } },
          { overall_benefic_score: { min: 0.6 } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.45,
        tone: 'positive',
        trigger: 'natal',
        scenario: 'planning_support',
        outcome_text:
          'Clarity and planning may help timing feel less stressful. Confirming expectations and keeping decisions stepwise can support confidence.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'background',
          certainty_note: 'This highlights clarity as a practical lever without implying certainty.',
        },
        point_id: pointId,
      },
    },

    // 14) Informational baseline
    {
      code: 'PROGENY_TIMING_INFORMATIONAL_BASELINE',
      label: 'Baseline informational variant for progeny timing window context.',
      condition_tree: { generic_condition: { note: 'Progeny timing baseline (background).' } },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.35,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'informational_baseline',
        outcome_text:
          'No single strong timing signal stands out here. Focusing on readiness, calm planning, and emotional support can help you choose timing thoughtfully.',
        variant_meta: {
          tone: 'informational',
          confidence_level: 'low',
          dominance: 'background',
          certainty_note: 'Used as a baseline when stronger timing-window variants do not match.',
        },
        point_id: pointId,
      },
    },
  ];
}


