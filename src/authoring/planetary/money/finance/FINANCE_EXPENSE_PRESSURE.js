export function getFINANCE_EXPENSE_PRESSUREVariants() {
  const effectTheme = 'money';
  const area = 'money_finance_personal';
  const pointId = 'FINANCE_EXPENSE_PRESSURE';

  const outflowHouses = [12, 6, 8, 2];
  const inflowHouses = [2, 10, 11];

  const malefics = ['SATURN', 'MARS', 'RAHU', 'KETU'];
  const benefics = ['JUPITER', 'VENUS', 'MOON'];
  const trade = ['MERCURY'];

  const PRESSURE_IDS = [7, 3, 8, 9];
  const SUPPORT_IDS = [2, 5, 6, 4, 1];

  return [
    // 1) High expense pressure (confirmed)
    {
      code: 'EXPENSE_PRESSURE_HIGH_CONFIRMED',
      label: 'High expense pressure: outflow activation + nakshatra sensitivity.',
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: malefics, house_in: outflowHouses, match_mode: 'any', min_planets: 1 } },
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
        scenario: 'high_outflow',
        outcome_text:
          'Expense pressure may be higher. Nakshatra sensitivity reinforces this phase. Direction: outflow—prioritize budget caps + weekly tracking, avoid new liabilities, and delay big purchases until pressure eases.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'high',
          dominance: 'dominant',
          certainty_note: 'Outflow activation + high malefic score with sensitive/obstructive nakshatra refinement.',
        },
        point_id: pointId,
      },
    },

    // 2) Cash leakage (12th + 2nd)
    {
      code: 'CASH_LEAKAGE_PATTERN',
      label: 'Cash leakage: expenses rise quietly; tighten approvals.',
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
        intensity: 0.75,
        tone: 'challenging',
        trigger: 'natal',
        scenario: 'leakage',
        outcome_text:
          'Leakage pattern ban sakta hai—small spends add up. Prioritize expense approvals + subscriptions audit, avoid lifestyle creep, delay optional commitments.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'high',
          dominance: 'dominant',
          certainty_note: '12th/2nd outflow signature suggests silent leakage and cash discipline need.',
        },
        point_id: pointId,
      },
    },

    // 3) Obligations pressure (6th)
    {
      code: 'OBLIGATION_PRESSURE',
      label: 'Obligations pressure: recurring costs/dues.',
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: ['SATURN', 'MARS', 'RAHU'], house_in: [6], match_mode: 'any', min_planets: 1 } },
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
        scenario: 'obligations',
        outcome_text:
          'Obligations/dues ka pressure badh sakta hai. Prioritize essentials + renegotiation, avoid new liabilities, delay discretionary spending until load reduces.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: '6th-house pressure indicates obligations impacting cash flow.',
        },
        point_id: pointId,
      },
    },

    // 4) Shock expense risk (8th)
    {
      code: 'SHOCK_EXPENSE_RISK',
      label: 'Shock expense risk: keep buffers ready.',
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: ['RAHU', 'KETU', 'MARS'], house_in: [8], match_mode: 'any', min_planets: 1 } },
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
        scenario: 'shock_expense',
        outcome_text:
          'Sudden expenses ka risk badh sakta hai. Prioritize emergency buffer + insurance hygiene, avoid over-leverage, delay high-risk investments in this phase.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: '8th-house shock pattern suggests buffer-first approach.',
        },
        point_id: pointId,
      },
    },

    // 5) Daily impulse spend caution
    {
      code: 'DAILY_SPEND_CAUTION',
      label: 'Daily spending caution: temporary impulse risk.',
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
        intensity: 0.5,
        tone: 'challenging',
        trigger: 'transit',
        scenario: 'daily_impulse',
        outcome_text:
          'Today, spending impulses may increase. Prioritize essentials only, avoid impulse buys, and delay big decisions—follow monthly budget discipline.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'low',
          dominance: 'background',
          certainty_note: 'Short transit + sensitive nakshatra indicates temporary impulse risk.',
        },
        point_id: pointId,
      },
    },

    // 6) Weekly outflow peak
    {
      code: 'WEEKLY_OUTFLOW_PEAK',
      label: 'Weekly outflow peak: tighten spending controls.',
      scopes: ['weekly'],
      condition_tree: {
        transit_planet_in_house: { planet_in: ['SATURN', 'MARS'], house_in: [12, 6, 8], match_mode: 'any', min_planets: 1 },
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'down',
        intensity: 0.55,
        tone: 'challenging',
        trigger: 'transit',
        scenario: 'weekly_outflow',
        outcome_text:
          'This week, spending control is important. Prioritize budget caps, avoid non-essential commitments, and delay discretionary purchases.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'low',
          dominance: 'background',
          certainty_note: 'Weekly transit suggests short-term spending pressure.',
        },
        point_id: pointId,
      },
    },

    // 7) Dasha pressure (expenses)
    {
      code: 'DASHA_EXPENSE_PRESSURE',
      label: 'Dasha pressure: expenses and obligations feel heavier.',
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
          'With dasha pressure, expenses/obligations can feel heavier. Prioritize essentials + buffers, avoid leverage, and delay high-risk exposure.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'Malefic dasha alignment indicates sustained expense pressure.',
        },
        point_id: pointId,
      },
    },

    // 8) Dasha support (expense stabilization)
    {
      code: 'DASHA_EXPENSE_STABILIZE',
      label: 'Dasha support: expenses stabilize with planning.',
      scopes: ['monthly', 'yearly'],
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
        intensity: 0.5,
        tone: 'positive',
        trigger: 'dasha',
        scenario: 'stabilize',
        outcome_text:
          'A stabilization yog for expenses is present (planning-dependent). Prioritize budgeting + automation, avoid ad-hoc spending, and delay non-essential upgrades.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'background',
          certainty_note: 'Supportive dasha + benefic score indicates stabilization potential.',
        },
        point_id: pointId,
      },
    },

    // 9) Mixed: inflow present but outflow rising
    {
      code: 'MIXED_INFLOW_OUTFLOW',
      label: 'Mixed: inflow exists but outflow rising; protect net.',
      scopes: ['monthly'],
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: [...benefics, ...trade], house_in: inflowHouses, match_mode: 'any', min_planets: 1 } },
          { planet_in_house: { planet_in: malefics, house_in: outflowHouses, match_mode: 'any', min_planets: 1 } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.6,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'mixed_flow',
        outcome_text:
          'Both inflow and outflow may be active. Direction: protect net—prioritize expense caps + buffers, avoid over-commitment, and delay luxury spending.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'Both inflow and outflow indicators appear together; net protection emphasized.',
        },
        point_id: pointId,
      },
    },

    // 10) Sensitive nakshatra slows relief
    {
      code: 'RELIEF_SLOWED_BY_NAKSHATRA',
      label: 'Relief slowed: nakshatra sensitivity indicates pacing.',
      scopes: ['monthly'],
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
        intensity: 0.55,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'slow_relief',
        outcome_text:
          'Support is present, but it may not be fully strong—nakshatra sensitivity suggests relief can be slower. Prioritize discipline, avoid rushed commitments, and delay big spending until pressure clearly eases.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'Positive signals exist but sensitive/obstructive nakshatra indicates pacing.',
        },
        point_id: pointId,
      },
    },

    // 11) Outflow due to family responsibility (2/4/12)
    {
      code: 'FAMILY_OUTFLOW_LOAD',
      label: 'Family responsibility outflow load: budgeting needed.',
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: ['SATURN', 'RAHU', 'KETU'], house_in: [4, 12, 2], match_mode: 'any', min_planets: 1 } },
          { overall_malefic_score: { min: 0.55 } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'down',
        intensity: 0.6,
        tone: 'challenging',
        trigger: 'natal',
        scenario: 'family_outflow',
        outcome_text:
          'Family-side outflow load badh sakta hai. Prioritize planned spending + buffers, avoid sudden big purchases, delay non-essential commitments.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'background',
          certainty_note: 'Home/expense house activation indicates planned budgeting needs.',
        },
        point_id: pointId,
      },
    },

    // 12) High benefic baseline (background)
    {
      code: 'EXPENSE_HIGH_BENEFIC_BASELINE',
      label: 'Broad supportive baseline to manage expenses.',
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
          'Expense control manageable ho sakta hai. Prioritize budgeting discipline, avoid complacency, delay non-essential upgrades.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'low',
          dominance: 'background',
          certainty_note: 'Broad supportive baseline; does not imply absence of expenses.',
        },
        point_id: pointId,
      },
    },

    // 13) High malefic baseline (background)
    {
      code: 'EXPENSE_HIGH_MALEFIC_BASELINE',
      label: 'Broad caution baseline: protect cash.',
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
          'Cash protection priority rahegi. Prioritize essential spends only, avoid new liabilities, delay big purchases.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'low',
          dominance: 'background',
          certainty_note: 'Broad malefic baseline; used as background caution.',
        },
        point_id: pointId,
      },
    },

    // 14) Monthly stabilization
    {
      code: 'MONTHLY_EXPENSE_STABILIZATION',
      label: 'Monthly stabilization: tighten and simplify.',
      scopes: ['monthly'],
      condition_tree: { generic_condition: { note: 'Monthly expense stabilization guidance.' } },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.4,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'monthly_stabilization',
        outcome_text:
          'This month, simplifying and controlling expenses may be best. Prioritize caps + tracking, avoid impulse spending, and delay big decisions.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'low',
          dominance: 'background',
          certainty_note: 'Monthly posture guidance; complements higher-level signals.',
        },
        point_id: pointId,
      },
    },

    // 15) Informational baseline
    {
      code: 'EXPENSE_INFORMATIONAL_BASELINE',
      label: 'Baseline informational variant for expense pressure.',
      condition_tree: { generic_condition: { note: 'Expense pressure baseline.' } },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.35,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'baseline',
        outcome_text:
          'No single strong expense signal stands out. Prioritize tracking + buffers, avoid over-commitment, and delay discretionary spending until clarity improves.',
        variant_meta: {
          tone: 'informational',
          confidence_level: 'low',
          dominance: 'background',
          certainty_note: 'Baseline used when stronger expense-pressure variants do not match.',
        },
        point_id: pointId,
      },
    },
  ];
}


