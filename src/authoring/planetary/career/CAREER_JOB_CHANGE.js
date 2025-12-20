export function getCAREER_JOB_CHANGEVariants() {
  const effectTheme = 'career';
  const area = 'career_job_change';
  const pointId = 'CAREER_JOB_CHANGE';

  const careerHouses = [10, 6, 1, 11];
  const changeHouses = [10, 6, 12, 1];
  const benefics = ['JUPITER', 'VENUS'];
  const trade = ['MERCURY'];
  const malefics = ['SATURN', 'MARS', 'RAHU', 'KETU'];

  // Planet ids: Sun=1, Moon=2, Mars=3, Mercury=4, Jupiter=5, Venus=6, Saturn=7, Rahu=8, Ketu=9
  const DASHAA_CHANGE_SUPPORT_IDS = [5, 6, 4, 1];
  const DASHAA_CHANGE_CAUTION_IDS = [7, 3, 8, 9];

  return [
    // 1) Good timing for job change (benefic support)
    {
      code: 'JOB_CHANGE_GOOD_TIMING',
      label: 'Good timing for job change: benefic support indicates favorable transition.',
      condition_tree: {
        all: [
          {
            planet_in_house: {
              planet_in: [...benefics, ...trade],
              house_in: [10, 6, 11],
              match_mode: 'any',
              min_planets: 1,
            },
          },
          { overall_benefic_score: { min: 0.6 } },
          // 10th lord activation (role shift marker)
          { house_lord_in_house: { house: 10, lord_house_in: [10, 11, 12, 1] } },
          // Nakshatra confirmation (career context)
          {
            any: [
              { planet_in_nakshatra_group: { planet_in: ['JUPITER', 'VENUS', 'MERCURY', 'SATURN'], group: { context: 'career', kind: 'supportive' }, match_mode: 'any', min_planets: 1 } },
              { planet_in_nakshatra_group: { planet_in: ['JUPITER', 'VENUS', 'MERCURY', 'SATURN'], group: { context: 'career', kind: 'neutral' }, match_mode: 'any', min_planets: 1 } },
            ],
          },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'up',
        intensity: 0.75,
        tone: 'positive',
        trigger: 'natal',
        scenario: 'good_timing',
        outcome_text:
          'A career change/role-shift yog is present. Nakshatra support strengthens this phase. Plan the shift stepwise—resume/networking, interviews, and a clean transition timeline.',
        variant_meta: {
          tone: 'opportunity',
          confidence_level: 'high',
          dominance: 'dominant',
          certainty_note: 'Career-change supportive signals and 10th-lord activation are present along with nakshatra confirmation.',
        },
        point_id: pointId,
      },
    },

    // 2) Initiative and readiness (1st + 10th)
    {
      code: 'JOB_CHANGE_READINESS',
      label: 'Initiative and readiness support job change decisions.',
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: ['SUN', 'MERCURY'], house_in: [1, 10], match_mode: 'any', min_planets: 1 } },
          { overall_benefic_score: { min: 0.55 } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'up',
        intensity: 0.7,
        tone: 'positive',
        trigger: 'natal',
        scenario: 'readiness',
        outcome_text:
          'You may feel more ready to make job changes. Keeping the transition plan clear, researching opportunities thoroughly, and maintaining professional relationships can help.',
        variant_meta: {
          tone: 'opportunity',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'Signals support initiative and readiness; still best approached with clear planning.',
        },
        point_id: pointId,
      },
    },

    // 3) Network support for change (11th house)
    {
      code: 'JOB_CHANGE_NETWORK_SUPPORT',
      label: 'Professional network supports job change opportunities.',
      condition_tree: {
        planet_in_house: {
          planet_in: ['JUPITER', 'VENUS', 'MERCURY'],
          house_in: [11],
          match_mode: 'any',
          min_planets: 1,
        },
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'up',
        intensity: 0.65,
        tone: 'positive',
        trigger: 'natal',
        scenario: 'network_support',
        outcome_text:
          'Professional networks may support job change opportunities. Leveraging connections, staying visible, and offering value to others can open doors for transitions.',
        variant_meta: {
          tone: 'opportunity',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'Signals emphasize networking as a useful channel for job changes.',
        },
        point_id: pointId,
      },
    },

    // 4) Transit: change window
    {
      code: 'TRANSIT_JOB_CHANGE_WINDOW',
      label: 'Short-term job change window from supportive transits.',
      scopes: ['daily', 'weekly'],
      condition_tree: {
        transit_planet_in_house: {
          planet_in: ['JUPITER', 'VENUS', 'MERCURY'],
          house_in: [10, 6, 11],
          match_mode: 'any',
          min_planets: 1,
        },
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'up',
        intensity: 0.6,
        tone: 'positive',
        trigger: 'transit',
        scenario: 'change_window',
        outcome_text:
          'A short-term change window may be available. You can use it for networking, interviews, and making transitions with careful planning rather than rushing decisions.',
        variant_meta: {
          tone: 'opportunity',
          confidence_level: 'low',
          dominance: 'background',
          certainty_note: 'This is time-bound and treated lightly; stepwise action is preferred.',
        },
        point_id: pointId,
      },
    },

    // 5) Dasha: supportive change phase
    {
      code: 'DASHA_JOB_CHANGE_SUPPORT',
      label: 'Longer-term supportive phase for job changes.',
      scopes: ['monthly', 'yearly', 'life_theme'],
      condition_tree: {
        any: [
          { dasha_running: { level: 'mahadasha', planet_in: DASHAA_CHANGE_SUPPORT_IDS } },
          { dasha_running: { level: 'antardasha', planet_in: DASHAA_CHANGE_SUPPORT_IDS } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'up',
        intensity: 0.7,
        tone: 'positive',
        trigger: 'dasha',
        scenario: 'supportive_change_phase',
        outcome_text:
          'A longer supportive phase may allow smoother job changes. Consider building skills, maintaining networks, and making transitions with clear goals and realistic timelines.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'background',
          certainty_note: 'This is framed as longer-term support, guiding planning and pacing.',
        },
        point_id: pointId,
      },
    },

    // 6) Avoid job change (malefic pressure)
    {
      code: 'JOB_CHANGE_AVOID_TIMING',
      label: 'Avoid job change: malefic pressure suggests unfavorable timing.',
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: malefics, house_in: [10, 6, 12], match_mode: 'any', min_planets: 1 } },
          { overall_malefic_score: { min: 0.65 } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'down',
        intensity: 0.75,
        tone: 'challenging',
        trigger: 'natal',
        scenario: 'avoid_timing',
        outcome_text:
          'This may not be the best time for job changes. Consider delaying major transitions, maintaining current stability, and focusing on skill development until conditions improve.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'high',
          dominance: 'dominant',
          certainty_note: 'Risk indicators are stronger here, so conservative approach is emphasized.',
        },
        point_id: pointId,
      },
    },

    // 7) Sudden change risk (Rahu/Ketu)
    {
      code: 'SUDDEN_JOB_CHANGE_RISK',
      label: 'Sudden job change risk: unexpected transitions may occur.',
      condition_tree: {
        planet_in_house: {
          planet_in: ['RAHU', 'KETU'],
          house_in: [10, 6, 12],
          match_mode: 'any',
          min_planets: 1,
        },
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.8,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'sudden_change_risk',
        outcome_text:
          'Unexpected job changes may occur. Staying adaptable, keeping skills updated, and maintaining professional networks can help you navigate transitions effectively.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'This is a volatility-style signal, treated as risk-management guidance.',
        },
        point_id: pointId,
      },
    },

    // 8) Transit: change caution
    {
      code: 'TRANSIT_JOB_CHANGE_CAUTION',
      label: 'Short-term caution: delay major job change decisions.',
      scopes: ['daily', 'weekly'],
      condition_tree: {
        transit_planet_in_house: {
          planet_in: ['SATURN', 'MARS', 'RAHU', 'KETU'],
          house_in: [10, 6, 12],
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
        scenario: 'change_caution',
        outcome_text:
          'In the short term, you may benefit from extra checks and slower decisions regarding job changes. Consider using this time for research and planning.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'low',
          dominance: 'background',
          certainty_note: 'Time-bound caution is treated as background guidance to reduce avoidable mistakes.',
        },
        point_id: pointId,
      },
    },

    // 9) Dasha: caution phase
    {
      code: 'DASHA_JOB_CHANGE_CAUTION',
      label: 'Longer-term caution: delay major job changes.',
      scopes: ['monthly', 'yearly', 'life_theme'],
      condition_tree: {
        any: [
          { dasha_running: { level: 'mahadasha', planet_in: DASHAA_CHANGE_CAUTION_IDS } },
          { dasha_running: { level: 'antardasha', planet_in: DASHAA_CHANGE_CAUTION_IDS } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'down',
        intensity: 0.65,
        tone: 'challenging',
        trigger: 'dasha',
        scenario: 'caution_phase',
        outcome_text:
          'A longer caution phase may suggest delaying major job changes. Consider maintaining current stability, building skills, and waiting for more favorable conditions.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'This is used as pacing guidance for longer phases; it does not forbid changes.',
        },
        point_id: pointId,
      },
    },

    // 10) Mixed signals (proceed with caution)
    {
      code: 'JOB_CHANGE_MIXED_SIGNALS',
      label: 'Mixed signals: proceed with job change but exercise caution.',
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
        intensity: 0.65,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'mixed_signals',
        outcome_text:
          'Support and risk may be present together for job changes. You can proceed, but it may help to research thoroughly, avoid rushed decisions, and keep options open.',
        variant_meta: {
          tone: 'informational',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'Mixed indicators favor a "careful exploration" approach.',
        },
        point_id: pointId,
      },
    },

    // 11) Forced change (circumstances)
    {
      code: 'JOB_CHANGE_FORCED',
      label: 'Forced job change: circumstances may require transition.',
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: ['SATURN', 'RAHU', 'KETU'], house_in: [10, 6, 12], match_mode: 'any', min_planets: 1 } },
          { overall_malefic_score: { min: 0.6 } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'down',
        intensity: 0.75,
        tone: 'challenging',
        trigger: 'natal',
        scenario: 'forced_change',
        outcome_text:
          'Circumstances may require job changes. Staying adaptable, leveraging networks, and focusing on transferable skills can help you navigate forced transitions effectively.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'This is treated as a transition-management signal rather than a definitive negative outcome.',
        },
        point_id: pointId,
      },
    },

    // 12) Skill-based transition (5th + 10th)
    {
      code: 'JOB_CHANGE_SKILL_BASED',
      label: 'Job change supported through skill development and expertise.',
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: ['MERCURY', 'JUPITER'], house_in: [5, 10], match_mode: 'any', min_planets: 1 } },
          { overall_benefic_score: { min: 0.6 } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'up',
        intensity: 0.7,
        tone: 'positive',
        trigger: 'natal',
        scenario: 'skill_based_transition',
        outcome_text:
          'Skill development may support job changes. Investing in learning, demonstrating expertise, and positioning yourself as a valuable candidate can strengthen transition prospects.',
        variant_meta: {
          tone: 'opportunity',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'Signals emphasize skill-building as a transition lever.',
        },
        point_id: pointId,
      },
    },

    // 13) Career pivot opportunity (9th + 10th)
    {
      code: 'JOB_CHANGE_PIVOT_OPPORTUNITY',
      label: 'Career pivot opportunity: favorable timing for field changes.',
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: ['JUPITER'], house_in: [9, 10], match_mode: 'any', min_planets: 1 } },
          { overall_benefic_score: { min: 0.6 } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'up',
        intensity: 0.7,
        tone: 'positive',
        trigger: 'natal',
        scenario: 'pivot_opportunity',
        outcome_text:
          'A career pivot may be possible. Researching new fields, building relevant skills, and leveraging transferable experience can support successful transitions.',
        variant_meta: {
          tone: 'opportunity',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'Signals suggest favorable conditions for career direction changes.',
        },
        point_id: pointId,
      },
    },

    // 14) Stability before change (2nd + 10th)
    {
      code: 'JOB_CHANGE_STABILITY_FIRST',
      label: 'Build stability before making job changes.',
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: ['SATURN'], house_in: [2, 10], match_mode: 'any', min_planets: 1 } },
          { overall_benefic_score: { min: 0.55 } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.6,
        tone: 'cautious',
        trigger: 'natal',
        scenario: 'stability_first',
        outcome_text:
          'Building stability before job changes may be beneficial. Strengthening your current position, saving resources, and planning carefully can support smoother transitions.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'background',
          certainty_note: 'This is framed as a preparation strategy for job changes.',
        },
        point_id: pointId,
      },
    },

    // 15) Informational baseline
    {
      code: 'JOB_CHANGE_INFORMATIONAL_BASELINE',
      label: 'Baseline informational variant for job change context.',
      condition_tree: { generic_condition: { note: 'Job change baseline (background).' } },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.35,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'informational_baseline',
        outcome_text:
          'No single strong job change signal stands out here. Researching opportunities, building skills, and maintaining professional networks may be sufficient for now.',
        variant_meta: {
          tone: 'informational',
          confidence_level: 'low',
          dominance: 'background',
          certainty_note: 'Used as a baseline when stronger job change variants do not match.',
        },
        point_id: pointId,
      },
    },
  ];
}

