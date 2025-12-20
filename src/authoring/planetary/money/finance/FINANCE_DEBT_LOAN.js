export function getFINANCE_DEBT_LOANVariants() {
  const effectTheme = 'money';
  const area = 'money_finance_personal';
  const pointId = 'FINANCE_DEBT_LOAN';

  const debtHouses = [6, 8, 12, 2];
  const reliefHouses = [2, 10, 11];

  const malefics = ['SATURN', 'MARS', 'RAHU', 'KETU'];
  const benefics = ['JUPITER', 'VENUS', 'MOON'];
  const trade = ['MERCURY'];

  const PRESSURE_IDS = [7, 3, 8, 9];
  const SUPPORT_IDS = [2, 5, 6, 4, 1];

  return [
    // 1) High debt pressure (confirmed)
    {
      code: 'DEBT_PRESSURE_HIGH_CONFIRMED',
      label: 'Debt/loan pressure high: obligations + nakshatra sensitivity.',
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: malefics, house_in: debtHouses, match_mode: 'any', min_planets: 1 } },
          { overall_malefic_score: { min: 0.75 } },
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
        intensity: 0.85,
        tone: 'challenging',
        trigger: 'combined',
        scenario: 'debt_pressure_high',
        outcome_text:
          'Debt/loan pressure can be sensitive in this phase. Nakshatra sensitivity reinforces this warning. Prioritize a repayment plan + interest control, avoid new debt, and delay leverage-based decisions.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'high',
          dominance: 'dominant',
          certainty_note: 'Debt houses + high malefic score with sensitive/obstructive nakshatra refinement.',
        },
        point_id: pointId,
      },
    },

    // 2) Consolidation opportunity (structure + benefic support)
    {
      code: 'DEBT_CONSOLIDATION_SUPPORT',
      label: 'Debt consolidation support: structure + relief.',
      scopes: ['monthly', 'yearly'],
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: ['SATURN'], house_in: [6, 2], match_mode: 'any', min_planets: 1 } },
          { overall_benefic_score: { min: 0.6 } },
          { overall_malefic_score: { max: 0.75 } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.65,
        tone: 'cautious',
        trigger: 'natal',
        scenario: 'consolidation',
        outcome_text:
          'A restructuring/consolidation yog may be present (planning-dependent). Prioritize clarity + documentation, avoid impulsive borrowing, and delay discretionary spending until a repayment rhythm is stable.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'Structure + moderate support indicates consolidation feasibility, not guaranteed approval.',
        },
        point_id: pointId,
      },
    },

    // 3) Relief via income flow (2/10/11)
    {
      code: 'DEBT_RELIEF_VIA_INFLOW',
      label: 'Debt relief via inflow: repayment becomes easier with earnings support.',
      scopes: ['monthly', 'yearly'],
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: [...benefics, ...trade], house_in: reliefHouses, match_mode: 'any', min_planets: 1 } },
          { overall_benefic_score: { min: 0.6 } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'up',
        intensity: 0.6,
        tone: 'positive',
        trigger: 'natal',
        scenario: 'relief_inflow',
        outcome_text:
          'A debt-relief yog is present (inflow-dependent). Prioritize repayment + buffer, avoid lifestyle creep, and delay new liabilities until the debt ratio improves.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'Relief houses supported by benefics/trade planets; repayment strategy emphasized.',
        },
        point_id: pointId,
      },
    },

    // 4) Legal/penalty risk (6/8 emphasis)
    {
      code: 'DEBT_DISPUTE_RISK',
      label: 'Debt dispute/penalty risk: documentation and caution needed.',
      condition_tree: {
        planet_in_house: { planet_in: ['MARS', 'SATURN', 'RAHU'], house_in: [6, 8], match_mode: 'any', min_planets: 1 },
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'down',
        intensity: 0.7,
        tone: 'challenging',
        trigger: 'natal',
        scenario: 'dispute_risk',
        outcome_text:
          'Friction risk around debt/terms may increase. Prioritize documentation + timelines, avoid rushed signing, and delay new borrowing until clarity improves.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: '6/8 activation suggests disputes/penalty sensitivity; clarity reduces risk.',
        },
        point_id: pointId,
      },
    },

    // 5) Dasha pressure phase
    {
      code: 'DASHA_DEBT_PRESSURE',
      label: 'Dasha pressure: debt feels heavier; protect liquidity.',
      scopes: ['monthly', 'yearly', 'life_theme'],
      condition_tree: {
        all: [
          {
            any: [
              { dasha_running: { level: 'mahadasha', planet_in: PRESSURE_IDS } },
              { dasha_running: { level: 'antardasha', planet_in: PRESSURE_IDS } },
              { dasha_running: { level: 'pratyantardasha', planet_in: PRESSURE_IDS } },
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
          'With dasha pressure, debt can feel heavier. Prioritize liquidity + a repayment plan, avoid new debt, and delay leverage-based investments.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'Malefic dasha alignment increases debt-pressure sensitivity.',
        },
        point_id: pointId,
      },
    },

    // 6) Dasha support for cleanup
    {
      code: 'DASHA_DEBT_CLEANUP_SUPPORT',
      label: 'Supportive dasha: cleanup and repayment rhythm improves.',
      scopes: ['monthly', 'yearly', 'life_theme'],
      condition_tree: {
        all: [
          {
            any: [
              { dasha_running: { level: 'mahadasha', planet_in: SUPPORT_IDS } },
              { dasha_running: { level: 'antardasha', planet_in: SUPPORT_IDS } },
            ],
          },
          { overall_benefic_score: { min: 0.55 } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.55,
        tone: 'positive',
        trigger: 'dasha',
        scenario: 'cleanup_support',
        outcome_text:
          'A debt-management/cleanup yog is present (discipline-dependent). Prioritize repayment automation, avoid new liabilities, and delay non-essential upgrades until progress is visible.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'background',
          certainty_note: 'Supportive dasha + moderate benefic score supports cleanup posture.',
        },
        point_id: pointId,
      },
    },

    // 7) Weekly caution for borrowing
    {
      code: 'WEEKLY_BORROWING_CAUTION',
      label: 'Weekly caution: avoid fresh borrowing decisions.',
      scopes: ['weekly'],
      condition_tree: {
        transit_planet_in_house: { planet_in: ['SATURN', 'MARS', 'RAHU'], house_in: [6, 8, 12, 2], match_mode: 'any', min_planets: 1 },
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'down',
        intensity: 0.5,
        tone: 'challenging',
        trigger: 'transit',
        scenario: 'weekly_caution',
        outcome_text:
          'This week, keep extra caution around borrowing/loan decisions. Prioritize review + documentation, avoid rushed approvals, and delay new liabilities.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'low',
          dominance: 'background',
          certainty_note: 'Weekly transit suggests short-term caution around obligations.',
        },
        point_id: pointId,
      },
    },

    // 8) Weekly relief
    {
      code: 'WEEKLY_RELIEF_SUPPORT',
      label: 'Weekly relief: small cleanup steps help.',
      scopes: ['weekly'],
      condition_tree: {
        transit_planet_in_house: { planet_in: ['JUPITER', 'VENUS'], house_in: [2, 10, 11], match_mode: 'any', min_planets: 1 },
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.45,
        tone: 'positive',
        trigger: 'transit',
        scenario: 'weekly_relief',
        outcome_text:
          'This week may support repayment/cleanup steps. Prioritize small repayments + budgeting, avoid new debt, and delay non-essential spending.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'low',
          dominance: 'background',
          certainty_note: 'Short supportive transits; good for cleanup, not big risk-taking.',
        },
        point_id: pointId,
      },
    },

    // 9) Mixed signals
    {
      code: 'DEBT_MIXED_SIGNALS',
      label: 'Mixed: relief potential exists but pressure still active.',
      scopes: ['monthly'],
      condition_tree: { all: [{ overall_benefic_score: { min: 0.55 } }, { overall_malefic_score: { min: 0.55 } }] },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.55,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'mixed',
        outcome_text:
          'Relief aur pressure dono active ho sakte hain. Prioritize repayment + buffers, avoid over-confidence, delay risky moves until stability improves.',
        variant_meta: {
          tone: 'informational',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'Mixed environment; balanced posture recommended.',
        },
        point_id: pointId,
      },
    },

    // 10) Sensitive nakshatra delays relief
    {
      code: 'RELIEF_DELAY_BY_NAKSHATRA',
      label: 'Relief delayed: nakshatra sensitivity indicates pacing.',
      scopes: ['monthly'],
      condition_tree: {
        all: [
          { overall_benefic_score: { min: 0.55 } },
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
        trend: 'mixed',
        intensity: 0.55,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'delay',
        outcome_text:
          'Support is present, but it may not be fully strong—nakshatra sensitivity suggests relief can be delayed. Prioritize patience + planning, avoid new debt, and delay leverage until clarity improves.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'medium',
          dominance: 'background',
          certainty_note: 'Nakshatra sensitivity indicates pacing even when some support exists.',
        },
        point_id: pointId,
      },
    },

    // 11) High benefic baseline
    {
      code: 'DEBT_HIGH_BENEFIC_BASELINE',
      label: 'Broad supportive baseline for debt management.',
      condition_tree: { overall_benefic_score: { min: 0.7 } },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.4,
        tone: 'positive',
        trigger: 'natal',
        scenario: 'benefic_baseline',
        outcome_text:
          'Debt management manageable ho sakta hai. Prioritize repayment discipline, avoid new liabilities, delay risky exposure.',
        variant_meta: { tone: 'stabilizing', confidence_level: 'low', dominance: 'background', certainty_note: 'Broad supportive baseline; not a guarantee.' },
        point_id: pointId,
      },
    },

    // 12) High malefic baseline
    {
      code: 'DEBT_HIGH_MALEFIC_BASELINE',
      label: 'Broad caution baseline: protect liquidity.',
      condition_tree: { overall_malefic_score: { min: 0.7 } },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'down',
        intensity: 0.4,
        tone: 'challenging',
        trigger: 'natal',
        scenario: 'malefic_baseline',
        outcome_text:
          'Liquidity protection priority rahegi. Avoid new debt, delay leverage, prioritize essentials + buffers.',
        variant_meta: { tone: 'cautionary', confidence_level: 'low', dominance: 'background', certainty_note: 'Broad malefic baseline; used as background caution.' },
        point_id: pointId,
      },
    },

    // 13) Daily discipline
    {
      code: 'DAILY_DEBT_DISCIPLINE',
      label: 'Daily discipline: avoid impulsive borrowing/spends.',
      scopes: ['daily'],
      condition_tree: { generic_condition: { note: 'Daily debt discipline posture.' } },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.35,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'daily_posture',
        outcome_text:
          'Today, maintain discipline: avoid impulse buys/borrowing, prioritize essential payments, and delay high-stakes decisions.',
        variant_meta: { tone: 'informational', confidence_level: 'low', dominance: 'background', certainty_note: 'Daily posture guidance.' },
        point_id: pointId,
      },
    },

    // 14) Monthly repayment focus
    {
      code: 'MONTHLY_REPAYMENT_FOCUS',
      label: 'Monthly focus: repayment rhythm and documentation.',
      scopes: ['monthly'],
      condition_tree: { generic_condition: { note: 'Monthly repayment focus posture.' } },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.35,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'monthly_posture',
        outcome_text:
          'Is mahine repayment rhythm set karna best rahega. Prioritize documentation + autopay, avoid new liabilities, delay major spends.',
        variant_meta: { tone: 'stabilizing', confidence_level: 'low', dominance: 'background', certainty_note: 'Monthly posture guidance.' },
        point_id: pointId,
      },
    },

    // 15) Informational baseline
    {
      code: 'DEBT_INFORMATIONAL_BASELINE',
      label: 'Baseline informational variant for debt/loan.',
      condition_tree: { generic_condition: { note: 'Debt/loan baseline.' } },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.35,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'baseline',
        outcome_text:
          'No single strong debt signal stands out. Prioritize liquidity + documentation, avoid new debt, and delay leverage until clarity improves.',
        variant_meta: { tone: 'informational', confidence_level: 'low', dominance: 'background', certainty_note: 'Baseline used when stronger debt variants do not match.' },
        point_id: pointId,
      },
    },
  ];
}


