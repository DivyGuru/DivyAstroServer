export function getMONEY_BUSINESS_LOSS_RISKVariants() {
  const effectTheme = 'money';
  const area = 'money_business';
  const pointId = 'MONEY_BUSINESS_LOSS_RISK';

  const keyHouses = [2, 7, 10, 11];
  const riskHouses = Array.from(new Set([...keyHouses, 6, 8, 12])); // 6=debt/conflict, 8=shocks, 12=loss/expenses
  const malefics = ['SATURN', 'MARS', 'RAHU', 'KETU'];
  const benefics = ['JUPITER', 'VENUS'];
  const trade = ['MERCURY'];

  // Planet ids (common convention): Sun=1, Moon=2, Mars=3, Mercury=4, Jupiter=5, Venus=6, Saturn=7, Rahu=8, Ketu=9
  const DASHAA_MALEFIC_IDS = [7, 3, 8, 9];
  const DASHAA_RECOVERY_IDS = [5, 6, 4, 1]; // Jupiter/Venus/Mercury/Sun (structure + growth + execution)

  return [
    // 1) High risk baseline: malefics + high malefic score
    {
      code: 'HIGH_RISK_BASELINE',
      label: 'High risk baseline: malefics activated with elevated malefic score.',
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: malefics, house_in: riskHouses, match_mode: 'any', min_planets: 1 } },
          { overall_malefic_score: { min: 0.7 } },
          // Nakshatra resistance (business context): strengthens caution framing (never creates risk alone)
          {
            any: [
              { planet_in_nakshatra_group: { planet_in: ['SATURN', 'MARS', 'RAHU', 'KETU'], group: { context: 'business', kind: 'sensitive' }, match_mode: 'any', min_planets: 1 } },
              { planet_in_nakshatra_group: { planet_in: ['SATURN', 'MARS', 'RAHU', 'KETU'], group: { context: 'business', kind: 'obstructive' }, match_mode: 'any', min_planets: 1 } },
            ],
          },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'down',
        intensity: 0.85,
        tone: 'challenging',
        trigger: 'natal',
        scenario: 'high_risk_baseline',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'high',
          dominance: 'dominant',
          certainty_note: 'Multiple risk indicators are simultaneously present; prioritize conservative decisions and buffers.',
        },
        outcome_text:
          'Risk management is important in this phase. Nakshatra sensitivity reinforces this caution. Slower commitments, tighter cash controls, and conservative decision gates are recommended.',
        point_id: pointId,
      },
    },

    // 2) Delay + slow movement (Saturn load)
    {
      code: 'DELAY_SLOW_MOVEMENT',
      label: 'Delays and slow movement: Saturn pressure requires patience and structure.',
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: ['SATURN'], house_in: [10, 11, 6], match_mode: 'any', min_planets: 1 } },
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
        scenario: 'delay_and_pressure',
        outcome_text:
          'Progress may feel slower and more demanding. Keeping structure, clear timelines, and disciplined follow-through can reduce stress.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'This is framed as pacing/pressure rather than a definitive negative outcome.',
        },
        point_id: pointId,
      },
    },

    // 3) Cash-flow crunch: expenses/loss houses activated
    {
      code: 'CASHFLOW_CRUNCH',
      label: 'Cash-flow crunch: expenses/loss activation and tighter liquidity.',
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: ['SATURN', 'RAHU', 'KETU'], house_in: [12, 2], match_mode: 'any', min_planets: 1 } },
          { overall_malefic_score: { min: 0.6 } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'down',
        intensity: 0.8,
        tone: 'challenging',
        trigger: 'natal',
        scenario: 'cashflow_crunch',
        outcome_text:
          'Liquidity may feel tight. It can help to track cash weekly, reduce leakage, and avoid avoidable large spends.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'high',
          dominance: 'dominant',
          certainty_note: 'Outflow-style indicators are strong, so cash discipline is prioritized.',
        },
        point_id: pointId,
      },
    },

    // 4) Debt / legal / conflict pressure (6/8 emphasis)
    {
      code: 'DEBT_PRESSURE',
      label: 'Debt/pressure phase: obligations, disputes, or repayment stress increases.',
      condition_tree: {
        planet_in_house: { planet_in: ['SATURN', 'MARS', 'RAHU'], house_in: [6, 8], match_mode: 'any', min_planets: 1 },
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'down',
        intensity: 0.75,
        tone: 'challenging',
        trigger: 'natal',
        scenario: 'debt_and_obligations',
        outcome_text:
          'Obligations and pressure may increase. Consider simplifying commitments, keeping documentation clean, and avoiding rushed legal or debt decisions.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'This is treated as a “pressure management” signal—practical checks reduce avoidable escalation.',
        },
        point_id: pointId,
      },
    },

    // 5) Wrong partnership / deal risk (7th afflicted)
    {
      code: 'WRONG_PARTNERSHIP_RISK',
      label: 'Wrong partnership risk: agreements need careful checks and clarity.',
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: malefics, house_in: [7], match_mode: 'any', min_planets: 1 } },
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
        scenario: 'partnership_risk',
        outcome_text:
          'Partnership or deal risk may rise. Keeping terms explicit and timelines realistic can reduce misunderstandings and prevent avoidable losses.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'This is a due-diligence signal; clarity is emphasized over speed.',
        },
        point_id: pointId,
      },
    },

    // 6) Sudden loss / shock (8th/12th)
    {
      code: 'SUDDEN_LOSS_SHOCK',
      label: 'Sudden loss/shock: unexpected expenses or abrupt setbacks.',
      condition_tree: {
        planet_in_house: { planet_in: ['RAHU', 'KETU', 'MARS'], house_in: [8, 12], match_mode: 'any', min_planets: 1 },
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'down',
        intensity: 0.85,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'sudden_loss',
        outcome_text:
          'Unexpected setbacks may occur. Consider keeping buffers, reducing over-leverage, and treating new risks as optional rather than necessary.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'medium',
          dominance: 'background',
          certainty_note: 'This is a volatility-style signal; it is kept secondary unless reinforced.',
        },
        point_id: pointId,
      },
    },

    // 7) Transit: malefic activation (short-term risk)
    {
      code: 'TRANSIT_MALEFIC_RISK',
      label: 'Short-term risk: malefics transiting key business houses.',
      scopes: ['hourly', 'daily', 'weekly'],
      condition_tree: {
        all: [
          {
            transit_planet_in_house: {
              planet_in: malefics,
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
        intensity: 0.65,
        tone: 'challenging',
        trigger: 'transit',
        scenario: 'short_term_risk',
        outcome_text:
          'Short-term caution is advised. Double-check budgets, avoid rushed commitments, and keep spend decisions reversible where possible.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'low',
          dominance: 'background',
          certainty_note: 'Time-bound caution is treated as background risk-control guidance.',
        },
        point_id: pointId,
      },
    },

    // 8) Transit: cashflow hit (12th/2nd style via risk houses)
    {
      code: 'TRANSIT_CASHFLOW_HIT',
      label: 'Short-term cashflow hit: expense/loss themes are activated in transits.',
      scopes: ['hourly', 'daily', 'weekly'],
      condition_tree: {
        transit_planet_in_house: {
          planet_in: ['SATURN', 'RAHU', 'KETU'],
          house_in: [12, 2, 8],
          match_mode: 'any',
          min_planets: 1,
        },
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'down',
        intensity: 0.7,
        tone: 'cautious',
        trigger: 'transit',
        scenario: 'cashflow_hit',
        outcome_text:
          'A short-term cashflow dip may be possible. Consider pacing expenses and tightening collections or follow-ups.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'low',
          dominance: 'background',
          certainty_note: 'This is a short-term liquidity note; keep decisions grounded and reversible.',
        },
        point_id: pointId,
      },
    },

    // 9) Dasha adversity: malefic phases
    {
      code: 'DASHA_ADVERSITY',
      label: 'Dasha adversity: malefic dasha phases increase friction, risk and losses.',
      scopes: ['monthly', 'yearly', 'life_theme'],
      condition_tree: {
        any: [
          { dasha_running: { level: 'mahadasha', planet_in: DASHAA_MALEFIC_IDS } },
          { dasha_running: { level: 'antardasha', planet_in: DASHAA_MALEFIC_IDS } },
          { dasha_running: { level: 'pratyantardasha', planet_in: DASHAA_MALEFIC_IDS } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'down',
        intensity: 0.8,
        tone: 'challenging',
        trigger: 'dasha',
        scenario: 'adversity_phase',
        outcome_text:
          'A longer pressure phase may require conservative strategy. You may benefit from strong controls, fewer parallel bets, and steady execution.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'This is framed as longer-term adversity patterns; it guides strategy without making promises.',
        },
        point_id: pointId,
      },
    },

    // 10) Mixed: support exists but risk dominates (risk control needed)
    {
      code: 'SUPPORT_BUT_RISK_DOMINATES',
      label: 'Some support exists, but risk dominates—tight controls and conservative moves are needed.',
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: [...benefics, ...trade], house_in: keyHouses, match_mode: 'any', min_planets: 1 } },
          { planet_in_house: { planet_in: malefics, house_in: riskHouses, match_mode: 'any', min_planets: 1 } },
          { overall_malefic_score: { min: 0.6 } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.7,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'support_with_high_risk',
        outcome_text:
          'Support may exist, but risk remains meaningful. Consider continuing work while tightening budgets, improving documentation, and lowering exposure.',
        variant_meta: {
          tone: 'informational',
          confidence_level: 'medium',
          dominance: 'dominant',
          certainty_note: 'Mixed signals require balance: move forward, but with stricter controls.',
        },
        point_id: pointId,
      },
    },

    // 11) Recovery-with-discipline: Saturn structure + benefic support
    {
      code: 'RECOVERY_WITH_DISCIPLINE',
      label: 'Recovery with discipline: restructuring, cost-control and consistency stabilise outcomes.',
      scopes: ['monthly', 'yearly', 'life_theme'],
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: ['SATURN'], house_in: [6, 10, 11], match_mode: 'any', min_planets: 1 } },
          { overall_benefic_score: { min: 0.6 } },
          { overall_malefic_score: { max: 0.75 } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.6,
        tone: 'cautious',
        trigger: 'natal',
        scenario: 'recovery_with_structure',
        outcome_text:
          'Stability can improve through discipline. Focus on cost control, reliable delivery, and clean execution rather than aggressive expansion.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'This is treated as a resilience pattern—gradual improvement through structure.',
        },
        point_id: pointId,
      },
    },

    // 12) Dasha recovery: benefic phase after adversity (momentum returns gradually)
    {
      code: 'DASHA_RECOVERY_PHASE',
      label: 'Recovery phase: supportive dasha returns; rebuild momentum gradually with prudent strategy.',
      scopes: ['monthly', 'yearly', 'life_theme'],
      condition_tree: {
        any: [
          { dasha_running: { level: 'mahadasha', planet_in: DASHAA_RECOVERY_IDS } },
          { dasha_running: { level: 'antardasha', planet_in: DASHAA_RECOVERY_IDS } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'up',
        intensity: 0.55,
        tone: 'positive',
        trigger: 'dasha',
        scenario: 'recovery_phase',
        outcome_text:
          'Momentum may return gradually. You can rebuild with small wins, steady routines, and conservative commitments until stability feels stronger.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'low',
          dominance: 'background',
          certainty_note: 'This is a recovery signal; it is expressed as gradual and non-guaranteed.',
        },
        point_id: pointId,
      },
    },

    // 13) Relief window (short-term) for stabilizing decisions
    {
      code: 'TRANSIT_RELIEF_WINDOW',
      label: 'Short-term relief: supportive transits reduce pressure and improve decisions.',
      scopes: ['daily', 'weekly'],
      condition_tree: {
        transit_planet_in_house: {
          planet_in: ['JUPITER', 'VENUS'],
          house_in: [2, 11, 10],
          match_mode: 'any',
          min_planets: 1,
        },
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.5,
        tone: 'positive',
        trigger: 'transit',
        scenario: 'relief_window',
        outcome_text:
          'Pressure may ease slightly in the short term. It can be a good time to stabilize operations, tidy finances, and plan calmly.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'low',
          dominance: 'background',
          certainty_note: 'This is time-bound and used mainly to support cleanup and stabilization.',
        },
        point_id: pointId,
      },
    },

    // 14) Risk-control support (structure + buffers)
    {
      code: 'RISK_CONTROL_SUPPORT',
      label: 'Risk-control support: structure helps reduce avoidable losses.',
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: ['SATURN'], house_in: [6, 10], match_mode: 'any', min_planets: 1 } },
          { overall_benefic_score: { min: 0.55 } },
          { overall_malefic_score: { min: 0.5 } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.55,
        tone: 'cautious',
        trigger: 'natal',
        scenario: 'risk_control_support',
        outcome_text:
          'You may be able to reduce losses through structure. Consider documenting decisions, tightening approvals, and reducing impulsive spending.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'This is framed as a mitigation path: structure improves outcomes even when risk is present.',
        },
        point_id: pointId,
      },
    },

    // 15) Peak stress during malefic phase (long-term)
    {
      code: 'DASHA_PEAK_STRESS',
      label: 'Peak stress: higher pressure and stricter controls are recommended.',
      scopes: ['monthly', 'yearly', 'life_theme'],
      condition_tree: {
        all: [
          { overall_malefic_score: { min: 0.75 } },
          { dasha_running: { level: 'mahadasha', planet_in: DASHAA_MALEFIC_IDS } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'down',
        intensity: 0.85,
        tone: 'challenging',
        trigger: 'dasha',
        scenario: 'peak_stress',
        outcome_text:
          'A higher-pressure phase may be active. Consider simplifying priorities, preserving cash, and avoiding optional risk until stability improves.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'high',
          dominance: 'dominant',
          certainty_note: 'Strong pressure signals are combined here, so conservative posture is emphasized.',
        },
        point_id: pointId,
      },
    },

    // 16) Informational baseline (background)
    {
      code: 'LOSS_RISK_INFORMATIONAL_BASELINE',
      label: 'Baseline informational variant for loss-risk context.',
      condition_tree: { generic_condition: { note: 'Loss-risk baseline (background).' } },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.35,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'informational_baseline',
        outcome_text:
          'No single strong risk signal stands out here. It may still help to keep basic controls and avoid unnecessary exposure.',
        variant_meta: {
          tone: 'informational',
          confidence_level: 'low',
          dominance: 'background',
          certainty_note: 'Used as a baseline when stronger loss-risk variants do not match.',
        },
        point_id: pointId,
      },
    },
  ];
}


