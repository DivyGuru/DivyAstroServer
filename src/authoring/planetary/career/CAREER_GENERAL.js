export function getCAREER_GENERALVariants() {
  const effectTheme = 'career';
  const area = 'career_general';
  const pointId = 'CAREER_GENERAL';

  const careerHouses = [10, 6, 1, 11];
  const benefics = ['JUPITER', 'VENUS'];
  const trade = ['MERCURY'];
  const malefics = ['SATURN', 'MARS', 'RAHU', 'KETU'];

  return [
    // 1) Natal career support (10th house activation)
    {
      code: 'NATAL_CAREER_SUPPORT',
      label: 'Strong career support via benefics in career houses (natal).',
      condition_tree: {
        planet_in_house: {
          planet_in: [...benefics, ...trade],
          house_in: [10, 6, 11],
          match_mode: 'any',
          min_planets: 2,
        },
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'up',
        intensity: 0.75,
        tone: 'positive',
        trigger: 'natal',
        scenario: 'career_support',
        outcome_text:
          'Career conditions look supportive overall. You may benefit from focusing on consistent performance, building skills, and maintaining professional relationships.',
        variant_meta: {
          tone: 'opportunity',
          confidence_level: 'high',
          dominance: 'dominant',
          certainty_note: 'Multiple supportive career signals are present, indicating a generally favorable professional phase.',
        },
        point_id: pointId,
      },
    },

    // 2) Authority and recognition (10th house emphasis)
    {
      code: 'NATAL_AUTHORITY_RECOGNITION',
      label: 'Authority and recognition support career advancement.',
      condition_tree: {
        planet_in_house: {
          planet_in: ['SUN', 'JUPITER'],
          house_in: [10],
          match_mode: 'any',
          min_planets: 1,
        },
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'up',
        intensity: 0.8,
        tone: 'positive',
        trigger: 'natal',
        scenario: 'authority_recognition',
        outcome_text:
          'Visibility and recognition may improve. Keeping communication clear, delivering on commitments, and maintaining professional boundaries can enhance your standing.',
        variant_meta: {
          tone: 'opportunity',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'Signals suggest increased visibility and authority potential; results depend on consistent performance.',
        },
        point_id: pointId,
      },
    },

    // 3) Work efficiency and service (6th house)
    {
      code: 'NATAL_WORK_EFFICIENCY',
      label: 'Work efficiency and service quality support career stability.',
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: ['MERCURY'], house_in: [6, 10], match_mode: 'any', min_planets: 1 } },
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
        scenario: 'work_efficiency',
        outcome_text:
          'Work efficiency and attention to detail may serve you well. Streamlining processes, improving systems, and maintaining quality standards can strengthen your position.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'Signals emphasize operational excellence as a career lever.',
        },
        point_id: pointId,
      },
    },

    // 4) Transit: short-term career boost
    {
      code: 'TRANSIT_CAREER_BOOST',
      label: 'Short-term career boost from supportive transits.',
      scopes: ['hourly', 'daily', 'weekly'],
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
        scenario: 'short_term_boost',
        outcome_text:
          'A short-term supportive window may be available. You can use it for important conversations, completing pending tasks, and reinforcing positive relationships.',
        variant_meta: {
          tone: 'opportunity',
          confidence_level: 'low',
          dominance: 'background',
          certainty_note: 'This is a time-bound supportive signal, treated as background unless reinforced by stronger indicators.',
        },
        point_id: pointId,
      },
    },

    // 5) Dasha: long-term career support
    {
      code: 'DASHA_CAREER_SUPPORT',
      label: 'Long-term career support during benefic dasha phases.',
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
        scenario: 'long_term_support',
        outcome_text:
          'A longer-term supportive career phase may be building. Steady skill development, consistent performance, and strategic planning can compound results over time.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'background',
          certainty_note: 'This is framed as longer-term support, informing career strategy more than day-to-day decisions.',
        },
        point_id: pointId,
      },
    },

    // 6) Delay and obstacles (Saturn pressure)
    {
      code: 'NATAL_CAREER_DELAY',
      label: 'Career delays and obstacles require patience and structure.',
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: ['SATURN'], house_in: [10, 6], match_mode: 'any', min_planets: 1 } },
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
        scenario: 'delay_obstacles',
        outcome_text:
          'Progress may feel slower than expected. Maintaining structure, meeting deadlines, and focusing on long-term goals can help you navigate delays effectively.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'Signals indicate a "slow build" pattern; disciplined execution is emphasized.',
        },
        point_id: pointId,
      },
    },

    // 7) Conflict and politics (Mars in career houses)
    {
      code: 'NATAL_WORKPLACE_CONFLICT',
      label: 'Workplace conflict and political tension may arise.',
      condition_tree: {
        planet_in_house: { planet_in: ['MARS'], house_in: [10, 6, 7], match_mode: 'any', min_planets: 1 },
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'down',
        intensity: 0.7,
        tone: 'challenging',
        trigger: 'natal',
        scenario: 'conflict_politics',
        outcome_text:
          'Workplace tension may increase. Keeping discussions factual, avoiding gossip, and maintaining professional boundaries can help you stay focused on your work.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'This is treated as a risk-management signal rather than a definitive negative outcome.',
        },
        point_id: pointId,
      },
    },

    // 8) Sudden changes (Rahu/Ketu)
    {
      code: 'SUDDEN_CAREER_CHANGES',
      label: 'Unexpected career changes or shifts may occur.',
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
        intensity: 0.75,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'sudden_changes',
        outcome_text:
          'Unexpected changes may appear in your career. Staying adaptable, keeping skills updated, and maintaining professional networks can help you navigate transitions.',
        variant_meta: {
          tone: 'informational',
          confidence_level: 'medium',
          dominance: 'background',
          certainty_note: 'This is a volatility-style signal, kept secondary unless reinforced by other indicators.',
        },
        point_id: pointId,
      },
    },

    // 9) Mixed signals (support with challenges)
    {
      code: 'MIXED_CAREER_SIGNALS',
      label: 'Mixed career signals: support exists but challenges are present.',
      condition_tree: {
        all: [
          {
            planet_in_house: {
              planet_in: [...benefics, ...trade],
              house_in: careerHouses,
              match_mode: 'any',
              min_planets: 1,
            },
          },
          {
            planet_in_house: {
              planet_in: malefics,
              house_in: careerHouses,
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
        scenario: 'mixed_signals',
        outcome_text:
          'Support and challenges may coexist in your career. You can move forward, but it may help to stay flexible, manage expectations, and focus on what you can control.',
        variant_meta: {
          tone: 'informational',
          confidence_level: 'medium',
          dominance: 'dominant',
          certainty_note: 'Both supportive and challenging indicators appear together, so a balanced approach is recommended.',
        },
        point_id: pointId,
      },
    },

    // 10) Transit: caution period
    {
      code: 'TRANSIT_CAREER_CAUTION',
      label: 'Short-term caution when malefics transit career houses.',
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
          { overall_malefic_score: { min: 0.5 } },
        ],
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
          'Short-term caution is advised. Consider double-checking important communications, avoiding rushed decisions, and keeping professional interactions clear and documented.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'low',
          dominance: 'background',
          certainty_note: 'Time-bound caution is treated as background guidance to reduce avoidable mistakes.',
        },
        point_id: pointId,
      },
    },

    // 11) Skill development focus (5th + 10th)
    {
      code: 'NATAL_SKILL_DEVELOPMENT',
      label: 'Skill development and learning support career growth.',
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
        scenario: 'skill_development',
        outcome_text:
          'Skill development and learning may benefit your career. Investing in education, training, or new competencies can strengthen your professional position.',
        variant_meta: {
          tone: 'opportunity',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'Signals suggest learning and skill-building as practical career levers.',
        },
        point_id: pointId,
      },
    },

    // 12) Network and gains (11th house)
    {
      code: 'NATAL_NETWORK_GAINS',
      label: 'Professional network and gains support career advancement.',
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
        scenario: 'network_gains',
        outcome_text:
          'Professional networks and connections may support your career. Maintaining relationships, offering value, and staying engaged with your professional community can be beneficial.',
        variant_meta: {
          tone: 'opportunity',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'Signals emphasize networking and relationship-building as career assets.',
        },
        point_id: pointId,
      },
    },

    // 13) Dasha: pressure phase
    {
      code: 'DASHA_CAREER_PRESSURE',
      label: 'Longer-term career pressure requires conservative approach.',
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
        scenario: 'pressure_phase',
        outcome_text:
          'A longer pressure phase may require more conservative career choices. You may benefit from maintaining stability, avoiding unnecessary risks, and focusing on steady performance.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'This guides longer-term career strategy during pressure patterns.',
        },
        point_id: pointId,
      },
    },

    // 14) High benefic score: strong momentum
    {
      code: 'HIGH_BENEFIC_CAREER_MOMENTUM',
      label: 'High benefic score indicates strong career momentum.',
      condition_tree: {
        all: [
          { overall_benefic_score: { min: 0.7 } },
          {
            planet_in_house: {
              planet_in: ['JUPITER', 'VENUS', 'MERCURY'],
              house_in: [10, 6, 11],
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
        intensity: 0.8,
        tone: 'positive',
        trigger: 'natal',
        scenario: 'strong_momentum',
        outcome_text:
          'Career momentum may feel stronger. You can capitalize on this by taking on meaningful projects, building visibility, and maintaining high performance standards.',
        variant_meta: {
          tone: 'opportunity',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'This supports "momentum and ease" framing, but still avoids guarantees.',
        },
        point_id: pointId,
      },
    },

    // 15) Work-life balance (6th + 12th)
    {
      code: 'NATAL_WORK_LIFE_BALANCE',
      label: 'Work-life balance needs attention to maintain career sustainability.',
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: ['SATURN'], house_in: [6, 12], match_mode: 'any', min_planets: 1 } },
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
        scenario: 'work_life_balance',
        outcome_text:
          'Work-life balance may need attention. Setting boundaries, managing workload, and ensuring adequate rest can help maintain long-term career sustainability.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'background',
          certainty_note: 'This is a sustainability signal, emphasizing long-term career health.',
        },
        point_id: pointId,
      },
    },

    // 16) Informational baseline
    {
      code: 'CAREER_INFORMATIONAL_BASELINE',
      label: 'Neutral baseline scenario when no strong directional push is present.',
      condition_tree: { generic_condition: { note: 'Career baseline (background).' } },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.4,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'informational_baseline',
        outcome_text:
          'This looks like a relatively neutral career phase. Steady performance, consistent effort, and maintaining professional relationships may matter more than major changes.',
        variant_meta: {
          tone: 'informational',
          confidence_level: 'low',
          dominance: 'background',
          certainty_note: 'Used as a baseline when stronger career variants are not present.',
        },
        point_id: pointId,
      },
    },
  ];
}

