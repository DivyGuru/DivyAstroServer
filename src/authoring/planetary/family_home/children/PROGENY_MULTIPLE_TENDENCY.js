export function getPROGENY_MULTIPLE_TENDENCYVariants() {
  const effectTheme = 'family';
  const area = 'family_children';
  const pointId = 'PROGENY_MULTIPLE_TENDENCY';

  const childHouses = [5, 11, 2];
  const supportHouses = [5, 9, 11, 2];
  const stressHouses = [6, 12, 8];

  const benefics = ['JUPITER', 'VENUS', 'MOON'];
  const trade = ['MERCURY'];
  const malefics = ['SATURN', 'MARS', 'RAHU', 'KETU'];

  return [
    // 1) Expanded family responsibility tendency (soft, non-absolute)
    {
      code: 'EXPANSION_TENDENCY_SOFT',
      label: 'Soft tendency toward expanded family responsibilities over time (non-absolute).',
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: [...benefics, ...trade], house_in: supportHouses, match_mode: 'any', min_planets: 2 } },
          { overall_benefic_score: { min: 0.6 } },
          {
            any: [
              { planet_in_nakshatra_group: { planet_in: ['JUPITER', 'VENUS', 'MOON'], group: { context: 'progeny', kind: 'supportive' }, match_mode: 'any', min_planets: 1 } },
              { planet_in_nakshatra_group: { planet_in: ['JUPITER', 'VENUS', 'MOON'], group: { context: 'progeny', kind: 'neutral' }, match_mode: 'any', min_planets: 1 } },
            ],
          },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'up',
        intensity: 0.65,
        tone: 'positive',
        trigger: 'natal',
        scenario: 'expansion_soft',
        outcome_text:
          'A multiple-progeny tendency yog is present. Nakshatra support strengthens this signal. Keeping readiness and stability strong can help outcomes (no guarantees).',
        variant_meta: {
          tone: 'informational',
          confidence_level: 'high',
          dominance: 'dominant',
          certainty_note: 'Expansion indicators are present along with supportive/neutral nakshatra confirmation; no exact count is stated.',
        },
        point_id: pointId,
      },
    },

    // 2) Network/support circle supports family growth (11th)
    {
      code: 'NETWORK_SUPPORT',
      label: 'Network and support circle strengthen the capacity for family responsibilities.',
      condition_tree: {
        planet_in_house: { planet_in: ['JUPITER', 'VENUS', 'MERCURY'], house_in: [11], match_mode: 'any', min_planets: 1 },
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'up',
        intensity: 0.55,
        tone: 'positive',
        trigger: 'natal',
        scenario: 'network_support',
        outcome_text:
          'Support from community or family network may help you manage responsibilities. Clear planning and shared support can reduce pressure.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'This is treated as a supportive factor for capacity and stability.',
        },
        point_id: pointId,
      },
    },

    // 3) Resources and planning support (2nd + Mercury)
    {
      code: 'RESOURCES_AND_PLANNING',
      label: 'Resources and planning support paced expansion.',
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: ['MERCURY'], house_in: [2, 11], match_mode: 'any', min_planets: 1 } },
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
        scenario: 'planning_support',
        outcome_text:
          'Practical planning may support a paced approach. Clear budgeting, shared responsibilities, and realistic timelines can reduce stress.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'background',
          certainty_note: 'This highlights planning as a stabilizer; it does not imply exact outcomes.',
        },
        point_id: pointId,
      },
    },

    // 4) Spacing tendency (soft) due to Saturn influence
    {
      code: 'SPACING_TENDENCY_PACED',
      label: 'Paced spacing tendency: responsibilities may feel more spaced over time.',
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
        intensity: 0.55,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'paced_spacing',
        outcome_text:
          'A paced approach may suit you. Allowing time for stability between responsibilities and focusing on readiness can help reduce pressure.',
        variant_meta: {
          tone: 'informational',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'This is framed as pacing guidance, not as an exact spacing claim.',
        },
        point_id: pointId,
      },
    },

    // 5) Mixed: support + stress together
    {
      code: 'MIXED_SUPPORT_STRESS',
      label: 'Mixed indicators: supportive potential exists, but stress needs management.',
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
        scenario: 'mixed_indicators',
        outcome_text:
          'Support and stress may coexist. A stepwise approach, stable routines, and shared support can help you stay grounded.',
        variant_meta: {
          tone: 'informational',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'This is balanced guidance under mixed conditions.',
        },
        point_id: pointId,
      },
    },

    // 6) Short-term supportive window (transit)
    {
      code: 'TRANSIT_SUPPORT_WINDOW',
      label: 'Short-term supportive window for planning and coordination.',
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
        trend: 'up',
        intensity: 0.45,
        tone: 'positive',
        trigger: 'transit',
        scenario: 'short_term_support',
        outcome_text:
          'A short-term supportive window may help with planning. Calm conversations and stepwise decisions can reduce stress.',
        variant_meta: {
          tone: 'opportunity',
          confidence_level: 'low',
          dominance: 'background',
          certainty_note: 'This is time-bound support and is treated as background guidance.',
        },
        point_id: pointId,
      },
    },

    // 7) Short-term sensitivity window (transit malefics)
    {
      code: 'TRANSIT_SENSITIVITY',
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
        intensity: 0.45,
        tone: 'challenging',
        trigger: 'transit',
        scenario: 'short_term_sensitivity',
        outcome_text:
          'This may be a more sensitive short-term window. Slower planning and extra patience can reduce avoidable stress.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'low',
          dominance: 'background',
          certainty_note: 'Time-bound caution is treated as background guidance.',
        },
        point_id: pointId,
      },
    },

    // 8) Single-progeny tendency yog (soft, paced; no exact timing)
    {
      code: 'EK_SANTAN_YOG_PACED',
      label: 'Single-progeny tendency yog (paced): stability-first and readiness-focused pattern.',
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: [...benefics, ...trade], house_in: [5, 2, 4], match_mode: 'any', min_planets: 1 } },
          { planet_in_house: { planet_in: ['SATURN'], house_in: [5], match_mode: 'any', min_planets: 1 } },
          {
            any: [
              { planet_in_nakshatra_group: { planet_in: ['JUPITER', 'VENUS', 'MOON'], group: { context: 'progeny', kind: 'supportive' }, match_mode: 'any', min_planets: 1 } },
              { planet_in_nakshatra_group: { planet_in: ['JUPITER', 'VENUS', 'MOON'], group: { context: 'progeny', kind: 'neutral' }, match_mode: 'any', min_planets: 1 } },
            ],
          },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.6,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'ek_santan_paced',
        outcome_text:
          'A single-progeny tendency yog is present. Nakshatra support strengthens this signal, but activation can be paced—when timing becomes supportive, this yog can activate more cleanly (no guarantees).',
        variant_meta: {
          tone: 'informational',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'A pacing/spacing indicator (Saturn on the 5th) is present along with supportive/neutral nakshatra confirmation; no exact number beyond 1 is stated.',
        },
        point_id: pointId,
      },
    },

    // 9) High pressure reduces capacity (dominant)
    {
      code: 'HIGH_PRESSURE_REDUCES_CAPACITY',
      label: 'High pressure reduces capacity; pacing and support are important.',
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
        intensity: 0.65,
        tone: 'challenging',
        trigger: 'natal',
        scenario: 'high_pressure',
        outcome_text:
          'When pressure is high, a slower approach may protect well-being. Prioritizing stability and shared support can reduce avoidable stress.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'high',
          dominance: 'dominant',
          certainty_note: 'Strong pressure indicators are present; guidance focuses on pacing and emotional safety.',
        },
        point_id: pointId,
      },
    },

    // 10) Gentle expansion via nurturing emphasis (Moon/Venus in 4/5)
    {
      code: 'NURTURING_EXPANSION_SOFT',
      label: 'Nurturing emphasis supports gentle expansion of responsibilities.',
      condition_tree: {
        planet_in_house: { planet_in: ['MOON', 'VENUS'], house_in: [4, 5], match_mode: 'any', min_planets: 1 },
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'up',
        intensity: 0.5,
        tone: 'positive',
        trigger: 'natal',
        scenario: 'nurturing_support',
        outcome_text:
          'Nurturing and emotional stability may support gradual expansion of responsibilities. Keeping routines steady can build confidence over time.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'background',
          certainty_note: 'This is treated as supportive for readiness and emotional grounding.',
        },
        point_id: pointId,
      },
    },

    // 11) Uncertainty about expansion (Rahu/Ketu)
    {
      code: 'UNCERTAINTY_ABOUT_EXPANSION',
      label: 'Uncertainty about expansion: mixed signals require clarity.',
      condition_tree: {
        planet_in_house: { planet_in: ['RAHU', 'KETU'], house_in: [5, 8, 12], match_mode: 'any', min_planets: 1 },
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.55,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'uncertainty',
        outcome_text:
          'Uncertainty may be stronger at times. Clarifying expectations and staying patient with stepwise planning can reduce pressure.',
        variant_meta: {
          tone: 'informational',
          confidence_level: 'medium',
          dominance: 'background',
          certainty_note: 'This is an information-clarity signal; it is not a final claim.',
        },
        point_id: pointId,
      },
    },

    // 12) Recovery with structure (Saturn + benefic balance)
    {
      code: 'RECOVERY_WITH_STRUCTURE',
      label: 'Recovery with structure: capacity improves gradually through stability.',
      scopes: ['monthly', 'yearly'],
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: ['SATURN'], house_in: [4, 6], match_mode: 'any', min_planets: 1 } },
          { overall_benefic_score: { min: 0.6 } },
          { overall_malefic_score: { min: 0.5 } },
          { overall_malefic_score: { max: 0.75 } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.5,
        tone: 'cautious',
        trigger: 'natal',
        scenario: 'recovery_structure',
        outcome_text:
          'Capacity may improve through structure and steady routines. A paced approach and shared support can reduce stress over time.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'This is framed as gradual improvement support through structure, not certainty.',
        },
        point_id: pointId,
      },
    },

    // 13) Dasha supportive phase (long-term)
    {
      code: 'DASHA_SUPPORT_PHASE',
      label: 'Long-term supportive phase for readiness and planning.',
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
        trend: 'up',
        intensity: 0.45,
        tone: 'positive',
        trigger: 'dasha',
        scenario: 'long_term_support',
        outcome_text:
          'A longer supportive phase may help readiness feel steadier. Calm planning and stable routines can support gradual progress.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'background',
          certainty_note: 'This is framed as longer-term support without absolute claims.',
        },
        point_id: pointId,
      },
    },

    // 14) Informational baseline
    {
      code: 'PROGENY_MULTIPLE_INFORMATIONAL_BASELINE',
      label: 'Baseline informational variant for multiple tendency context.',
      condition_tree: { generic_condition: { note: 'Progeny multiple tendency baseline (background).' } },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.35,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'informational_baseline',
        outcome_text:
          'No single strong signal stands out here. Focusing on readiness, stability, and calm planning can help you navigate family responsibilities thoughtfully over time.',
        variant_meta: {
          tone: 'informational',
          confidence_level: 'low',
          dominance: 'background',
          certainty_note: 'Used as a baseline when stronger multiple-tendency variants do not match.',
        },
        point_id: pointId,
      },
    },
  ];
}


