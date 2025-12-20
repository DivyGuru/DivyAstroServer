export function getCAREER_GROWTH_PROMOTIONVariants() {
  const effectTheme = 'career';
  const area = 'career_growth';
  const pointId = 'CAREER_GROWTH_PROMOTION';

  const careerHouses = [10, 6, 11, 2];
  const growthHouses = [10, 11, 5];
  const benefics = ['JUPITER', 'VENUS'];
  const trade = ['MERCURY'];

  return [
    // 1) Strong promotion opportunity (10th + 11th)
    {
      code: 'NATAL_PROMOTION_OPPORTUNITY',
      label: 'Strong promotion opportunity via benefics in career and gains houses.',
      condition_tree: {
        all: [
          {
            planet_in_house: {
              planet_in: [...benefics, ...trade],
              house_in: [10, 11],
              match_mode: 'any',
              min_planets: 2,
            },
          },
          // 10th house lord activation (career growth marker)
          { house_lord_in_house: { house: 10, lord_house_in: [10, 11, 1, 6] } },
          // Strength: Venus/Jupiter (if provided in snapshot)
          { planet_strength: { planet: 'VENUS', min: 0.5 } },
          { planet_strength: { planet: 'JUPITER', min: 0.5 } },
          // Nakshatra confirmation (career context)
          {
            any: [
              { planet_in_nakshatra_group: { planet_in: ['JUPITER', 'VENUS', 'MERCURY', 'SUN'], group: { context: 'career', kind: 'supportive' }, match_mode: 'any', min_planets: 1 } },
              { planet_in_nakshatra_group: { planet_in: ['JUPITER', 'VENUS', 'MERCURY', 'SUN'], group: { context: 'career', kind: 'neutral' }, match_mode: 'any', min_planets: 1 } },
            ],
          },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'up',
        intensity: 0.9,
        tone: 'positive',
        trigger: 'natal',
        scenario: 'promotion_opportunity',
        outcome_text:
          'A career growth/promotion yog is present. Nakshatra support strengthens this phase. Role band: lead/senior IC or managerial responsibility. Increment band: moderate-to-strong (context- and execution-dependent).',
        variant_meta: {
          tone: 'opportunity',
          confidence_level: 'high',
          dominance: 'dominant',
          certainty_note: '10th-lord activation, Venus/Jupiter strength, and supportive career signals are present along with nakshatra confirmation.',
        },
        point_id: pointId,
      },
    },

    // 2) Recognition and visibility (10th house emphasis)
    {
      code: 'NATAL_RECOGNITION_VISIBILITY',
      label: 'Recognition and visibility support promotion chances.',
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
        scenario: 'recognition_visibility',
        outcome_text:
          'Visibility and recognition may improve. Keeping communication clear, delivering on commitments, and taking on visible projects can enhance promotion prospects.',
        variant_meta: {
          tone: 'opportunity',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'Signals suggest increased visibility; results depend on consistent performance.',
        },
        point_id: pointId,
      },
    },

    // 3) Gains and advancement (11th house)
    {
      code: 'NATAL_GAINS_ADVANCEMENT',
      label: 'Gains and advancement signature via 11th house activation.',
      condition_tree: {
        planet_in_house: {
          planet_in: ['JUPITER', 'VENUS', 'MERCURY', 'SUN'],
          house_in: [11],
          match_mode: 'any',
          min_planets: 1,
        },
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'up',
        intensity: 0.75,
        tone: 'positive',
        trigger: 'natal',
        scenario: 'gains_advancement',
        outcome_text:
          'Advancement opportunities may come through networks and achievements. Building professional relationships, delivering results, and staying visible can support growth.',
        variant_meta: {
          tone: 'opportunity',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'Signals point toward gains via networks and performance rather than isolated efforts.',
        },
        point_id: pointId,
      },
    },

    // 4) Transit: promotion window
    {
      code: 'TRANSIT_PROMOTION_WINDOW',
      label: 'Short-term promotion window from supportive transits.',
      scopes: ['hourly', 'daily', 'weekly'],
      condition_tree: {
        transit_planet_in_house: {
          planet_in: ['JUPITER', 'VENUS', 'MERCURY'],
          house_in: [10, 11],
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
        trigger: 'transit',
        scenario: 'promotion_window',
        outcome_text:
          'A short-term promotion window may be available. You can use it for important conversations, showcasing achievements, and reinforcing positive relationships.',
        variant_meta: {
          tone: 'opportunity',
          confidence_level: 'low',
          dominance: 'background',
          certainty_note: 'This is time-bound and treated as background unless reinforced by other signals.',
        },
        point_id: pointId,
      },
    },

    // 5) Dasha: long-term growth support
    {
      code: 'DASHA_GROWTH_SUPPORT',
      label: 'Long-term growth support during benefic dasha phases.',
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
        intensity: 0.75,
        tone: 'positive',
        trigger: 'dasha',
        scenario: 'long_term_growth',
        outcome_text:
          'A longer-term growth phase may be building. Steady skill development, consistent performance, and strategic career planning can compound advancement over time.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'This is framed as longer-term growth support, shaping career strategy.',
        },
        point_id: pointId,
      },
    },

    // 6) Promotion delay (Saturn pressure)
    {
      code: 'NATAL_PROMOTION_DELAY',
      label: 'Promotion delays require patience and continued performance.',
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: ['SATURN'], house_in: [10, 11], match_mode: 'any', min_planets: 1 } },
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
        scenario: 'promotion_delay',
        outcome_text:
          'Promotion may feel delayed. Maintaining strong performance, building skills, and staying patient can help you remain ready when opportunities arise.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'Signals indicate a "slow build" pattern; continued excellence is emphasized.',
        },
        point_id: pointId,
      },
    },

    // 7) High benefic score: strong momentum
    {
      code: 'HIGH_BENEFIC_GROWTH_MOMENTUM',
      label: 'High benefic score indicates strong growth momentum.',
      condition_tree: {
        all: [
          { overall_benefic_score: { min: 0.7 } },
          {
            planet_in_house: {
              planet_in: ['JUPITER', 'VENUS', 'MERCURY'],
              house_in: growthHouses,
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
        intensity: 0.85,
        tone: 'positive',
        trigger: 'natal',
        scenario: 'strong_momentum',
        outcome_text:
          'Growth momentum may feel stronger. You can capitalize on this by taking on challenging projects, building visibility, and maintaining high performance standards.',
        variant_meta: {
          tone: 'opportunity',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'This supports "momentum and ease" framing, but still avoids guarantees.',
        },
        point_id: pointId,
      },
    },

    // 8) Skill-based promotion (5th + 10th)
    {
      code: 'NATAL_SKILL_BASED_PROMOTION',
      label: 'Promotion supported through skill development and expertise.',
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
        scenario: 'skill_based_promotion',
        outcome_text:
          'Skill development and expertise may support promotion. Investing in learning, demonstrating competence, and taking on projects that showcase your abilities can strengthen advancement prospects.',
        variant_meta: {
          tone: 'opportunity',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'Signals emphasize skill-building as a promotion lever.',
        },
        point_id: pointId,
      },
    },

    // 9) Network-based advancement (11th house)
    {
      code: 'NATAL_NETWORK_ADVANCEMENT',
      label: 'Advancement supported through professional networks.',
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
        scenario: 'network_advancement',
        outcome_text:
          'Professional networks may support advancement. Maintaining relationships, offering value to others, and staying engaged with your professional community can enhance growth opportunities.',
        variant_meta: {
          tone: 'opportunity',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'Signals emphasize networking as a career growth asset.',
        },
        point_id: pointId,
      },
    },

    // 10) Mixed growth signals
    {
      code: 'MIXED_GROWTH_SIGNALS',
      label: 'Mixed growth signals: opportunity exists but challenges are present.',
      condition_tree: {
        all: [
          {
            planet_in_house: {
              planet_in: [...benefics, ...trade],
              house_in: growthHouses,
              match_mode: 'any',
              min_planets: 1,
            },
          },
          {
            planet_in_house: {
              planet_in: ['SATURN', 'MARS', 'RAHU', 'KETU'],
              house_in: [10, 11],
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
        intensity: 0.7,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'mixed_growth',
        outcome_text:
          'Growth opportunities may be available, but they can come with challenges. You can move forward while staying flexible, managing expectations, and focusing on what you can control.',
        variant_meta: {
          tone: 'informational',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'Support and challenges appear together; this is framed as balanced guidance.',
        },
        point_id: pointId,
      },
    },

    // 11) Slow build promotion (Saturn + benefic)
    {
      code: 'SLOW_BUILD_PROMOTION',
      label: 'Slow build promotion: disciplined effort yields eventual advancement.',
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: ['SATURN'], house_in: [10, 11], match_mode: 'any', min_planets: 1 } },
          { overall_benefic_score: { min: 0.6 } },
          {
            planet_in_house: {
              planet_in: ['JUPITER', 'VENUS', 'MERCURY'],
              house_in: [10, 11],
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
        intensity: 0.65,
        tone: 'positive',
        trigger: 'natal',
        scenario: 'slow_build_promotion',
        outcome_text:
          'Promotion may come through discipline rather than speed. You can benefit from structure, steady performance, and realistic timelines while building toward advancement.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'This emphasizes compounding advancement through consistency rather than quick wins.',
        },
        point_id: pointId,
      },
    },

    // 12) Transit: growth caution
    {
      code: 'TRANSIT_GROWTH_CAUTION',
      label: 'Short-term caution: avoid rushing promotion decisions.',
      scopes: ['hourly', 'daily', 'weekly'],
      condition_tree: {
        transit_planet_in_house: {
          planet_in: ['SATURN', 'MARS', 'RAHU', 'KETU'],
          house_in: [10, 11],
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
        scenario: 'growth_caution',
        outcome_text:
          'If pursuing promotion, you may benefit from slower approaches and extra checks in the short term—especially for important conversations and decisions.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'low',
          dominance: 'background',
          certainty_note: 'Short-term caution is treated as background guidance to reduce avoidable errors.',
        },
        point_id: pointId,
      },
    },

    // 13) Dasha: slow growth phase
    {
      code: 'DASHA_SLOW_GROWTH',
      label: 'Longer-term growth is possible but tends to be slower.',
      scopes: ['monthly', 'yearly', 'life_theme'],
      condition_tree: {
        any: [
          { dasha_running: { level: 'antardasha', planet_in: [7] } },
          { dasha_running: { level: 'pratyantardasha', planet_in: [7] } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.6,
        tone: 'cautious',
        trigger: 'dasha',
        scenario: 'slow_growth_phase',
        outcome_text:
          'Growth may still be possible, but it may reward structure over speed. Consider focusing on reliability, consistent performance, and realistic advancement timelines.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'background',
          certainty_note: 'This is treated as a longer-term pacing signal that shapes strategy and expectations.',
        },
        point_id: pointId,
      },
    },

    // 14) Alignment breakthrough (natal + transit)
    {
      code: 'ALIGNMENT_PROMOTION_BREAKTHROUGH',
      label: 'When natal promise and transits align, promotion breakthrough becomes likely.',
      scopes: ['daily', 'weekly', 'monthly'],
      condition_tree: {
        all: [
          {
            planet_in_house: {
              planet_in: ['JUPITER', 'VENUS', 'MERCURY'],
              house_in: [10, 11],
              match_mode: 'any',
              min_planets: 1,
            },
          },
          {
            transit_planet_in_house: {
              planet_in: ['JUPITER', 'VENUS', 'MERCURY'],
              house_in: [10, 11],
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
        trigger: 'combined',
        scenario: 'promotion_breakthrough',
        outcome_text:
          'A promotion breakthrough may be possible when preparation meets timing. Keeping performance strong and relationships positive can help you capture opportunities.',
        variant_meta: {
          tone: 'opportunity',
          confidence_level: 'medium',
          dominance: 'dominant',
          certainty_note: 'This is treated as dominant when alignment signals appear together; still expressed without certainty.',
        },
        point_id: pointId,
      },
    },

    // 15) Informational baseline
    {
      code: 'GROWTH_INFORMATIONAL_BASELINE',
      label: 'Baseline informational variant for growth/promotion context.',
      condition_tree: { generic_condition: { note: 'Growth baseline (background).' } },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.35,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'informational_baseline',
        outcome_text:
          'No single strong growth signal stands out here. Maintaining consistent performance and professional relationships may be sufficient for now.',
        variant_meta: {
          tone: 'informational',
          confidence_level: 'low',
          dominance: 'background',
          certainty_note: 'Used as a baseline when stronger growth variants do not match.',
        },
        point_id: pointId,
      },
    },
  ];
}

