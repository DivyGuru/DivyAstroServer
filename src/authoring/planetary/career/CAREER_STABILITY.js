export function getCAREER_STABILITYVariants() {
  const effectTheme = 'career';
  const area = 'career_stability';
  const pointId = 'CAREER_STABILITY';

  const careerHouses = [10, 6, 1, 11];
  const stabilityHouses = [10, 6, 2];
  const benefics = ['JUPITER', 'VENUS'];
  const trade = ['MERCURY'];
  const malefics = ['SATURN', 'MARS', 'RAHU', 'KETU'];

  return [
    // 1) Strong stability (10th + 6th support)
    {
      code: 'NATAL_STRONG_STABILITY',
      label: 'Strong career stability via benefics in career and work houses.',
      condition_tree: {
        all: [
          {
            planet_in_house: {
              planet_in: [...benefics, ...trade],
              house_in: [10, 6],
              match_mode: 'any',
              min_planets: 2,
            },
          },
          // 10th house lord activation (career signal)
          { house_lord_in_house: { house: 10, lord_house_in: [10, 11, 1, 6] } },
          // Nakshatra confirmation (career context)
          {
            any: [
              { planet_in_nakshatra_group: { planet_in: ['SATURN', 'JUPITER', 'MERCURY'], group: { context: 'career', kind: 'supportive' }, match_mode: 'any', min_planets: 1 } },
              { planet_in_nakshatra_group: { planet_in: ['SATURN', 'JUPITER', 'MERCURY'], group: { context: 'career', kind: 'neutral' }, match_mode: 'any', min_planets: 1 } },
            ],
          },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'up',
        intensity: 0.8,
        tone: 'positive',
        trigger: 'natal',
        scenario: 'strong_stability',
        outcome_text:
          'A career stability yog is present. Nakshatra support strengthens this signal. In this phase, focusing on process discipline, consistent output, and stakeholder trust may work best.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'high',
          dominance: 'dominant',
          certainty_note: '10th-lord activation and supportive career signals are present, along with nakshatra confirmation.',
        },
        point_id: pointId,
      },
    },

    // 2) Saturn stability (structured security)
    {
      code: 'NATAL_SATURN_STABILITY',
      label: 'Structured stability through discipline and responsibility.',
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: ['SATURN'], house_in: [10, 6], match_mode: 'any', min_planets: 1 } },
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
        scenario: 'structured_stability',
        outcome_text:
          'Stability may come through structure and discipline. Following processes, meeting commitments, and maintaining professional standards can strengthen your position.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'Signals emphasize structure and responsibility as stability foundations.',
        },
        point_id: pointId,
      },
    },

    // 3) Transit: short-term stability boost
    {
      code: 'TRANSIT_STABILITY_BOOST',
      label: 'Short-term stability boost from supportive transits.',
      scopes: ['hourly', 'daily', 'weekly'],
      condition_tree: {
        transit_planet_in_house: {
          planet_in: ['JUPITER', 'VENUS'],
          house_in: [10, 6],
          match_mode: 'any',
          min_planets: 1,
        },
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'up',
        intensity: 0.55,
        tone: 'positive',
        trigger: 'transit',
        scenario: 'short_term_boost',
        outcome_text:
          'A short-term stability window may be available. You can use it to reinforce relationships, complete pending work, and strengthen your professional standing.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'low',
          dominance: 'background',
          certainty_note: 'This is time-bound and treated as background unless reinforced by other signals.',
        },
        point_id: pointId,
      },
    },

    // 4) Dasha: long-term stability support
    {
      code: 'DASHA_STABILITY_SUPPORT',
      label: 'Long-term stability support during benefic dasha phases.',
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
        intensity: 0.7,
        tone: 'positive',
        trigger: 'dasha',
        scenario: 'long_term_stability',
        outcome_text:
          'A longer-term stable phase may be building. Consistent performance, skill development, and maintaining professional relationships can compound stability over time.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'background',
          certainty_note: 'This is framed as longer-term stability, informing career planning.',
        },
        point_id: pointId,
      },
    },

    // 5) Instability risk (malefics in career houses)
    {
      code: 'NATAL_INSTABILITY_RISK',
      label: 'Career instability risk from malefics in key houses.',
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: malefics, house_in: [10, 6], match_mode: 'any', min_planets: 1 } },
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
        scenario: 'instability_risk',
        outcome_text:
          'Career stability may feel uncertain. Strengthening skills, maintaining professional networks, and keeping options open can help you navigate potential changes.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'high',
          dominance: 'dominant',
          certainty_note: 'Multiple instability indicators are present; proactive preparation is emphasized.',
        },
        point_id: pointId,
      },
    },

    // 6) Sudden instability (Rahu/Ketu)
    {
      code: 'SUDDEN_INSTABILITY',
      label: 'Sudden career instability or unexpected changes.',
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
        trend: 'down',
        intensity: 0.8,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'sudden_instability',
        outcome_text:
          'Unexpected changes may affect career stability. Staying adaptable, keeping skills updated, and maintaining professional connections can help you manage transitions.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'This is a volatility-style signal, treated as a risk-management note.',
        },
        point_id: pointId,
      },
    },

    // 7) Transit: instability window
    {
      code: 'TRANSIT_INSTABILITY_WINDOW',
      label: 'Short-term instability risk from malefic transits.',
      scopes: ['hourly', 'daily', 'weekly'],
      condition_tree: {
        all: [
          {
            transit_planet_in_house: {
              planet_in: ['SATURN', 'MARS', 'RAHU', 'KETU'],
              house_in: [10, 6],
              match_mode: 'any',
              min_planets: 1,
            },
          },
          { overall_malefic_score: { min: 0.55 } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'down',
        intensity: 0.6,
        tone: 'challenging',
        trigger: 'transit',
        scenario: 'short_term_instability',
        outcome_text:
          'Short-term stability may feel uncertain. Consider avoiding major commitments, keeping communications clear, and focusing on essential work.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'low',
          dominance: 'background',
          certainty_note: 'Time-bound instability signal, treated as background guidance.',
        },
        point_id: pointId,
      },
    },

    // 8) Mixed stability (support with risk)
    {
      code: 'MIXED_STABILITY_SIGNALS',
      label: 'Mixed stability signals: support exists but risks are present.',
      condition_tree: {
        all: [
          {
            planet_in_house: {
              planet_in: [...benefics, ...trade],
              house_in: stabilityHouses,
              match_mode: 'any',
              min_planets: 1,
            },
          },
          {
            planet_in_house: {
              planet_in: malefics,
              house_in: stabilityHouses,
              match_mode: 'any',
              min_planets: 1,
            },
          },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.65,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'mixed_stability',
        outcome_text:
          'Stability signals are mixed. You can maintain your position, but it may help to stay flexible, keep skills updated, and avoid unnecessary risks.',
        variant_meta: {
          tone: 'informational',
          confidence_level: 'medium',
          dominance: 'dominant',
          certainty_note: 'Both supportive and challenging indicators appear together, so a balanced approach is recommended.',
        },
        point_id: pointId,
      },
    },

    // 9) Dasha: instability phase
    {
      code: 'DASHA_INSTABILITY_PHASE',
      label: 'Longer-term instability phase during malefic dasha.',
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
        intensity: 0.7,
        tone: 'challenging',
        trigger: 'dasha',
        scenario: 'instability_phase',
        outcome_text:
          'A longer instability phase may be active. You may benefit from maintaining flexibility, building skills, and keeping professional options open.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'This guides longer-term career strategy during instability patterns.',
        },
        point_id: pointId,
      },
    },

    // 10) Job security through performance (6th house)
    {
      code: 'NATAL_PERFORMANCE_SECURITY',
      label: 'Job security strengthened through consistent performance.',
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: ['MERCURY', 'SUN'], house_in: [6, 10], match_mode: 'any', min_planets: 1 } },
          { overall_benefic_score: { min: 0.6 } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'up',
        intensity: 0.65,
        tone: 'positive',
        trigger: 'natal',
        scenario: 'performance_security',
        outcome_text:
          'Job security may strengthen through consistent performance. Delivering quality work, meeting deadlines, and maintaining professional standards can reinforce your position.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'Signals emphasize performance and reliability as security foundations.',
        },
        point_id: pointId,
      },
    },

    // 11) Income stability (2nd house support)
    {
      code: 'NATAL_INCOME_STABILITY',
      label: 'Income stability supports overall career security.',
      condition_tree: {
        planet_in_house: {
          planet_in: ['JUPITER', 'VENUS'],
          house_in: [2, 11],
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
        trigger: 'natal',
        scenario: 'income_stability',
        outcome_text:
          'Income stability may support your career security. Managing finances well, maintaining savings, and avoiding unnecessary expenses can strengthen your professional foundation.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'Financial stability is treated as a supporting factor for career security.',
        },
        point_id: pointId,
      },
    },

    // 12) Recovery from instability
    {
      code: 'RECOVERY_STABILITY',
      label: 'Recovery from instability through structure and discipline.',
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: ['SATURN'], house_in: [10, 6], match_mode: 'any', min_planets: 1 } },
          { overall_benefic_score: { min: 0.6 } },
          { overall_malefic_score: { max: 0.7 } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.6,
        tone: 'cautious',
        trigger: 'natal',
        scenario: 'recovery_stability',
        outcome_text:
          'Stability may improve through structure and discipline. Focusing on consistent performance, maintaining professional relationships, and avoiding unnecessary risks can help rebuild security.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'This is treated as a recovery pattern—gradual improvement through structure.',
        },
        point_id: pointId,
      },
    },

    // 13) High malefic score: instability pressure
    {
      code: 'HIGH_MALEFIC_INSTABILITY',
      label: 'High malefic score indicates significant instability pressure.',
      condition_tree: {
        all: [
          { overall_malefic_score: { min: 0.75 } },
          { planet_in_house: { planet_in: malefics, house_in: [10, 6], match_mode: 'any', min_planets: 1 } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'down',
        intensity: 0.85,
        tone: 'challenging',
        trigger: 'natal',
        scenario: 'high_instability',
        outcome_text:
          'Significant instability pressure may be present. Strengthening skills, maintaining professional networks, and keeping options open can help you navigate this phase.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'high',
          dominance: 'dominant',
          certainty_note: 'Strong instability indicators are combined here, so proactive preparation is emphasized.',
        },
        point_id: pointId,
      },
    },

    // 14) Work environment stability (6th house focus)
    {
      code: 'NATAL_WORK_ENVIRONMENT',
      label: 'Work environment stability affects overall career security.',
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: ['VENUS', 'MERCURY'], house_in: [6], match_mode: 'any', min_planets: 1 } },
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
        scenario: 'work_environment',
        outcome_text:
          'Work environment may feel more stable. Building positive relationships with colleagues, maintaining professional boundaries, and contributing to team success can reinforce this stability.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'background',
          certainty_note: 'Work environment signals are treated as supporting factors.',
        },
        point_id: pointId,
      },
    },

    // 15) Informational baseline
    {
      code: 'STABILITY_INFORMATIONAL_BASELINE',
      label: 'Baseline informational variant for career stability context.',
      condition_tree: { generic_condition: { note: 'Stability baseline (background).' } },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.35,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'informational_baseline',
        outcome_text:
          'No single strong stability signal stands out here. Maintaining consistent performance and professional relationships may be sufficient for now.',
        variant_meta: {
          tone: 'informational',
          confidence_level: 'low',
          dominance: 'background',
          certainty_note: 'Used as a baseline when stronger stability variants do not match.',
        },
        point_id: pointId,
      },
    },
  ];
}

