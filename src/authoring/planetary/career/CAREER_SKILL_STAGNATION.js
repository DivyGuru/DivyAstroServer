export function getCAREER_SKILL_STAGNATIONVariants() {
  const effectTheme = 'career';
  const area = 'career_skill_stagnation';
  const pointId = 'CAREER_SKILL_STAGNATION';

  const skillHouses = [5, 10, 3];
  const benefics = ['JUPITER', 'VENUS'];
  const trade = ['MERCURY'];
  const malefics = ['SATURN', 'MARS', 'RAHU', 'KETU'];

  return [
    // 1) Skill stagnation (malefics in 5th/10th)
    {
      code: 'NATAL_SKILL_STAGNATION',
      label: 'Skill stagnation from malefics in learning and career houses.',
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: ['SATURN', 'RAHU', 'KETU'], house_in: [5, 10], match_mode: 'any', min_planets: 1 } },
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
        scenario: 'skill_stagnation',
        outcome_text:
          'Skill development may feel stagnant. Breaking learning into smaller steps, finding new challenges, and seeking feedback can help you overcome stagnation and continue growing.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'high',
          dominance: 'dominant',
          certainty_note: 'Multiple stagnation indicators are present; proactive learning is emphasized.',
        },
        point_id: pointId,
      },
    },

    // 2) Learning block (5th house afflicted)
    {
      code: 'NATAL_LEARNING_BLOCK',
      label: 'Learning block and difficulty acquiring new skills.',
      condition_tree: {
        planet_in_house: { planet_in: ['SATURN', 'RAHU', 'KETU'], house_in: [5], match_mode: 'any', min_planets: 1 },
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'down',
        intensity: 0.7,
        tone: 'challenging',
        trigger: 'natal',
        scenario: 'learning_block',
        outcome_text:
          'Learning may feel blocked or difficult. Trying different learning methods, breaking concepts into smaller pieces, and finding practical applications can help you overcome learning challenges.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'This is treated as a learning-strategy signal rather than a permanent block.',
        },
        point_id: pointId,
      },
    },

    // 3) Skill growth opportunity (benefics in 5th/10th)
    {
      code: 'NATAL_SKILL_GROWTH',
      label: 'Skill growth opportunity via benefics in learning houses.',
      condition_tree: {
        planet_in_house: {
          planet_in: ['MERCURY', 'JUPITER'],
          house_in: [5, 10],
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
        scenario: 'skill_growth',
        outcome_text:
          'Skill development opportunities may be available. Investing in learning, taking on challenging projects, and seeking mentorship can accelerate your professional growth.',
        variant_meta: {
          tone: 'opportunity',
          confidence_level: 'high',
          dominance: 'dominant',
          certainty_note: 'Multiple growth signals align; this is prioritized as a primary learning opportunity.',
        },
        point_id: pointId,
      },
    },

    // 4) Transit: skill development window
    {
      code: 'TRANSIT_SKILL_WINDOW',
      label: 'Short-term skill development window from supportive transits.',
      scopes: ['hourly', 'daily', 'weekly'],
      condition_tree: {
        transit_planet_in_house: {
          planet_in: ['MERCURY', 'JUPITER', 'VENUS'],
          house_in: [5, 10],
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
        scenario: 'skill_window',
        outcome_text:
          'A short-term learning window may be available. You can use it for training, skill-building activities, or taking on projects that require new competencies.',
        variant_meta: {
          tone: 'opportunity',
          confidence_level: 'low',
          dominance: 'background',
          certainty_note: 'This is time-bound and treated as background unless reinforced by other signals.',
        },
        point_id: pointId,
      },
    },

    // 5) Dasha: long-term skill support
    {
      code: 'DASHA_SKILL_SUPPORT',
      label: 'Long-term skill development support during benefic dasha.',
      scopes: ['monthly', 'yearly', 'life_theme'],
      condition_tree: {
        any: [
          { dasha_running: { level: 'mahadasha', planet_in: [4, 5] } },
          { dasha_running: { level: 'antardasha', planet_in: [4, 5] } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'up',
        intensity: 0.7,
        tone: 'positive',
        trigger: 'dasha',
        scenario: 'long_term_skill_support',
        outcome_text:
          'A longer-term skill development phase may be building. Consistent learning, practice, and applying new knowledge can compound growth over time.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'background',
          certainty_note: 'This is framed as longer-term learning support, informing career strategy.',
        },
        point_id: pointId,
      },
    },

    // 6) Dasha: skill stagnation phase
    {
      code: 'DASHA_SKILL_STAGNATION',
      label: 'Longer-term skill stagnation during malefic dasha.',
      scopes: ['monthly', 'yearly', 'life_theme'],
      condition_tree: {
        any: [
          { dasha_running: { level: 'mahadasha', planet_in: [7, 8, 9] } },
          { dasha_running: { level: 'antardasha', planet_in: [7, 8, 9] } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'down',
        intensity: 0.7,
        tone: 'challenging',
        trigger: 'dasha',
        scenario: 'stagnation_phase',
        outcome_text:
          'A longer stagnation phase may require more effort for skill development. Breaking learning into smaller steps, finding practical applications, and maintaining patience can help you continue growing.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'This guides longer-term learning strategy during stagnation patterns.',
        },
        point_id: pointId,
      },
    },

    // 7) Mixed signals (growth with challenges)
    {
      code: 'MIXED_SKILL_SIGNALS',
      label: 'Mixed skill signals: growth opportunities exist but challenges are present.',
      condition_tree: {
        all: [
          {
            planet_in_house: {
              planet_in: [...benefics, ...trade],
              house_in: skillHouses,
              match_mode: 'any',
              min_planets: 1,
            },
          },
          {
            planet_in_house: {
              planet_in: malefics,
              house_in: skillHouses,
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
        scenario: 'mixed_skill_signals',
        outcome_text:
          'Skill development opportunities may be available, but they can come with challenges. You can pursue learning while staying patient, breaking concepts into manageable steps, and finding practical applications.',
        variant_meta: {
          tone: 'informational',
          confidence_level: 'medium',
          dominance: 'dominant',
          certainty_note: 'Both growth and stagnation indicators appear together, so a balanced approach is recommended.',
        },
        point_id: pointId,
      },
    },

    // 8) Expertise development (Mercury + Jupiter)
    {
      code: 'NATAL_EXPERTISE_DEVELOPMENT',
      label: 'Expertise development supported through learning and knowledge.',
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: ['MERCURY', 'JUPITER'], house_in: [5, 10], match_mode: 'any', min_planets: 1 } },
          { overall_benefic_score: { min: 0.65 } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'up',
        intensity: 0.8,
        tone: 'positive',
        trigger: 'natal',
        scenario: 'expertise_development',
        outcome_text:
          'Expertise development may accelerate. Deep learning, specialized training, and applying knowledge in practice can help you build valuable professional competencies.',
        variant_meta: {
          tone: 'opportunity',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'Signals emphasize deep learning and expertise-building as growth levers.',
        },
        point_id: pointId,
      },
    },

    // 9) Slow skill build (Saturn + benefic)
    {
      code: 'SLOW_SKILL_BUILD',
      label: 'Slow skill build: disciplined learning yields gradual growth.',
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: ['SATURN'], house_in: [5, 10], match_mode: 'any', min_planets: 1 } },
          { overall_benefic_score: { min: 0.6 } },
          {
            planet_in_house: {
              planet_in: ['MERCURY', 'JUPITER'],
              house_in: [5, 10],
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
        scenario: 'slow_skill_build',
        outcome_text:
          'Skill growth may come through discipline rather than speed. Consistent practice, structured learning, and realistic timelines can help you build competencies steadily.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'This emphasizes compounding skill growth through consistency rather than quick wins.',
        },
        point_id: pointId,
      },
    },

    // 10) High benefic score: strong learning momentum
    {
      code: 'HIGH_BENEFIC_LEARNING_MOMENTUM',
      label: 'High benefic score indicates strong learning momentum.',
      condition_tree: {
        all: [
          { overall_benefic_score: { min: 0.7 } },
          {
            planet_in_house: {
              planet_in: ['MERCURY', 'JUPITER'],
              house_in: skillHouses,
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
        scenario: 'learning_momentum',
        outcome_text:
          'Learning momentum may feel stronger. You can capitalize on this by taking on challenging projects, pursuing advanced training, and applying new knowledge in practice.',
        variant_meta: {
          tone: 'opportunity',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'This supports "momentum and ease" framing, but still avoids guarantees.',
        },
        point_id: pointId,
      },
    },

    // 11) Creative skill development (5th house focus)
    {
      code: 'NATAL_CREATIVE_SKILLS',
      label: 'Creative and intellectual skill development supported.',
      condition_tree: {
        planet_in_house: {
          planet_in: ['MERCURY', 'VENUS', 'JUPITER'],
          house_in: [5],
          match_mode: 'any',
          min_planets: 1,
        },
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'up',
        intensity: 0.7,
        tone: 'positive',
        trigger: 'natal',
        scenario: 'creative_skills',
        outcome_text:
          'Creative and intellectual skills may develop well. Exploring new ideas, experimenting with approaches, and applying creative thinking can enhance your professional capabilities.',
        variant_meta: {
          tone: 'opportunity',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'Signals emphasize creative and intellectual development as growth assets.',
        },
        point_id: pointId,
      },
    },

    // 12) Communication skills (3rd + 5th)
    {
      code: 'NATAL_COMMUNICATION_SKILLS',
      label: 'Communication and expression skills support career growth.',
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: ['MERCURY'], house_in: [3, 5], match_mode: 'any', min_planets: 1 } },
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
        scenario: 'communication_skills',
        outcome_text:
          'Communication skills may strengthen. Practicing clear expression, active listening, and adapting your communication style can enhance your professional effectiveness.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'background',
          certainty_note: 'Signals suggest communication as a practical skill development area.',
        },
        point_id: pointId,
      },
    },

    // 13) Skill obsolescence risk (12th house)
    {
      code: 'SKILL_OBSOLESCENCE_RISK',
      label: 'Skill obsolescence risk requires continuous learning.',
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: ['SATURN', 'RAHU', 'KETU'], house_in: [12, 5], match_mode: 'any', min_planets: 1 } },
          { overall_malefic_score: { min: 0.6 } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'down',
        intensity: 0.7,
        tone: 'challenging',
        trigger: 'natal',
        scenario: 'obsolescence_risk',
        outcome_text:
          'Skills may need updating to stay relevant. Investing in continuous learning, staying current with industry trends, and adapting to new technologies can help you maintain professional value.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'This is treated as a continuous-learning signal rather than a permanent decline.',
        },
        point_id: pointId,
      },
    },

    // 14) Recovery from stagnation
    {
      code: 'SKILL_STAGNATION_RECOVERY',
      label: 'Recovery from stagnation through structured learning.',
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: ['SATURN'], house_in: [5, 10], match_mode: 'any', min_planets: 1 } },
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
        scenario: 'stagnation_recovery',
        outcome_text:
          'Recovery from stagnation may improve through structured learning. Setting clear learning goals, breaking skills into manageable steps, and finding practical applications can help you resume growth.',
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
      code: 'SKILL_INFORMATIONAL_BASELINE',
      label: 'Baseline informational variant for skill stagnation context.',
      condition_tree: { generic_condition: { note: 'Skill baseline (background).' } },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.35,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'informational_baseline',
        outcome_text:
          'No single strong skill signal stands out here. Maintaining consistent learning and seeking growth opportunities may be sufficient for now.',
        variant_meta: {
          tone: 'informational',
          confidence_level: 'low',
          dominance: 'background',
          certainty_note: 'Used as a baseline when stronger skill variants do not match.',
        },
        point_id: pointId,
      },
    },
  ];
}

