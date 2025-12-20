export function getMONEY_BUSINESS_GENERALVariants() {
  const effectTheme = 'money';
  const area = 'money_business';
  const pointId = 'MONEY_BUSINESS_GENERAL';

  const keyHouses = [2, 7, 10, 11];
  const benefics = ['JUPITER', 'VENUS'];
  const trade = ['MERCURY'];
  const malefics = ['SATURN', 'MARS', 'RAHU', 'KETU'];

  return [
    // 1) Natal benefic support (general)
    {
      code: 'NATAL_BENEFIC_SUPPORT',
      label: 'Benefic/trade planets support business fundamentals (natal).',
      condition_tree: {
        all: [
          {
            planet_in_house: {
              planet_in: [...benefics, ...trade],
              house_in: keyHouses,
              match_mode: 'any',
              min_planets: 2,
            },
          },
          // Nakshatra confirmation (business context) - confirms, never creates alone
          {
            any: [
              { planet_in_nakshatra_group: { planet_in: ['JUPITER', 'VENUS', 'MERCURY'], group: { context: 'business', kind: 'supportive' }, match_mode: 'any', min_planets: 1 } },
              { planet_in_nakshatra_group: { planet_in: ['JUPITER', 'VENUS', 'MERCURY'], group: { context: 'business', kind: 'neutral' }, match_mode: 'any', min_planets: 1 } },
            ],
          },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'up',
        intensity: 0.7,
        tone: 'positive',
        trigger: 'natal',
        scenario: 'steady_support',
        outcome_text:
          'A business-support yog is present. Nakshatra support strengthens this signal. In this phase, focusing on consistency, clean execution, and 2–3 core priorities may be most effective.',
        variant_meta: {
          tone: 'opportunity',
          confidence_level: 'high',
          dominance: 'dominant',
          certainty_note: 'Supportive business signals are present along with nakshatra confirmation, so this is treated as a strong supportive indicator.',
        },
        point_id: pointId,
      },
    },

    // 2) Strong gains signature (2/11)
    {
      code: 'NATAL_DHAN_GAINS',
      label: 'Strong wealth/gains activation (2nd/11th).',
      condition_tree: {
        all: [
          {
            any: [
              { planet_in_house: { planet_in: ['JUPITER'], house_in: [2, 11] } },
              { planet_in_house: { planet_in: ['VENUS'], house_in: [2, 11] } },
              { planet_in_house: { planet_in: ['MERCURY'], house_in: [2, 11] } },
            ],
          },
          {
            any: [
              { planet_in_nakshatra_group: { planet_in: ['JUPITER', 'VENUS', 'MERCURY'], group: { context: 'business', kind: 'supportive' }, match_mode: 'any', min_planets: 1 } },
              { planet_in_nakshatra_group: { planet_in: ['JUPITER', 'VENUS', 'MERCURY'], group: { context: 'business', kind: 'neutral' }, match_mode: 'any', min_planets: 1 } },
            ],
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
        scenario: 'gain_opportunity',
        outcome_text:
          'A profit and gains yog is present. Nakshatra support strengthens this phase. Profit/revenue band: moderate-to-strong (execution-dependent). Focus on retention, a healthy sales pipeline, and consistent follow-through.',
        variant_meta: {
          tone: 'opportunity',
          confidence_level: 'high',
          dominance: 'supporting',
          certainty_note: 'This is a higher-upside signal and is used as a supporting emphasis for gains.',
        },
        point_id: pointId,
      },
    },

    // 3) Partnership/deals emphasis (7/10/11)
    {
      code: 'NATAL_DEALS_PARTNERSHIP',
      label: 'Business movement via deals, clients, partnerships.',
      condition_tree: {
        planet_in_house: {
          planet_in: ['MERCURY', 'VENUS'],
          house_in: [7, 10, 11],
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
        scenario: 'deals_and_clients',
        outcome_text:
          'Business movement may come through deals, client conversations, or partnerships. Keeping terms clear and timelines realistic can help.',
        variant_meta: {
          tone: 'informational',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'Signals suggest the “deal flow” channel is more relevant than pure solo execution right now.',
        },
        point_id: pointId,
      },
    },

    // 4) Transit boost (short-term)
    {
      code: 'TRANSIT_SUPPORTIVE',
      label: 'Short-term supportive transit for business (Jupiter/Venus in key houses).',
      scopes: ['hourly', 'daily', 'weekly'],
      condition_tree: {
        transit_planet_in_house: {
          planet_in: ['JUPITER', 'VENUS'],
          house_in: keyHouses,
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
        scenario: 'short_term_support',
        outcome_text:
          'Short-term support may be available. You can use it to close pending items, reduce backlog, and reinforce what is already working.',
        variant_meta: {
          tone: 'opportunity',
          confidence_level: 'medium',
          dominance: 'background',
          certainty_note: 'This is a time-bound supportive signal, treated as background unless reinforced by stronger indicators.',
        },
        point_id: pointId,
      },
    },

    // 5) Dasha support (long-term)
    {
      code: 'DASHA_BENEFIC',
      label: 'Longer-term support during benefic dasha (mahadasha/antardasha).',
      scopes: ['monthly', 'yearly', 'life_theme'],
      condition_tree: {
        any: [
          // Planet ids (common convention): Sun=1, Moon=2, Mars=3, Mercury=4, Jupiter=5, Venus=6, Saturn=7, Rahu=8, Ketu=9
          { dasha_running: { level: 'mahadasha', planet_in: [5, 6, 4] } }, // Jupiter/Venus/Mercury
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
        scenario: 'long_term_support',
        outcome_text:
          'A longer-term supportive phase may be building. Steady skill-building and disciplined planning can compound results over time.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'background',
          certainty_note: 'This is framed as longer-term support; it informs strategy more than day-to-day choices.',
        },
        point_id: pointId,
      },
    },

    // 6) Delay / slow progress (Saturn dominance)
    {
      code: 'NATAL_DELAY_SATURN',
      label: 'Slow but steady business progress; delays require patience.',
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: ['SATURN'], house_in: [10, 11, 6], match_mode: 'any', min_planets: 1 } },
          { overall_malefic_score: { min: 0.6 } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.55,
        tone: 'cautious',
        trigger: 'natal',
        scenario: 'delay_and_responsibility',
        outcome_text:
          'Progress may feel slower, but steady structure can still create results. Prefer realistic timelines, documentation, and cost control.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'Signals indicate “slow build” conditions, so disciplined execution is emphasized.',
        },
        point_id: pointId,
      },
    },

    // 7) Conflict / volatility (Mars)
    {
      code: 'NATAL_CONFLICT_MARS',
      label: 'Aggression/impulsiveness creates volatility in business decisions.',
      condition_tree: {
        planet_in_house: { planet_in: ['MARS'], house_in: [2, 7, 10], match_mode: 'any', min_planets: 1 },
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'down',
        intensity: 0.75,
        tone: 'challenging',
        trigger: 'natal',
        scenario: 'conflict_volatility',
        outcome_text:
          'Volatility can rise if decisions are rushed or reactive. It may help to pause before commitments and keep negotiations calm and factual.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'This is treated as a risk-control note rather than a definitive outcome.',
        },
        point_id: pointId,
      },
    },

    // 8) Sudden shocks (Rahu/Ketu)
    {
      code: 'SUDDEN_SHOCK_RAHU_KETU',
      label: 'Unexpected ups/downs; avoid risky moves.',
      condition_tree: {
        planet_in_house: {
          planet_in: ['RAHU', 'KETU'],
          house_in: [2, 7, 11, 8, 12],
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
        scenario: 'sudden_events',
        outcome_text:
          'Unexpected changes can appear. Keeping buffers, avoiding over-leverage, and making stepwise decisions can reduce stress.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'medium',
          dominance: 'background',
          certainty_note: 'This is a volatility-style signal and is treated as background unless reinforced by other risk indicators.',
        },
        point_id: pointId,
      },
    },

    // 9) Mixed signal: benefic + malefic both active in key houses
    {
      code: 'MIXED_SIGNAL',
      label: 'Support exists but needs careful risk control (mixed signal).',
      condition_tree: {
        all: [
          {
            planet_in_house: {
              planet_in: [...benefics, ...trade],
              house_in: keyHouses,
              match_mode: 'any',
              min_planets: 1,
            },
          },
          {
            planet_in_house: {
              planet_in: malefics,
              house_in: keyHouses,
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
        scenario: 'support_with_risk',
        outcome_text:
          'Support and risk may coexist. You can move forward, but it may help to keep commitments smaller and verify assumptions.',
        variant_meta: {
          tone: 'informational',
          confidence_level: 'medium',
          dominance: 'dominant',
          certainty_note: 'Both supportive and challenging indicators appear together, so a balanced posture is recommended.',
        },
        point_id: pointId,
      },
    },

    // 10) Transit caution (malefic transit)
    {
      code: 'TRANSIT_CAUTION',
      label: 'Short-term caution when malefics transit key houses.',
      scopes: ['hourly', 'daily', 'weekly'],
      condition_tree: {
        all: [
          {
            transit_planet_in_house: {
              planet_in: ['SATURN', 'MARS', 'RAHU', 'KETU'],
              house_in: keyHouses,
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
        scenario: 'short_term_risk',
        outcome_text:
          'Short-term caution is advised. Consider double-checking numbers, slowing down big spends, and keeping agreements clear.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'medium',
          dominance: 'background',
          certainty_note: 'This is time-bound caution and is used mainly to reduce avoidable mistakes.',
        },
        point_id: pointId,
      },
    },

    // 11) Operational efficiency focus (Mercury execution)
    {
      code: 'NATAL_OPERATIONAL_EFFICIENCY',
      label: 'Operational efficiency improves when execution and routines are emphasized.',
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
        intensity: 0.6,
        tone: 'positive',
        trigger: 'natal',
        scenario: 'operational_efficiency',
        outcome_text:
          'Execution and routines may work in your favor. Streamlining processes and tracking a few key metrics can improve stability.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'Signals suggest process/operations are a practical lever for improvement.',
        },
        point_id: pointId,
      },
    },

    // 12) Transit: deal-flow activation via Mercury
    {
      code: 'TRANSIT_MERCURY_DEAL_FLOW',
      label: 'Short-term deal flow increases through active communication.',
      scopes: ['hourly', 'daily', 'weekly'],
      condition_tree: {
        transit_planet_in_house: {
          planet_in: ['MERCURY'],
          house_in: [7, 11, 2],
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
        scenario: 'deal_flow_window',
        outcome_text:
          'A short-term communication window may help. It can be useful for outreach, negotiation, and closing pending discussions.',
        variant_meta: {
          tone: 'opportunity',
          confidence_level: 'low',
          dominance: 'background',
          certainty_note: 'This is a short-term signal and is treated lightly unless supported by other indicators.',
        },
        point_id: pointId,
      },
    },

    // 13) Dasha: pressure phase (risk-control)
    {
      code: 'DASHA_PRESSURE_RISK_CONTROL',
      label: 'Longer-term pressure: keep commitments smaller and controls stronger.',
      scopes: ['monthly', 'yearly', 'life_theme'],
      condition_tree: {
        any: [
          { dasha_running: { level: 'mahadasha', planet_in: [7, 3, 8, 9] } }, // Saturn/Mars/Rahu/Ketu
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
          'A pressure-oriented phase may require more conservative choices. You may benefit from tighter budgeting and clearer decision gates.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'This is used to encourage risk-control during longer-term pressure patterns.',
        },
        point_id: pointId,
      },
    },

    // 14) Expense leakage (12th/2nd)
    {
      code: 'NATAL_EXPENSE_LEAKAGE',
      label: 'Expense leakage can reduce perceived gains if not tracked.',
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: ['SATURN', 'RAHU', 'KETU'], house_in: [12, 2], match_mode: 'any', min_planets: 1 } },
          { overall_malefic_score: { min: 0.55 } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'down',
        intensity: 0.7,
        tone: 'cautious',
        trigger: 'natal',
        scenario: 'expense_leakage',
        outcome_text:
          'Cash outflows may need attention. Tightening expense tracking and reducing avoidable leakage can protect margins.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'Risk indicators around outflows make cost-control a practical first move.',
        },
        point_id: pointId,
      },
    },

    // 15) Stabilize with structure (Saturn + benefic support)
    {
      code: 'STABILIZE_WITH_STRUCTURE',
      label: 'Stabilization improves through structure and steady follow-through.',
      scopes: ['monthly', 'yearly'],
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: ['SATURN'], house_in: [6, 10], match_mode: 'any', min_planets: 1 } },
          { overall_benefic_score: { min: 0.6 } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.55,
        tone: 'cautious',
        trigger: 'natal',
        scenario: 'structure_stabilization',
        outcome_text:
          'A structured approach may stabilize outcomes. Prefer clear SOPs, realistic timelines, and stepwise commitments.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'background',
          certainty_note: 'This is a steadying pattern; it supports resilience more than quick wins.',
        },
        point_id: pointId,
      },
    },

    // 16) Neutral baseline (informational)
    {
      code: 'INFORMATIONAL_BASELINE',
      label: 'A neutral baseline scenario when no strong directional push is present.',
      condition_tree: { generic_condition: { note: 'Informational baseline variant.' } },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.4,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'informational_baseline',
        outcome_text:
          'This looks like a relatively neutral phase. Small optimizations and steady consistency may matter more than big pivots.',
        variant_meta: {
          tone: 'informational',
          confidence_level: 'low',
          dominance: 'background',
          certainty_note: 'Used as a baseline when stronger variants are not present.',
        },
        point_id: pointId,
      },
    },
  ];
}


