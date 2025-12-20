export function getRELATIONSHIP_MARRIAGE_TIMINGVariants() {
  const effectTheme = 'relationship';
  const area = 'relationship_marriage_timing';
  const pointId = 'RELATIONSHIP_MARRIAGE_TIMING';

  const marriageHouses = [7, 2, 4, 11];
  const readinessHouses = [1, 7, 10];
  const benefics = ['JUPITER', 'VENUS'];
  const trade = ['MERCURY'];
  const malefics = ['SATURN', 'MARS', 'RAHU', 'KETU'];

  // Planet ids: Sun=1, Moon=2, Mars=3, Mercury=4, Jupiter=5, Venus=6, Saturn=7, Rahu=8, Ketu=9
  const SUPPORT_IDS = [5, 6, 4]; // Jupiter/Venus/Mercury
  const CAUTION_IDS = [7, 8, 9, 3]; // Saturn/Rahu/Ketu/Mars

  return [
    // 1) Supportive marriage planning window (natal)
    {
      code: 'NATAL_MARRIAGE_SUPPORT_WINDOW',
      label: 'Supportive marriage planning window: benefics in marriage houses.',
      condition_tree: {
        all: [
          {
            planet_in_house: {
              planet_in: [...benefics, ...trade],
              house_in: marriageHouses,
              match_mode: 'any',
              min_planets: 2,
            },
          },
          // Activation of 7th house lord (natal)
          { house_lord_in_house: { house: 7, lord_house_in: [1, 7, 11, 2] } },
          // Venus/Jupiter strength (if snapshot provides strength numeric)
          { planet_strength: { planet: 'VENUS', min: 0.5 } },
          { planet_strength: { planet: 'JUPITER', min: 0.5 } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'up',
        intensity: 0.75,
        tone: 'positive',
        trigger: 'natal',
        scenario: 'supportive_timing',
        outcome_text:
          'A marriage yog is present. Timing may be supportive—step-by-step clarity, alignment with key stakeholders, and grounded decisions can improve progress.',
        variant_meta: {
          tone: 'opportunity',
          confidence_level: 'high',
          dominance: 'dominant',
          certainty_note: 'Supportive signals, 7th-lord activation, and Venus/Jupiter strength are aligned.',
        },
        point_id: pointId,
      },
    },

    // 2) Relationship readiness (1st + 7th support)
    {
      code: 'NATAL_READINESS_ALIGNMENT',
      label: 'Readiness alignment: initiative + partnership focus supports commitment decisions.',
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: ['SUN', 'MERCURY'], house_in: readinessHouses, match_mode: 'any', min_planets: 1 } },
          { overall_benefic_score: { min: 0.55 } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'up',
        intensity: 0.65,
        tone: 'positive',
        trigger: 'natal',
        scenario: 'readiness_alignment',
        outcome_text:
          'Readiness for commitment may increase. Clear communication about timelines, roles, and values can help you make mature decisions.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'Signals emphasize readiness and clarity; outcomes still depend on aligned expectations.',
        },
        point_id: pointId,
      },
    },

    // 3) Family and practical setup support (2nd/4th)
    {
      code: 'NATAL_FAMILY_SETUP_SUPPORT',
      label: 'Family/practical setup support for marriage decisions (2nd/4th).',
      condition_tree: {
        planet_in_house: { planet_in: ['JUPITER', 'VENUS'], house_in: [2, 4], match_mode: 'any', min_planets: 1 },
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'up',
        intensity: 0.6,
        tone: 'positive',
        trigger: 'natal',
        scenario: 'family_setup_support',
        outcome_text:
          'Practical and family-side alignment may be easier. Planning calmly and keeping discussions respectful can support smoother progress.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'background',
          certainty_note: 'This is treated as supportive for practical alignment, not as a guarantee.',
        },
        point_id: pointId,
      },
    },

    // 4) Transit: short-term supportive timing window
    {
      code: 'TRANSIT_SUPPORTIVE_TIMING',
      label: 'Short-term supportive timing via benefic transits in marriage houses.',
      scopes: ['daily', 'weekly'],
      condition_tree: {
        all: [
          {
            transit_planet_in_house: {
              planet_in: ['VENUS', 'JUPITER'],
              house_in: marriageHouses,
              match_mode: 'any',
              min_planets: 1,
            },
          },
          // Activation of 7th house lord via transit placement
          { transit_house_lord_in_house: { house: 7, lord_house_in: [7, 11, 2, 5] } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'up',
        intensity: 0.55,
        tone: 'positive',
        trigger: 'transit',
        scenario: 'short_term_support',
        outcome_text:
          'A supportive short-term marriage window may form. In this period, clarity and stepwise decisions can support better outcomes.',
        variant_meta: {
          tone: 'opportunity',
          confidence_level: 'low',
          dominance: 'background',
          certainty_note: 'This is time-bound support and is treated as background guidance.',
        },
        point_id: pointId,
      },
    },

    // 5) Dasha: supportive commitment phase
    {
      code: 'DASHA_SUPPORTIVE_COMMITMENT',
      label: 'Longer supportive commitment phase during benefic/trade dasha.',
      scopes: ['monthly', 'yearly', 'life_theme'],
      condition_tree: {
        all: [
          {
            any: [
              { dasha_running: { level: 'mahadasha', planet_in: SUPPORT_IDS } },
              { dasha_running: { level: 'antardasha', planet_in: SUPPORT_IDS } },
              { dasha_running: { level: 'pratyantardasha', planet_in: SUPPORT_IDS } },
            ],
          },
          // 7th lord activation as a commitment marker
          { house_lord_in_house: { house: 7, lord_house_in: [1, 7, 11, 2] } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'up',
        intensity: 0.65,
        tone: 'positive',
        trigger: 'dasha',
        scenario: 'supportive_phase',
        outcome_text:
          'A marriage yog is present, and this phase can support commitment decisions. Steady planning, honest communication, and realistic timelines can help.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'This is framed as longer-term support; it guides strategy rather than guaranteeing an outcome.',
        },
        point_id: pointId,
      },
    },

    // 6) Delay / hesitation (Saturn in marriage houses)
    {
      code: 'NATAL_DELAY_HESITATION',
      label: 'Delay/hesitation: Saturn emphasis in marriage houses suggests pacing and readiness work.',
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: ['SATURN'], house_in: marriageHouses, match_mode: 'any', min_planets: 1 } },
          { overall_malefic_score: { min: 0.6 } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.65,
        tone: 'cautious',
        trigger: 'natal',
        scenario: 'delay_hesitation',
        outcome_text:
          'A marriage yog is present, but it may activate after delay. Timing can feel more sensitive—focus on readiness, clarity, and practical planning (no guarantees).',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'Signals suggest a slower, more structured pace; readiness-building is emphasized.',
        },
        point_id: pointId,
      },
    },

    // 7) Family pressure sensitivity (Rahu/Saturn 2/4/7)
    {
      code: 'FAMILY_PRESSURE_SENSITIVITY',
      label: 'Family pressure sensitivity: external expectations complicate timing.',
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: ['RAHU', 'SATURN'], house_in: [2, 4, 7], match_mode: 'any', min_planets: 1 } },
          { overall_malefic_score: { min: 0.55 } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.65,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'family_pressure',
        outcome_text:
          'External pressure may complicate timing. It can help to keep conversations respectful, align privately first, and set boundaries with clarity and calm.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'This is treated as an external-pressure signal; boundary-setting is emphasized.',
        },
        point_id: pointId,
      },
    },

    // 8) Timing sensitivity due to uncertainty (Rahu/Ketu 7/8/12)
    {
      code: 'TIMING_UNCERTAINTY',
      label: 'Timing uncertainty: mixed signals and ambiguity require clarity before commitment steps.',
      condition_tree: {
        planet_in_house: { planet_in: ['RAHU', 'KETU'], house_in: [7, 8, 12], match_mode: 'any', min_planets: 1 },
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.7,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'timing_uncertainty',
        outcome_text:
          'Timing may feel uncertain. You may benefit from clarifying expectations, confirming commitments stepwise, and avoiding vague or rushed decisions.',
        variant_meta: {
          tone: 'informational',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'This is treated as an information-clarity signal rather than a definitive outcome indicator.',
        },
        point_id: pointId,
      },
    },

    // 9) Transit: caution window (malefic transit)
    {
      code: 'TRANSIT_CAUTION_TIMING',
      label: 'Short-term caution: malefic transits activate marriage houses.',
      scopes: ['daily', 'weekly'],
      condition_tree: {
        transit_planet_in_house: {
          planet_in: ['SATURN', 'MARS', 'RAHU', 'KETU'],
          house_in: marriageHouses,
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
        scenario: 'short_term_caution',
        outcome_text:
          'This may be a more sensitive short-term window. Slower steps, clearer communication, and extra checks on expectations can reduce misunderstandings.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'low',
          dominance: 'background',
          certainty_note: 'Time-bound caution is treated as background guidance to reduce avoidable friction.',
        },
        point_id: pointId,
      },
    },

    // 10) Dasha: caution phase (delay major steps)
    {
      code: 'DASHA_CAUTION_PHASE',
      label: 'Longer caution phase: pacing is helpful during malefic dasha patterns.',
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
        scenario: 'caution_phase',
        outcome_text:
          'A longer sensitive phase may suggest moving more slowly. You can focus on readiness, communication, and practical planning while keeping decisions grounded.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'This guides pacing and readiness; it does not make absolute claims about outcomes.',
        },
        point_id: pointId,
      },
    },

    // 11) Alignment: natal + transit support (strong window)
    {
      code: 'ALIGNMENT_SUPPORTIVE_WINDOW',
      label: 'Alignment window: natal support and current transits both support marriage planning.',
      scopes: ['weekly', 'monthly'],
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: ['VENUS', 'JUPITER'], house_in: marriageHouses, match_mode: 'any', min_planets: 1 } },
          {
            transit_planet_in_house: {
              planet_in: ['VENUS', 'JUPITER'],
              house_in: marriageHouses,
              match_mode: 'any',
              min_planets: 1,
            },
          },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'up',
        intensity: 0.75,
        tone: 'positive',
        trigger: 'combined',
        scenario: 'alignment_window',
        outcome_text:
          'Timing may feel more aligned when preparation meets supportive conditions. You can progress stepwise while keeping expectations and commitments clear.',
        variant_meta: {
          tone: 'opportunity',
          confidence_level: 'medium',
          dominance: 'dominant',
          certainty_note: 'Alignment signals increase confidence, but the language remains timing-sensitive and non-absolute.',
        },
        point_id: pointId,
      },
    },

    // 12) Readiness gap: career/workload interference (10th/6th pressure)
    {
      code: 'READINESS_GAP_WORKLOAD',
      label: 'Readiness gap: career/workload pressure makes timing feel harder.',
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: ['SATURN'], house_in: [10, 6], match_mode: 'any', min_planets: 1 } },
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
        scenario: 'workload_pressure',
        outcome_text:
          'Workload or career pressure may affect readiness. Clear planning, realistic timelines, and avoiding rushed commitments can help protect relationship health.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'background',
          certainty_note: 'This frames timing sensitivity as readiness + bandwidth, not as a final outcome.',
        },
        point_id: pointId,
      },
    },

    // 13) Communication + negotiation support (Mercury/Venus in 7)
    {
      code: 'NEGOTIATION_SUPPORT',
      label: 'Negotiation support: calmer conversations help align expectations.',
      condition_tree: {
        planet_in_house: { planet_in: ['MERCURY', 'VENUS'], house_in: [7], match_mode: 'any', min_planets: 1 },
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'up',
        intensity: 0.55,
        tone: 'positive',
        trigger: 'natal',
        scenario: 'negotiation_support',
        outcome_text:
          'Conversations about expectations may be easier to navigate. Keeping terms clear and respectful can improve alignment and reduce anxiety.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'background',
          certainty_note: 'This is treated as a communication-support signal that helps with clarity.',
        },
        point_id: pointId,
      },
    },

    // 14) Mixed: support + pressure both active
    {
      code: 'MIXED_SUPPORT_AND_PRESSURE',
      label: 'Mixed signals: supportive potential exists but pressure requires careful pacing.',
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
        scenario: 'mixed_support_pressure',
        outcome_text:
          'Support and pressure may coexist. You can move forward gradually while keeping communication clear and decisions realistic and reversible where possible.',
        variant_meta: {
          tone: 'informational',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'This is framed as balanced guidance under mixed indicators.',
        },
        point_id: pointId,
      },
    },

    // 15) High-benefic environment (background)
    {
      code: 'HIGH_BENEFIC_TIMING_BASELINE',
      label: 'High overall benefic environment supports calmer planning.',
      condition_tree: { overall_benefic_score: { min: 0.7 } },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'up',
        intensity: 0.5,
        tone: 'positive',
        trigger: 'natal',
        scenario: 'benefic_baseline',
        outcome_text:
          'Overall support may feel stronger for planning. You can use this to create clarity and shared alignment without rushing decisions.',
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
      code: 'MARRIAGE_TIMING_INFORMATIONAL_BASELINE',
      label: 'Baseline informational variant for marriage timing context.',
      condition_tree: { generic_condition: { note: 'Marriage timing baseline (background).' } },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.35,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'informational_baseline',
        outcome_text:
          'No single strong timing signal stands out here. Focusing on readiness, communication, and practical alignment can help you choose timing thoughtfully.',
        variant_meta: {
          tone: 'informational',
          confidence_level: 'low',
          dominance: 'background',
          certainty_note: 'Used as a baseline when stronger marriage-timing variants do not match.',
        },
        point_id: pointId,
      },
    },
  ];
}


