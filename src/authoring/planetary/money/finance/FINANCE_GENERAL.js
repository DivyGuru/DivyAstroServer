export function getFINANCE_GENERALVariants() {
  const effectTheme = 'money';
  const area = 'money_finance_personal';
  const pointId = 'FINANCE_GENERAL';

  const inflowHouses = [2, 10, 11];
  const stockHouses = [2, 4, 11];
  const outflowHouses = [12, 6, 8];

  const benefics = ['JUPITER', 'VENUS', 'MOON'];
  const trade = ['MERCURY'];
  const malefics = ['SATURN', 'MARS', 'RAHU', 'KETU'];

  const FIN_SUPPORT_IDS = [2, 5, 6, 4, 1]; // Moon/Jupiter/Venus/Mercury/Sun
  const FIN_PRESSURE_IDS = [7, 3, 8, 9]; // Saturn/Mars/Rahu/Ketu

  return [
    // 1) Dhan / Artha baseline (strong + confirmed)
    {
      code: 'DHAN_YOG_STRONG_CONFIRMED',
      label: 'Dhan/Artha yog: inflow + stock houses supported with nakshatra confirmation.',
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: [...benefics, ...trade], house_in: [...inflowHouses, ...stockHouses], match_mode: 'any', min_planets: 2 } },
          {
            any: [
              { dasha_running: { level: 'mahadasha', planet_in: FIN_SUPPORT_IDS } },
              { dasha_running: { level: 'antardasha', planet_in: FIN_SUPPORT_IDS } },
              { transit_planet_in_house: { planet_in: ['JUPITER', 'VENUS'], house_in: inflowHouses, match_mode: 'any', min_planets: 1 } },
            ],
          },
          {
            any: [
              { planet_in_nakshatra_group: { planet_in: ['JUPITER', 'VENUS', 'MERCURY', 'MOON'], group: { context: 'finance', kind: 'supportive' }, match_mode: 'any', min_planets: 1 } },
              { planet_in_nakshatra_group: { planet_in: ['JUPITER', 'VENUS', 'MERCURY', 'MOON'], group: { context: 'finance', kind: 'neutral' }, match_mode: 'any', min_planets: 1 } },
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
        trigger: 'combined',
        scenario: 'dhan_yog_strong',
        outcome_text:
          'A wealth-support yog is present (Dhan yog). Nakshatra support strengthens this phase. Direction: focus on both inflow and stock-building—prioritize a savings buffer, avoid impulsive spending, and delay high-risk bets.',
        variant_meta: {
          tone: 'opportunity',
          confidence_level: 'high',
          dominance: 'dominant',
          certainty_note: 'Inflow/stock indicators + dasha/transit alignment ke saath nakshatra confirmation present hai.',
        },
        point_id: pointId,
      },
    },

    // 2) Flow strong but stock needs discipline
    {
      code: 'FLOW_STRONG_STOCK_NEEDS_DISCIPLINE',
      label: 'Income flow supported but wealth stock needs structure.',
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: ['SUN', 'MERCURY', 'JUPITER'], house_in: inflowHouses, match_mode: 'any', min_planets: 1 } },
          { planet_in_house: { planet_in: ['SATURN'], house_in: [2, 4], match_mode: 'any', min_planets: 1 } },
          { overall_benefic_score: { min: 0.55 } },
          {
            any: [
              { planet_in_nakshatra_group: { planet_in: ['MERCURY', 'SUN'], group: { context: 'finance', kind: 'supportive' }, match_mode: 'any', min_planets: 1 } },
              { planet_in_nakshatra_group: { planet_in: ['MERCURY', 'SUN'], group: { context: 'finance', kind: 'neutral' }, match_mode: 'any', min_planets: 1 } },
            ],
          },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.7,
        tone: 'mixed',
        trigger: 'combined',
        scenario: 'flow_vs_stock',
        outcome_text:
          'An income-flow yog is present, but stock-building needs discipline. Direction: inflow can be strong, but wealth stock needs budgeting and automation—prioritize “savings first”, avoid lifestyle creep, and delay non-essential upgrades.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'high',
          dominance: 'dominant',
          certainty_note: 'Flow signals strong hain; stock side par Saturn structure requirement dikhata hai; nakshatra confirmation neutral/supportive hai.',
        },
        point_id: pointId,
      },
    },

    // 3) Outflow/leakage sensitivity (12th activation)
    {
      code: 'OUTFLOW_LEAKAGE_SENSITIVE',
      label: 'Outflow/leakage sensitivity: expenses need monitoring.',
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: malefics, house_in: outflowHouses, match_mode: 'any', min_planets: 1 } },
          { overall_malefic_score: { min: 0.6 } },
          {
            any: [
              { planet_in_nakshatra_group: { planet_in: ['SATURN', 'RAHU', 'KETU'], group: { context: 'finance', kind: 'sensitive' }, match_mode: 'any', min_planets: 1 } },
              { planet_in_nakshatra_group: { planet_in: ['SATURN', 'RAHU', 'KETU'], group: { context: 'finance', kind: 'obstructive' }, match_mode: 'any', min_planets: 1 } },
            ],
          },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'down',
        intensity: 0.8,
        tone: 'challenging',
        trigger: 'combined',
        scenario: 'outflow_pressure',
        outcome_text:
          'Expense and leakage pressure may rise. Nakshatra sensitivity reinforces this warning. Direction: outflow-heavy—prioritize weekly cash tracking, avoid rushed purchases, and delay big commitments until buffers are in place.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'high',
          dominance: 'dominant',
          certainty_note: 'Outflow houses + high malefic score ke saath sensitive/obstructive nakshatra classification present hai.',
        },
        point_id: pointId,
      },
    },

    // 4) Daily spending mood (short transit + nakshatra)
    {
      code: 'DAILY_SPENDING_IMPULSE_CAUTION',
      label: 'Daily spending impulsiveness: short-term caution.',
      scopes: ['hourly', 'daily'],
      condition_tree: {
        all: [
          { transit_planet_in_house: { planet_in: ['MARS', 'RAHU'], house_in: [2, 12, 6], match_mode: 'any', min_planets: 1 } },
          {
            any: [
              { transit_planet_in_nakshatra_group: { planet_in: ['MARS', 'RAHU'], group: { context: 'finance', kind: 'sensitive' }, match_mode: 'any', min_planets: 1 } },
              { transit_planet_in_nakshatra_group: { planet_in: ['MARS', 'RAHU'], group: { context: 'finance', kind: 'obstructive' }, match_mode: 'any', min_planets: 1 } },
            ],
          },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'down',
        intensity: 0.55,
        tone: 'challenging',
        trigger: 'transit',
        scenario: 'daily_spend_mood',
        outcome_text:
          'Today, spending mood and risk sensitivity may be higher. Prioritize “pause & review”, avoid impulse spending, and delay high-risk decisions—do not override your monthly direction.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'low',
          dominance: 'background',
          certainty_note: 'Short transit + sensitive nakshatra patterns indicate temporary impulse risk.',
        },
        point_id: pointId,
      },
    },

    // 5) Weekly relief (supportive transit + nakshatra)
    {
      code: 'WEEKLY_RELIEF_FLOW',
      label: 'Weekly relief: short-term cash-flow support.',
      scopes: ['weekly'],
      condition_tree: {
        all: [
          { transit_planet_in_house: { planet_in: ['JUPITER', 'VENUS'], house_in: [2, 11, 10], match_mode: 'any', min_planets: 1 } },
          {
            any: [
              { transit_planet_in_nakshatra_group: { planet_in: ['JUPITER', 'VENUS'], group: { context: 'finance', kind: 'supportive' }, match_mode: 'any', min_planets: 1 } },
              { transit_planet_in_nakshatra_group: { planet_in: ['JUPITER', 'VENUS'], group: { context: 'finance', kind: 'neutral' }, match_mode: 'any', min_planets: 1 } },
            ],
          },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'up',
        intensity: 0.55,
        tone: 'positive',
        trigger: 'transit',
        scenario: 'weekly_relief',
        outcome_text:
          'This week, there may be a cash-flow relief signal. Prioritize pending collections/settlements, avoid over-commitment, and delay unnecessary upgrades to build stability.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'low',
          dominance: 'background',
          certainty_note: 'Weekly transit support with supportive/neutral nakshatra refinement.',
        },
        point_id: pointId,
      },
    },

    // 6) Redirection phase (income source shift)
    {
      code: 'MONEY_REDIRECTION_PHASE',
      label: 'Money redirection: source changes, restructuring, or reprioritization.',
      scopes: ['monthly', 'yearly'],
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: ['RAHU', 'KETU'], house_in: [10, 11, 12], match_mode: 'any', min_planets: 1 } },
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
        scenario: 'redirection',
        outcome_text:
          'Disha: paisa ka rukh redirection phase me ho sakta hai—income source change, restructuring ya priorities shift. Prioritize clarity + buffers, avoid parallel risky bets, delay major commitments jab tak direction settle na ho.',
        variant_meta: {
          tone: 'informational',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'Rahu/Ketu activation suggests redirection/transition patterns; not treated as deterministic loss.',
        },
        point_id: pointId,
      },
    },

    // 7) Vipreet-style recovery (pressure + recovery dasha)
    {
      code: 'VIPREET_RECOVERY_PATTERN',
      label: 'Recovery pattern: pressure exists but reverse-gain potential through discipline.',
      scopes: ['monthly', 'yearly', 'life_theme'],
      condition_tree: {
        all: [
          { overall_malefic_score: { min: 0.55 } },
          {
            any: [
              { dasha_running: { level: 'mahadasha', planet_in: FIN_PRESSURE_IDS } },
              { dasha_running: { level: 'antardasha', planet_in: FIN_PRESSURE_IDS } },
            ],
          },
          { overall_benefic_score: { min: 0.55 } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.6,
        tone: 'mixed',
        trigger: 'dasha',
        scenario: 'vipreet_recovery',
        outcome_text:
          'Vipreet yog jaisa recovery pattern ban sakta hai—pressure ke beech discipline se direction better hoti hai. Prioritize debt cleanup/buffers, avoid emotional spending, delay speculative exposure jab tak stability mature na ho.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'Mixed benefic+malefic signals; framed as recovery-through-discipline, not guaranteed windfall.',
        },
        point_id: pointId,
      },
    },

    // 8) Multi-year wealth direction supportive (life_theme)
    {
      code: 'LONG_TERM_WEALTH_DIRECTION_SUPPORT',
      label: 'Long-term direction: wealth-building supports when sustained.',
      scopes: ['yearly', 'life_theme'],
      condition_tree: {
        all: [
          { overall_benefic_score: { min: 0.65 } },
          { planet_in_house: { planet_in: ['JUPITER', 'VENUS'], house_in: stockHouses, match_mode: 'any', min_planets: 1 } },
          {
            any: [
              { planet_in_nakshatra_group: { planet_in: ['JUPITER', 'VENUS'], group: { context: 'finance', kind: 'supportive' }, match_mode: 'any', min_planets: 1 } },
              { planet_in_nakshatra_group: { planet_in: ['JUPITER', 'VENUS'], group: { context: 'finance', kind: 'neutral' }, match_mode: 'any', min_planets: 1 } },
            ],
          },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'up',
        intensity: 0.6,
        tone: 'positive',
        trigger: 'natal',
        scenario: 'long_term_wealth',
        outcome_text:
          'A wealth-and-savings yog is present. Nakshatra support strengthens the long-term wealth direction. Prioritize systematic, risk-appropriate investing, avoid frequent churn, and delay speculative over-allocation.',
        variant_meta: {
          tone: 'opportunity',
          confidence_level: 'medium',
          dominance: 'background',
          certainty_note: 'Long-term stock-building indicators supported; guidance stays range-based and non-absolute.',
        },
        point_id: pointId,
      },
    },

    // 9) Monthly consolidation (stabilizing)
    {
      code: 'MONTHLY_CONSOLIDATION_PHASE',
      label: 'Monthly consolidation: stabilize flow, reduce leakage, set buffers.',
      scopes: ['monthly'],
      condition_tree: {
        all: [
          { overall_benefic_score: { min: 0.55 } },
          { overall_malefic_score: { min: 0.5 } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.5,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'consolidation',
        outcome_text:
          'Is mahine consolidation best rahega. Disha: inflow vs outflow ko align karein—prioritize budgeting + buffers, avoid new liabilities, delay big purchases unless essential.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'low',
          dominance: 'background',
          certainty_note: 'Used as a stabilizing monthly posture under mixed conditions.',
        },
        point_id: pointId,
      },
    },

    // 10) Yearly direction: stability focus
    {
      code: 'YEARLY_STABILITY_DIRECTION',
      label: 'Yearly direction: stability-first year.',
      scopes: ['yearly'],
      condition_tree: {
        all: [
          { overall_malefic_score: { min: 0.55 } },
          { overall_benefic_score: { min: 0.5 } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.5,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'yearly_stability',
        outcome_text:
          'Is varsh financial direction stability-first rahega. Prioritize safety net, avoid over-leverage, delay aggressive expansion—phir bhi steady progress possible hai.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'low',
          dominance: 'background',
          certainty_note: 'Yearly posture guidance; does not contradict month/week signals.',
        },
        point_id: pointId,
      },
    },

    // 11) Sensitive nakshatra delays a forming yog
    {
      code: 'YOG_DELAY_BY_NAKSHATRA_SENSITIVITY',
      label: 'Forming yog delayed: nakshatra sensitivity suggests pacing.',
      scopes: ['monthly', 'yearly'],
      condition_tree: {
        all: [
          { overall_benefic_score: { min: 0.55 } },
          { planet_in_house: { planet_in: ['JUPITER', 'VENUS'], house_in: inflowHouses, match_mode: 'any', min_planets: 1 } },
          {
            any: [
              { planet_in_nakshatra_group: { planet_in: ['JUPITER', 'VENUS'], group: { context: 'finance', kind: 'sensitive' }, match_mode: 'any', min_planets: 1 } },
              { planet_in_nakshatra_group: { planet_in: ['JUPITER', 'VENUS'], group: { context: 'finance', kind: 'obstructive' }, match_mode: 'any', min_planets: 1 } },
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
        scenario: 'delay_by_nakshatra',
        outcome_text:
          'Support is present, but it may not be fully strong—nakshatra sensitivity suggests delay/zig-zag is possible. Prioritize buffers, avoid rushed investments, and delay big commitments until flow is stable.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'Positive signals exist but nakshatra sensitivity indicates pacing/delay rather than clean activation.',
        },
        point_id: pointId,
      },
    },

    // 12) Dasha pressure: stabilize
    {
      code: 'DASHA_PRESSURE_STABILIZE',
      label: 'Dasha pressure: stabilize and reduce downside.',
      scopes: ['monthly', 'yearly', 'life_theme'],
      condition_tree: {
        all: [
          {
            any: [
              { dasha_running: { level: 'mahadasha', planet_in: FIN_PRESSURE_IDS } },
              { dasha_running: { level: 'antardasha', planet_in: FIN_PRESSURE_IDS } },
              { dasha_running: { level: 'pratyantardasha', planet_in: FIN_PRESSURE_IDS } },
            ],
          },
          { overall_malefic_score: { min: 0.6 } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'down',
        intensity: 0.65,
        tone: 'challenging',
        trigger: 'dasha',
        scenario: 'dasha_pressure',
        outcome_text:
          'With dasha pressure, expense and risk sensitivity can rise. Prioritize debt-control + liquidity, avoid leverage, and delay speculative bets; discipline can improve stability over time.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'Malefic dasha alignment with elevated malefic score; framed as risk-control.',
        },
        point_id: pointId,
      },
    },

    // 13) Supportive dasha: steady improvement
    {
      code: 'DASHA_SUPPORT_STEADY_IMPROVE',
      label: 'Supportive dasha: steady improvement in flow and savings.',
      scopes: ['monthly', 'yearly', 'life_theme'],
      condition_tree: {
        all: [
          {
            any: [
              { dasha_running: { level: 'mahadasha', planet_in: FIN_SUPPORT_IDS } },
              { dasha_running: { level: 'antardasha', planet_in: FIN_SUPPORT_IDS } },
            ],
          },
          { overall_benefic_score: { min: 0.6 } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'up',
        intensity: 0.6,
        tone: 'positive',
        trigger: 'dasha',
        scenario: 'supportive_dasha',
        outcome_text:
          'An income-and-savings yog is present, and this phase can support steady improvement. Prioritize systematic saving/investing, avoid unnecessary churn, and delay high-risk exposure.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'Supportive dasha with solid benefic score; framed as steady, not instant.',
        },
        point_id: pointId,
      },
    },

    // 14) Weekly cash-flow pressure vs relief (non-contradictory)
    {
      code: 'WEEKLY_CASHFLOW_BALANCE',
      label: 'Weekly cash-flow balance: focus on essentials and timing of payments.',
      scopes: ['weekly'],
      condition_tree: {
        all: [
          { overall_malefic_score: { min: 0.55 } },
          { overall_benefic_score: { min: 0.5 } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.45,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'weekly_balance',
        outcome_text:
          'This week, balancing cash flow is important. Prioritize essentials + due dates, avoid impulsive spending, and delay high-risk decisions—this short-term guidance does not override monthly/yearly direction.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'low',
          dominance: 'background',
          certainty_note: 'Weekly guidance derived from mixed baseline; kept non-contradictory to higher timeframes.',
        },
        point_id: pointId,
      },
    },

    // 15) Baseline informational
    {
      code: 'FINANCE_GENERAL_INFORMATIONAL_BASELINE',
      label: 'Baseline informational variant for finance-general.',
      condition_tree: { generic_condition: { note: 'Finance general baseline.' } },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.35,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'baseline',
        outcome_text:
          'No single strong signal stands out. Keep flow vs stock separate—prioritize cash tracking + buffers, avoid impulsive decisions, and delay high-risk exposure until clarity improves.',
        variant_meta: {
          tone: 'informational',
          confidence_level: 'low',
          dominance: 'background',
          certainty_note: 'Baseline used when stronger finance-general variants do not match.',
        },
        point_id: pointId,
      },
    },
  ];
}


