export function getPROGENY_DELAY_BLOCKVariants() {
  const effectTheme = 'family';
  const area = 'family_children';
  const pointId = 'PROGENY_DELAY_BLOCK';

  const childHouses = [5, 4, 2];
  const stressHouses = [6, 8, 12, 5];

  const benefics = ['JUPITER', 'VENUS', 'MOON'];
  const trade = ['MERCURY'];
  const malefics = ['SATURN', 'MARS', 'RAHU', 'KETU'];

  // Planet ids: Sun=1, Moon=2, Mars=3, Mercury=4, Jupiter=5, Venus=6, Saturn=7, Rahu=8, Ketu=9
  const SUPPORT_IDS = [2, 5, 6, 4];
  const PRESSURE_IDS = [7, 3, 8, 9];

  return [
    // 1) Delay tendency baseline (Saturn/Rahu influence on 5th)
    {
      code: 'NATAL_DELAY_TENDENCY',
      label: 'Delay tendency: pacing improves with stability and patience (no absolutes).',
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: ['SATURN', 'RAHU', 'KETU'], house_in: [5], match_mode: 'any', min_planets: 1 } },
          { overall_malefic_score: { min: 0.65 } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.8,
        tone: 'challenging',
        trigger: 'natal',
        scenario: 'delay_tendency',
        outcome_text:
          'A progeny-support yog is present, but it may activate after delay. Focus on readiness, stability, and stress reduction to support better timing (no guarantees).',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'high',
          dominance: 'dominant',
          certainty_note: 'Delay-style indicators are stronger, suggesting the yog may give results after a slower build-up rather than immediately.',
        },
        point_id: pointId,
      },
    },

    // 2) Uncertainty/ambiguity blocks clarity (Rahu/Ketu 5/8/12)
    {
      code: 'UNCERTAINTY_BLOCK',
      label: 'Uncertainty block: mixed signals require clarity and stepwise planning.',
      condition_tree: {
        planet_in_house: { planet_in: ['RAHU', 'KETU'], house_in: [5, 8, 12], match_mode: 'any', min_planets: 1 },
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.7,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'uncertainty_block',
        outcome_text:
          'Uncertainty may make decisions feel harder. Clarifying expectations, keeping plans stepwise, and avoiding pressure-driven choices can reduce stress.',
        variant_meta: {
          tone: 'informational',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'This is treated as an information-clarity signal, not a final outcome indicator.',
        },
        point_id: pointId,
      },
    },

    // 3) Responsibility load delays readiness (Saturn 6/10)
    {
      code: 'RESPONSIBILITY_LOAD_DELAY',
      label: 'Responsibility load delays readiness; pacing helps.',
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: ['SATURN'], house_in: [6, 10, 4], match_mode: 'any', min_planets: 1 } },
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
        scenario: 'responsibility_load',
        outcome_text:
          'Responsibilities may affect readiness and timing. Reducing stressors where possible and building stable routines can support gradual improvement.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'This frames delay as readiness + bandwidth, not as a fixed denial.',
        },
        point_id: pointId,
      },
    },

    // 4) Emotional sensitivity requires extra reassurance (Moon under stress)
    {
      code: 'EMOTIONAL_SENSITIVITY',
      label: 'Emotional sensitivity: extra reassurance and support reduce pressure.',
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: ['MOON'], house_in: [8, 12, 6], match_mode: 'any', min_planets: 1 } },
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
        scenario: 'emotional_sensitivity',
        outcome_text:
          'Emotional sensitivity may increase stress around decisions. Gentle communication, reassurance, and stable routines can help you feel more supported over time.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'background',
          certainty_note: 'This treats emotional stability as a key factor for readiness and pacing.',
        },
        point_id: pointId,
      },
    },

    // 5) Short-term sensitivity window (transit malefics)
    {
      code: 'TRANSIT_SENSITIVITY',
      label: 'Short-term sensitivity: malefic transits activate stress houses.',
      scopes: ['daily', 'weekly'],
      condition_tree: {
        transit_planet_in_house: {
          planet_in: ['SATURN', 'MARS', 'RAHU', 'KETU'],
          house_in: stressHouses,
          match_mode: 'any',
          min_planets: 1,
        },
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'down',
        intensity: 0.55,
        tone: 'challenging',
        trigger: 'transit',
        scenario: 'short_term_sensitivity',
        outcome_text:
          'This may be a more sensitive short-term window. Slower decisions and calmer communication can reduce avoidable stress.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'low',
          dominance: 'background',
          certainty_note: 'Time-bound caution is treated as background guidance to reduce avoidable strain.',
        },
        point_id: pointId,
      },
    },

    // 6) Short-term relief window (transit benefics)
    {
      code: 'TRANSIT_RELIEF',
      label: 'Short-term relief: supportive transits reduce pressure.',
      scopes: ['daily', 'weekly'],
      condition_tree: {
        transit_planet_in_house: {
          planet_in: ['JUPITER', 'VENUS', 'MOON'],
          house_in: childHouses,
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
          'Pressure may ease slightly in the short term. It can be a good time to stabilize routines and clarify plans calmly.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'low',
          dominance: 'background',
          certainty_note: 'This is time-bound and used mainly to support calm planning.',
        },
        point_id: pointId,
      },
    },

    // 7) Long-term pressure phase (malefic dasha)
    {
      code: 'DASHA_PRESSURE_PHASE',
      label: 'Long-term pressure phase: pacing is important during malefic dasha.',
      scopes: ['monthly', 'yearly', 'life_theme'],
      condition_tree: {
        any: [
          { dasha_running: { level: 'mahadasha', planet_in: PRESSURE_IDS } },
          { dasha_running: { level: 'antardasha', planet_in: PRESSURE_IDS } },
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
          'A longer sensitive phase may require patience and steady support. Focusing on readiness and reducing stress can help timing improve gradually.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'This guides longer-term pacing without making absolute claims.',
        },
        point_id: pointId,
      },
    },

    // 8) Long-term improvement/support phase (benefic/trade dasha)
    {
      code: 'DASHA_IMPROVEMENT_PHASE',
      label: 'Improving phase: supportive dasha patterns help readiness and calm planning.',
      scopes: ['monthly', 'yearly', 'life_theme'],
      condition_tree: {
        any: [
          { dasha_running: { level: 'mahadasha', planet_in: SUPPORT_IDS } },
          { dasha_running: { level: 'antardasha', planet_in: SUPPORT_IDS } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'up',
        intensity: 0.5,
        tone: 'positive',
        trigger: 'dasha',
        scenario: 'improving_phase',
        outcome_text:
          'Timing may feel more supportive over time. Stepwise planning, emotional readiness, and consistent routines can help you feel steadier.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'background',
          certainty_note: 'This is framed as gradual improvement support rather than certainty.',
        },
        point_id: pointId,
      },
    },

    // 9) Mixed support and blocks together
    {
      code: 'MIXED_SUPPORT_AND_BLOCKS',
      label: 'Mixed: supportive potential exists but blocks require patience.',
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: [...benefics, ...trade], house_in: [5, 4, 2], match_mode: 'any', min_planets: 1 } },
          { planet_in_house: { planet_in: malefics, house_in: stressHouses, match_mode: 'any', min_planets: 1 } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.65,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'mixed_signals',
        outcome_text:
          'Support and blocks may coexist. Keeping expectations realistic and focusing on readiness and stress reduction can support gradual improvement.',
        variant_meta: {
          tone: 'informational',
          confidence_level: 'medium',
          dominance: 'dominant',
          certainty_note: 'Mixed indicators require balanced guidance with patience and stepwise planning.',
        },
        point_id: pointId,
      },
    },

    // 10) High-malefic peak sensitivity (dominant)
    {
      code: 'PEAK_SENSITIVITY',
      label: 'Peak sensitivity: stronger pressure indicators present.',
      condition_tree: {
        all: [
          { overall_malefic_score: { min: 0.8 } },
          { planet_in_house: { planet_in: malefics, house_in: stressHouses, match_mode: 'any', min_planets: 1 } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'down',
        intensity: 0.75,
        tone: 'challenging',
        trigger: 'natal',
        scenario: 'peak_sensitivity',
        outcome_text:
          'This phase may feel more sensitive and demanding. Extra patience, emotional support, and avoiding pressure can help protect well-being.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'high',
          dominance: 'dominant',
          certainty_note: 'Strong pressure indicators are combined here; guidance emphasizes emotional safety and pacing.',
        },
        point_id: pointId,
      },
    },

    // 11) Structure reduces blocks (Saturn + benefic balance)
    {
      code: 'STRUCTURE_REDUCES_BLOCKS',
      label: 'Structure reduces blocks: stability and calm routines help over time.',
      scopes: ['monthly', 'yearly'],
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: ['SATURN'], house_in: [4, 6], match_mode: 'any', min_planets: 1 } },
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
        scenario: 'structure_support',
        outcome_text:
          'Progress may improve gradually through structure. Predictable routines, calmer planning, and steady support can reduce stress over time.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'This frames improvement as gradual support through structure, not certainty.',
        },
        point_id: pointId,
      },
    },

    // 12) High-benefic baseline (background)
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
          'Overall support may feel stronger for calm planning. Using this time for readiness and stable routines can be helpful.',
        variant_meta: {
          tone: 'opportunity',
          confidence_level: 'low',
          dominance: 'background',
          certainty_note: 'This is a broad supportive baseline and does not imply certainty.',
        },
        point_id: pointId,
      },
    },

    // 13) Communication and clarity reduce anxiety (Mercury)
    {
      code: 'CLARITY_REDUCES_ANXIETY',
      label: 'Clarity reduces anxiety: communication supports steadier decisions.',
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: ['MERCURY'], house_in: [2, 11, 4], match_mode: 'any', min_planets: 1 } },
          { overall_benefic_score: { min: 0.55 } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.45,
        tone: 'positive',
        trigger: 'natal',
        scenario: 'clarity_support',
        outcome_text:
          'Clear communication and planning may reduce stress. Stepwise decisions and realistic expectations can help you feel more grounded.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'background',
          certainty_note: 'Signals emphasize clarity as a practical lever without making medical or absolute claims.',
        },
        point_id: pointId,
      },
    },

    // 14) Informational baseline
    {
      code: 'PROGENY_DELAY_INFORMATIONAL_BASELINE',
      label: 'Baseline informational variant for progeny delay/block context.',
      condition_tree: { generic_condition: { note: 'Progeny delay baseline (background).' } },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.35,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'informational_baseline',
        outcome_text:
          'No single strong delay signal stands out here. Focusing on readiness, calm planning, and emotional support can help keep decisions grounded.',
        variant_meta: {
          tone: 'informational',
          confidence_level: 'low',
          dominance: 'background',
          certainty_note: 'Used as a baseline when stronger delay/block variants do not match.',
        },
        point_id: pointId,
      },
    },
  ];
}


