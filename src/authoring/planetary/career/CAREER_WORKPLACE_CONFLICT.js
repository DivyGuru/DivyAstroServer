export function getCAREER_WORKPLACE_CONFLICTVariants() {
  const effectTheme = 'career';
  const area = 'career_workplace_conflict';
  const pointId = 'CAREER_WORKPLACE_CONFLICT';

  const conflictHouses = [10, 6, 7, 12];
  const malefics = ['SATURN', 'MARS', 'RAHU', 'KETU'];
  const benefics = ['JUPITER', 'VENUS'];
  const trade = ['MERCURY'];

  return [
    // 1) High conflict risk (Mars + Saturn in career houses)
    {
      code: 'HIGH_CONFLICT_RISK',
      label: 'High workplace conflict risk from malefics in career houses.',
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: ['MARS', 'SATURN'], house_in: [10, 6, 7], match_mode: 'any', min_planets: 1 } },
          { overall_malefic_score: { min: 0.7 } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'down',
        intensity: 0.85,
        tone: 'challenging',
        trigger: 'natal',
        scenario: 'high_conflict_risk',
        outcome_text:
          'Workplace conflict risk may be elevated. Keeping discussions factual, avoiding gossip, maintaining professional boundaries, and documenting important interactions can help you navigate tension.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'high',
          dominance: 'dominant',
          certainty_note: 'Multiple conflict indicators are simultaneously present; prioritize calm structure and documentation.',
        },
        point_id: pointId,
      },
    },

    // 2) Authority conflicts (10th house stress)
    {
      code: 'NATAL_AUTHORITY_CONFLICT',
      label: 'Authority and management conflicts may arise.',
      condition_tree: {
        planet_in_house: { planet_in: ['MARS', 'SATURN'], house_in: [10], match_mode: 'any', min_planets: 1 },
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'down',
        intensity: 0.75,
        tone: 'challenging',
        trigger: 'natal',
        scenario: 'authority_conflict',
        outcome_text:
          'Tension with authority figures may increase. Keeping communication respectful, focusing on work quality, and maintaining professional boundaries can help manage conflicts.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'This is treated as a conflict-management signal rather than a definitive negative outcome.',
        },
        point_id: pointId,
      },
    },

    // 3) Colleague conflicts (6th + 7th)
    {
      code: 'NATAL_COLLEAGUE_CONFLICT',
      label: 'Colleague and peer conflicts may increase.',
      condition_tree: {
        planet_in_house: { planet_in: ['MARS'], house_in: [6, 7], match_mode: 'any', min_planets: 1 },
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'down',
        intensity: 0.7,
        tone: 'challenging',
        trigger: 'natal',
        scenario: 'colleague_conflict',
        outcome_text:
          'Peer conflicts may rise. Staying neutral, avoiding taking sides, and focusing on your work can help you maintain professional relationships and avoid unnecessary drama.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'This is treated as a relationship-management signal.',
        },
        point_id: pointId,
      },
    },

    // 4) Hidden conflicts (Rahu/Ketu)
    {
      code: 'HIDDEN_CONFLICTS',
      label: 'Hidden conflicts and misunderstandings may create tension.',
      condition_tree: {
        planet_in_house: { planet_in: ['RAHU', 'KETU'], house_in: [10, 6, 7, 12], match_mode: 'any', min_planets: 1 },
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'down',
        intensity: 0.75,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'hidden_conflicts',
        outcome_text:
          'Misunderstandings and hidden tensions may create conflict. Clarifying communications, confirming assumptions, and keeping interactions transparent can reduce friction.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'This is treated as a communication-clarity signal rather than a definite conflict outcome.',
        },
        point_id: pointId,
      },
    },

    // 5) Transit: short-term conflict window
    {
      code: 'TRANSIT_CONFLICT_WINDOW',
      label: 'Short-term conflict risk from malefic transits.',
      scopes: ['hourly', 'daily', 'weekly'],
      condition_tree: {
        all: [
          {
            transit_planet_in_house: {
              planet_in: ['MARS', 'SATURN', 'RAHU', 'KETU'],
              house_in: [10, 6, 7],
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
        intensity: 0.6,
        tone: 'challenging',
        trigger: 'transit',
        scenario: 'short_term_conflict',
        outcome_text:
          'Short-term conflict risk may be present. Consider avoiding sensitive topics, keeping communications clear, and focusing on essential work to reduce tension.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'low',
          dominance: 'background',
          certainty_note: 'Time-bound conflict signal, treated as background guidance.',
        },
        point_id: pointId,
      },
    },

    // 6) Dasha: conflict phase
    {
      code: 'DASHA_CONFLICT_PHASE',
      label: 'Longer-term conflict phase during malefic dasha.',
      scopes: ['monthly', 'yearly', 'life_theme'],
      condition_tree: {
        any: [
          { dasha_running: { level: 'mahadasha', planet_in: [3, 7, 8, 9] } },
          { dasha_running: { level: 'antardasha', planet_in: [3, 7, 8, 9] } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'down',
        intensity: 0.75,
        tone: 'challenging',
        trigger: 'dasha',
        scenario: 'conflict_phase',
        outcome_text:
          'A longer conflict phase may be active. Maintaining professional boundaries, documenting important interactions, and focusing on work quality can help you navigate this period.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'This guides longer-term conflict management strategy.',
        },
        point_id: pointId,
      },
    },

    // 7) Conflict resolution (benefic support)
    {
      code: 'CONFLICT_RESOLUTION_SUPPORT',
      label: 'Conflict resolution supported through benefic influence.',
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: [...benefics, ...trade], house_in: [10, 6, 7], match_mode: 'any', min_planets: 1 } },
          { overall_benefic_score: { min: 0.6 } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.6,
        tone: 'positive',
        trigger: 'natal',
        scenario: 'conflict_resolution',
        outcome_text:
          'Conflict resolution may be easier. Approaching discussions calmly, finding common ground, and maintaining professional respect can help resolve tensions.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'Signals suggest resolution potential; results depend on practical communication.',
        },
        point_id: pointId,
      },
    },

    // 8) Mixed signals (conflict with support)
    {
      code: 'MIXED_CONFLICT_SIGNALS',
      label: 'Mixed signals: conflicts exist but resolution support is present.',
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: malefics, house_in: conflictHouses, match_mode: 'any', min_planets: 1 } },
          { planet_in_house: { planet_in: [...benefics, ...trade], house_in: [10, 6, 7], match_mode: 'any', min_planets: 1 } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.7,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'mixed_conflict',
        outcome_text:
          'Conflicts may exist, but resolution support is available. You can manage tensions by staying calm, communicating clearly, and focusing on work quality.',
        variant_meta: {
          tone: 'informational',
          confidence_level: 'medium',
          dominance: 'dominant',
          certainty_note: 'Both conflict and resolution indicators appear together, so a balanced approach is recommended.',
        },
        point_id: pointId,
      },
    },

    // 9) Political tension (6th + 10th)
    {
      code: 'NATAL_POLITICAL_TENSION',
      label: 'Workplace politics and tension may increase.',
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: ['SATURN', 'MARS'], house_in: [6, 10], match_mode: 'any', min_planets: 1 } },
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
        scenario: 'political_tension',
        outcome_text:
          'Workplace politics may intensify. Staying neutral, avoiding gossip, focusing on your work, and maintaining professional boundaries can help you navigate political dynamics.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'This is treated as a political-awareness signal; neutrality is emphasized.',
        },
        point_id: pointId,
      },
    },

    // 10) Communication friction (Mercury + malefic)
    {
      code: 'COMMUNICATION_FRICTION',
      label: 'Communication friction creates misunderstandings and conflicts.',
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: ['MERCURY'], house_in: [10, 6, 7], match_mode: 'any', min_planets: 1 } },
          { planet_in_house: { planet_in: malefics, house_in: conflictHouses, match_mode: 'any', min_planets: 1 } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'down',
        intensity: 0.7,
        tone: 'challenging',
        trigger: 'natal',
        scenario: 'communication_friction',
        outcome_text:
          'Communication friction may increase conflicts. Clarifying messages, confirming understanding, and keeping written records of important discussions can reduce misunderstandings.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'Signals indicate communication clarity is a key lever for conflict reduction.',
        },
        point_id: pointId,
      },
    },

    // 11) Ego clashes (Mars in 7th)
    {
      code: 'EGO_CLASHES',
      label: 'Ego clashes and power struggles may create conflicts.',
      condition_tree: {
        planet_in_house: { planet_in: ['MARS'], house_in: [7, 10], match_mode: 'any', min_planets: 1 },
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'down',
        intensity: 0.75,
        tone: 'challenging',
        trigger: 'natal',
        scenario: 'ego_clashes',
        outcome_text:
          'Ego clashes and power struggles may increase. Staying humble, focusing on work quality, and avoiding unnecessary confrontations can help you maintain professional relationships.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'This is treated as a relationship-management signal; humility is emphasized.',
        },
        point_id: pointId,
      },
    },

    // 12) Conflict avoidance (benefic support)
    {
      code: 'CONFLICT_AVOIDANCE_SUPPORT',
      label: 'Conflict avoidance supported through benefic influence.',
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: ['VENUS', 'JUPITER'], house_in: [10, 6, 7], match_mode: 'any', min_planets: 1 } },
          { overall_benefic_score: { min: 0.65 } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'up',
        intensity: 0.6,
        tone: 'positive',
        trigger: 'natal',
        scenario: 'conflict_avoidance',
        outcome_text:
          'Conflict avoidance may be easier. Maintaining positive relationships, staying diplomatic, and focusing on common goals can help you navigate workplace dynamics smoothly.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'background',
          certainty_note: 'Signals suggest harmony potential; results depend on maintaining positive interactions.',
        },
        point_id: pointId,
      },
    },

    // 13) High malefic score: peak conflict
    {
      code: 'HIGH_MALEFIC_CONFLICT',
      label: 'High malefic score indicates peak conflict pressure.',
      condition_tree: {
        all: [
          { overall_malefic_score: { min: 0.75 } },
          { planet_in_house: { planet_in: ['MARS', 'SATURN'], house_in: [10, 6, 7], match_mode: 'any', min_planets: 1 } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'down',
        intensity: 0.9,
        tone: 'challenging',
        trigger: 'natal',
        scenario: 'peak_conflict',
        outcome_text:
          'Significant conflict pressure may be present. Documenting interactions, maintaining professional boundaries, and focusing on work quality can help you navigate this challenging phase.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'high',
          dominance: 'dominant',
          certainty_note: 'Strong conflict indicators are combined here, so defensive posture is emphasized.',
        },
        point_id: pointId,
      },
    },

    // 14) Recovery from conflict
    {
      code: 'CONFLICT_RECOVERY',
      label: 'Recovery from conflict through structure and diplomacy.',
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
        scenario: 'conflict_recovery',
        outcome_text:
          'Recovery from conflicts may improve through structure and diplomacy. Focusing on work quality, maintaining professional boundaries, and rebuilding relationships gradually can help.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'background',
          certainty_note: 'This is treated as a recovery pattern—gradual improvement through structure.',
        },
        point_id: pointId,
      },
    },

    // 15) Informational baseline
    {
      code: 'CONFLICT_INFORMATIONAL_BASELINE',
      label: 'Baseline informational variant for workplace conflict context.',
      condition_tree: { generic_condition: { note: 'Conflict baseline (background).' } },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.35,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'informational_baseline',
        outcome_text:
          'No single strong conflict signal stands out here. Maintaining professional boundaries and focusing on work quality may be sufficient for now.',
        variant_meta: {
          tone: 'informational',
          confidence_level: 'low',
          dominance: 'background',
          certainty_note: 'Used as a baseline when stronger conflict variants do not match.',
        },
        point_id: pointId,
      },
    },
  ];
}

