// Problem Taxonomy (Config Layer)
// Theme → Subtype → Points
// Single source of truth for life problems / focus areas.

// Common defaults
const DEFAULT_SCOPES = ['hourly', 'daily', 'weekly', 'monthly', 'yearly', 'life_theme'];
const ALLOWED_OPERATIONS = [
  'setPlanetaryConditions',
  'refinePlanetaryConditions',
  'setRemedies',
  'refineRemedies',
];

/**
 * Factory for a single taxonomy point.
 *
 * Polarity:   'positive' | 'negative' | 'mixed' | 'neutral'
 * Kind:       'problem' | 'achievement' | 'event' | 'state'
 */
function makePoint(options) {
  const {
    id,
    theme,
    subtype,
    label,
    description,
    defaultScopes = DEFAULT_SCOPES,
    polarity = 'neutral',
    kind = 'state',
    astroHints = null,
    version = 1,
    deprecated = false,
    replacementId = null,
    tags = [],
  } = options;

  return {
    id,
    theme,
    subtype,
    label,
    description,
    defaultScopes,
    allowedOperations: ALLOWED_OPERATIONS,
    polarity,
    kind,
    astroHints,
    version,
    deprecated,
    replacementId,
    tags,
  };
}

// ===== THEMES =====
export const THEMES = {
  MONEY_FINANCE: 'money_finance',
  CAREER_DIRECTION: 'career_direction',
  RELATIONSHIPS: 'relationships',
  FAMILY_HOME: 'family_home',
  HEALTH_BODY: 'health_body',
  MENTAL_STATE: 'mental_state',
  SPIRITUAL_GROWTH: 'spiritual_growth',
  TIMING_LUCK: 'timing_luck',
  EVENTS_CHANGES: 'events_changes',
  SELF_IDENTITY: 'self_identity',
};

// ===== SUBTYPES =====
export const SUBTYPES = {
  [THEMES.MONEY_FINANCE]: {
    BUSINESS: 'money_business',
    JOB_INCOME: 'money_job_income',
    BASIC_STABILITY: 'money_basic_stability',
    WEALTH_GROWTH: 'money_wealth_growth',
    SOURCE_OF_EARNINGS: 'source_of_earnings',
    PERSONAL_FINANCE: 'finance_personal',
  },
  [THEMES.CAREER_DIRECTION]: {
    CAREER_GROWTH: 'career_growth',
    CAREER_CHANGE: 'career_change',
    WORK_STRESS: 'work_stress',
    EDUCATION: 'education',
    CAREER_SOLUTION: 'career_solution',
    CAREER_SUBJECT_CHOICE: 'career_subject_choice',
    JOB_NATURE: 'job_nature',
  },
  [THEMES.RELATIONSHIPS]: {
    LOVE: 'rel_love',
    MARRIAGE_PARTNER: 'rel_marriage_partner',
    FAMILY_RELATIONS: 'rel_family_relations',
    SOCIAL_CONNECTIONS: 'rel_social_connections',
    PARTNER_LOYALTY: 'partner_loyalty',
  },
  [THEMES.FAMILY_HOME]: {
    PARENTS: 'family_parents',
    CHILDREN: 'family_children',
    HOME_ENVIRONMENT: 'family_home_environment',
    FAMILY_PROPERTY_HOME: 'family_property_home',
  },
  [THEMES.HEALTH_BODY]: {
    BODY_ENERGY: 'health_body_energy',
    ILLNESS_RECOVERY: 'health_illness_recovery',
    LIFESTYLE_BALANCE: 'health_lifestyle_balance',
    CRITICAL_HEALTH: 'critical_health',
    WELL_BEING: 'health_wellbeing',
  },
  [THEMES.MENTAL_STATE]: {
    STRESS_ANXIETY: 'mind_stress_anxiety',
    CONFIDENCE_CLARITY: 'mind_confidence_clarity',
    EMOTIONAL_HEALING: 'mind_emotional_healing',
  },
  [THEMES.SPIRITUAL_GROWTH]: {
    SADHANA: 'spirit_sadhana',
    FAITH_CRISIS: 'spirit_faith_crisis',
    PURPOSE_MEANING: 'spirit_purpose_meaning',
  },
  [THEMES.TIMING_LUCK]: {
    GOOD_PERIOD: 'time_good_period',
    CHALLENGE_PERIOD: 'time_challenge_period',
    TURNING_POINTS: 'time_turning_points',
  },
  [THEMES.EVENTS_CHANGES]: {
    TRAVEL_MOVE: 'event_travel_move',
    EDUCATION_EXAMS: 'event_education_exams',
    LEGAL_CONFLICTS: 'event_legal_conflicts',
    LOSS_GRIEF: 'event_loss_grief',
  },
  [THEMES.SELF_IDENTITY]: {
    SELF_WORTH: 'self_self_worth',
    EXPRESSION: 'self_expression',
    BOUNDARIES: 'self_boundaries',
  },
};

// ===== POINTS =====
// THEME 1: MONEY_FINANCE – धन / पैसे / वित्त
const MONEY_BUSINESS_GENERAL = makePoint({
  id: 'MONEY_BUSINESS_GENERAL',
  theme: THEMES.MONEY_FINANCE,
  subtype: SUBTYPES[THEMES.MONEY_FINANCE].BUSINESS,
  label: 'सामान्य व्यापार सफलता / समर्थन',
  description: 'व्यापार में overall support vs challenge की स्थिति।',
  polarity: 'mixed',
  kind: 'state',
  astroHints: {
    houses: [2, 7, 10, 11],
    keyPlanets: ['JUPITER', 'VENUS', 'MERCURY'],
    relatedYogas: ['DHAN_YOGA', 'RAJ_YOGA'],
  },
  tags: ['money', 'business', 'support'],
});

const MONEY_BUSINESS_START = makePoint({
  id: 'MONEY_BUSINESS_START',
  theme: THEMES.MONEY_FINANCE,
  subtype: SUBTYPES[THEMES.MONEY_FINANCE].BUSINESS,
  label: 'नया व्यापार शुरू करने की स्थिति',
  description: 'नया business शुरू करने के लिए अच्छा / चुनौतीपूर्ण समय।',
});

const MONEY_BUSINESS_GROWTH_WIN = makePoint({
  id: 'MONEY_BUSINESS_GROWTH_WIN',
  theme: THEMES.MONEY_FINANCE,
  subtype: SUBTYPES[THEMES.MONEY_FINANCE].BUSINESS,
  label: 'व्यापार में growth / जीत वाला phase',
  description: 'business में बढ़िया growth, profit और जीत वाला phase।',
  polarity: 'positive',
  kind: 'achievement',
  tags: ['money', 'business', 'growth', 'win'],
});

const MONEY_BUSINESS_LOSS_RISK = makePoint({
  id: 'MONEY_BUSINESS_LOSS_RISK',
  theme: THEMES.MONEY_FINANCE,
  subtype: SUBTYPES[THEMES.MONEY_FINANCE].BUSINESS,
  label: 'व्यापार में नुकसान / risk phase',
  description: 'नुकसान, risk और cash-flow समस्याओं वाला समय।',
  polarity: 'negative',
  kind: 'problem',
  tags: ['money', 'business', 'risk', 'loss'],
});

const MONEY_BUSINESS_PARTNERSHIP_COMPLEX = makePoint({
  id: 'MONEY_BUSINESS_PARTNERSHIP_COMPLEX',
  theme: THEMES.MONEY_FINANCE,
  subtype: SUBTYPES[THEMES.MONEY_FINANCE].BUSINESS,
  label: 'पार्टनरशिप में complex dynamics',
  description: 'partnership में confusion, trust issues, agreement mess।',
});

const MONEY_JOB_STABILITY = makePoint({
  id: 'MONEY_JOB_STABILITY',
  theme: THEMES.MONEY_FINANCE,
  subtype: SUBTYPES[THEMES.MONEY_FINANCE].JOB_INCOME,
  label: 'Job stability vs insecurity',
  description: 'नौकरी secure vs insecure feel होने वाला phase।',
});

const MONEY_JOB_PROMOTION_WIN = makePoint({
  id: 'MONEY_JOB_PROMOTION_WIN',
  theme: THEMES.MONEY_FINANCE,
  subtype: SUBTYPES[THEMES.MONEY_FINANCE].JOB_INCOME,
  label: 'Promotion / increment / appreciation',
  description: 'promotion, increment और appreciation मिलने वाला समय।',
});

const MONEY_JOB_STUCK_PHASE = makePoint({
  id: 'MONEY_JOB_STUCK_PHASE',
  theme: THEMES.MONEY_FINANCE,
  subtype: SUBTYPES[THEMES.MONEY_FINANCE].JOB_INCOME,
  label: 'Stuck job / growth रुकना',
  description: 'job में growth रुक जाना, efforts का result न मिलना।',
});

const MONEY_JOB_CHANGE_DECISION = makePoint({
  id: 'MONEY_JOB_CHANGE_DECISION',
  theme: THEMES.MONEY_FINANCE,
  subtype: SUBTYPES[THEMES.MONEY_FINANCE].JOB_INCOME,
  label: 'Job change decision / dilemma',
  description: 'job बदलने की dilemma – सही समय है या नहीं।',
});

const MONEY_JOB_LOSS_RISK = makePoint({
  id: 'MONEY_JOB_LOSS_RISK',
  theme: THEMES.MONEY_FINANCE,
  subtype: SUBTYPES[THEMES.MONEY_FINANCE].JOB_INCOME,
  label: 'Job loss risk / insecurity',
  description: 'job loss risk, insecurity और fear वाला period।',
});

const MONEY_BASIC_SAFETY_NET = makePoint({
  id: 'MONEY_BASIC_SAFETY_NET',
  theme: THEMES.MONEY_FINANCE,
  subtype: SUBTYPES[THEMES.MONEY_FINANCE].BASIC_STABILITY,
  label: 'Basic आर्थिक safety net',
  description: 'survival level stability – basic जरूरतें पूरी हों या न हों।',
});

const MONEY_DEBT_PRESSURE = makePoint({
  id: 'MONEY_DEBT_PRESSURE',
  theme: THEMES.MONEY_FINANCE,
  subtype: SUBTYPES[THEMES.MONEY_FINANCE].BASIC_STABILITY,
  label: 'Debt / loan pressure',
  description: 'कर्ज़, loan pressure और EMI stress वाला समय।',
});

const MONEY_SAVINGS_BUILDUP = makePoint({
  id: 'MONEY_SAVINGS_BUILDUP',
  theme: THEMES.MONEY_FINANCE,
  subtype: SUBTYPES[THEMES.MONEY_FINANCE].BASIC_STABILITY,
  label: 'Savings / emergency fund buildup',
  description: 'बचत build करना, emergency fund बनाना।',
});

const MONEY_UNEXPECTED_EXPENSES = makePoint({
  id: 'MONEY_UNEXPECTED_EXPENSES',
  theme: THEMES.MONEY_FINANCE,
  subtype: SUBTYPES[THEMES.MONEY_FINANCE].BASIC_STABILITY,
  label: 'Unexpected expenses',
  description: 'अचानक खर्च – medical, repair type खर्च वाली स्थितियाँ।',
});

const MONEY_WEALTH_ACCUMULATION = makePoint({
  id: 'MONEY_WEALTH_ACCUMULATION',
  theme: THEMES.MONEY_FINANCE,
  subtype: SUBTYPES[THEMES.MONEY_FINANCE].WEALTH_GROWTH,
  label: 'Wealth accumulation / assets',
  description: 'long-term धन जमा होना और assets बनना।',
  defaultScopes: ['monthly', 'yearly', 'life_theme'],
  polarity: 'positive',
  kind: 'achievement',
  tags: ['money', 'wealth', 'long_term'],
});

const MONEY_INVESTMENT_OPPORTUNITY_WIN = makePoint({
  id: 'MONEY_INVESTMENT_OPPORTUNITY_WIN',
  theme: THEMES.MONEY_FINANCE,
  subtype: SUBTYPES[THEMES.MONEY_FINANCE].WEALTH_GROWTH,
  label: 'Investment opportunity / financial wins',
  description: 'अच्छे निवेश window और financial wins वाले समय।',
});

const MONEY_INVESTMENT_RISK = makePoint({
  id: 'MONEY_INVESTMENT_RISK',
  theme: THEMES.MONEY_FINANCE,
  subtype: SUBTYPES[THEMES.MONEY_FINANCE].WEALTH_GROWTH,
  label: 'Investment risk / speculation',
  description: 'risky निवेश, speculative loss possibility वाला phase।',
});

// Personal finance (advanced) — finance intelligence (flow vs stock, timing, direction)
const FINANCE_GENERAL = makePoint({
  id: 'FINANCE_GENERAL',
  theme: THEMES.MONEY_FINANCE,
  subtype: SUBTYPES[THEMES.MONEY_FINANCE].PERSONAL_FINANCE,
  label: 'Personal finance — overall direction',
  description: 'Flow vs stock, disha (inflow/outflow/redirection), and overall money posture.',
  defaultScopes: ['daily', 'weekly', 'monthly', 'yearly', 'life_theme'],
  polarity: 'mixed',
  kind: 'state',
  tags: ['finance', 'personal_money', 'direction'],
});

const FINANCE_INCOME_FLOW = makePoint({
  id: 'FINANCE_INCOME_FLOW',
  theme: THEMES.MONEY_FINANCE,
  subtype: SUBTYPES[THEMES.MONEY_FINANCE].PERSONAL_FINANCE,
  label: 'Personal finance — income flow',
  description: 'Income flow strength, volatility, and inflow channels.',
  defaultScopes: ['daily', 'weekly', 'monthly', 'yearly', 'life_theme'],
  polarity: 'mixed',
  kind: 'state',
  tags: ['finance', 'income_flow'],
});

const FINANCE_EXPENSE_PRESSURE = makePoint({
  id: 'FINANCE_EXPENSE_PRESSURE',
  theme: THEMES.MONEY_FINANCE,
  subtype: SUBTYPES[THEMES.MONEY_FINANCE].PERSONAL_FINANCE,
  label: 'Personal finance — expense pressure',
  description: 'Expense/leakage pressure and short-term spending sensitivity.',
  defaultScopes: ['daily', 'weekly', 'monthly', 'yearly', 'life_theme'],
  polarity: 'negative',
  kind: 'state',
  tags: ['finance', 'expenses', 'pressure'],
});

const FINANCE_SAVINGS_GROWTH = makePoint({
  id: 'FINANCE_SAVINGS_GROWTH',
  theme: THEMES.MONEY_FINANCE,
  subtype: SUBTYPES[THEMES.MONEY_FINANCE].PERSONAL_FINANCE,
  label: 'Personal finance — savings growth',
  description: 'Savings/emergency fund and wealth stock-building direction.',
  defaultScopes: ['weekly', 'monthly', 'yearly', 'life_theme'],
  polarity: 'mixed',
  kind: 'state',
  tags: ['finance', 'savings', 'wealth_stock'],
});

const FINANCE_DEBT_LOAN = makePoint({
  id: 'FINANCE_DEBT_LOAN',
  theme: THEMES.MONEY_FINANCE,
  subtype: SUBTYPES[THEMES.MONEY_FINANCE].PERSONAL_FINANCE,
  label: 'Personal finance — debt/loan',
  description: 'Debt load, repayment posture, and borrowing caution windows.',
  defaultScopes: ['daily', 'weekly', 'monthly', 'yearly', 'life_theme'],
  polarity: 'negative',
  kind: 'state',
  tags: ['finance', 'debt', 'loan'],
});

const FINANCE_INVESTMENT_TIMING = makePoint({
  id: 'FINANCE_INVESTMENT_TIMING',
  theme: THEMES.MONEY_FINANCE,
  subtype: SUBTYPES[THEMES.MONEY_FINANCE].PERSONAL_FINANCE,
  label: 'Personal finance — investment timing',
  description: 'Timing windows for investing: long-term vs speculative posture.',
  defaultScopes: ['daily', 'weekly', 'monthly', 'yearly', 'life_theme'],
  polarity: 'mixed',
  kind: 'state',
  tags: ['finance', 'investment', 'timing'],
});

const FINANCE_SUDDEN_GAIN_LOSS = makePoint({
  id: 'FINANCE_SUDDEN_GAIN_LOSS',
  theme: THEMES.MONEY_FINANCE,
  subtype: SUBTYPES[THEMES.MONEY_FINANCE].PERSONAL_FINANCE,
  label: 'Personal finance — sudden gain/loss',
  description: 'Volatility, shocks, and sudden opportunity vs risk posture.',
  defaultScopes: ['daily', 'weekly', 'monthly', 'yearly', 'life_theme'],
  polarity: 'mixed',
  kind: 'event',
  tags: ['finance', 'volatility', 'sudden'],
});

const FINANCE_LONG_TERM_WEALTH = makePoint({
  id: 'FINANCE_LONG_TERM_WEALTH',
  theme: THEMES.MONEY_FINANCE,
  subtype: SUBTYPES[THEMES.MONEY_FINANCE].PERSONAL_FINANCE,
  label: 'Personal finance — long-term wealth',
  description: '2–5 year wealth trajectory and stock-building phases.',
  defaultScopes: ['yearly', 'life_theme'],
  polarity: 'mixed',
  kind: 'state',
  tags: ['finance', 'wealth', 'multi_year'],
});

// Source of earnings
const MONEY_MULTIPLE_SOURCES_OF_INCOME = makePoint({
  id: 'MONEY_MULTIPLE_SOURCES_OF_INCOME',
  theme: THEMES.MONEY_FINANCE,
  subtype: SUBTYPES[THEMES.MONEY_FINANCE].SOURCE_OF_EARNINGS,
  label: 'Multiple income sources',
  description:
    'Side income, extra earning ya multiple sources of earning ke yog.',
  polarity: 'positive',
  kind: 'achievement',
  defaultScopes: ['yearly', 'life_theme'],
  tags: ['income_source', 'multiple', 'money'],
});

const MONEY_SINGLE_SOURCE_RISK = makePoint({
  id: 'MONEY_SINGLE_SOURCE_RISK',
  theme: THEMES.MONEY_FINANCE,
  subtype: SUBTYPES[THEMES.MONEY_FINANCE].SOURCE_OF_EARNINGS,
  label: 'Single income source risk',
  description:
    'Sirf ek hi source par depend hone se risk aur vulnerable feel hona.',
  polarity: 'negative',
  kind: 'problem',
  defaultScopes: ['monthly', 'yearly'],
  tags: ['income_source', 'single', 'risk'],
});

const MONEY_FREELANCE_SELFEMPLOY = makePoint({
  id: 'MONEY_FREELANCE_SELFEMPLOY',
  theme: THEMES.MONEY_FINANCE,
  subtype: SUBTYPES[THEMES.MONEY_FINANCE].SOURCE_OF_EARNINGS,
  label: 'Freelance / self-employment tendency',
  description:
    'Freelancing, self-employment ya independent earning mode ki tendency.',
  polarity: 'mixed',
  kind: 'state',
  defaultScopes: ['yearly', 'life_theme'],
  tags: ['income_source', 'freelance', 'self_employ'],
});

// THEME 2: CAREER_DIRECTION – करियर / दिशा
const CAREER_GROWTH_OPPORTUNITY_WIN = makePoint({
  id: 'CAREER_GROWTH_OPPORTUNITY_WIN',
  theme: THEMES.CAREER_DIRECTION,
  subtype: SUBTYPES[THEMES.CAREER_DIRECTION].CAREER_GROWTH,
  label: 'Career growth opportunity / win',
  description: 'strong growth, promotion, recognition और जीत वाला phase।',
});

// Career module (advanced, authored variants exist; taxonomy allow-list entry)
const CAREER_GENERAL = makePoint({
  id: 'CAREER_GENERAL',
  theme: THEMES.CAREER_DIRECTION,
  subtype: SUBTYPES[THEMES.CAREER_DIRECTION].CAREER_GROWTH,
  label: 'Career — overall direction',
  description: 'General career posture: support vs challenge, momentum, and decision framing.',
  defaultScopes: ['daily', 'weekly', 'monthly', 'yearly', 'life_theme'],
  polarity: 'mixed',
  kind: 'state',
  tags: ['career', 'general', 'direction'],
});

const CAREER_STABILITY = makePoint({
  id: 'CAREER_STABILITY',
  theme: THEMES.CAREER_DIRECTION,
  subtype: SUBTYPES[THEMES.CAREER_DIRECTION].CAREER_GROWTH,
  label: 'Career stability',
  description: 'Stability vs instability signals; structure and consolidation phases.',
  defaultScopes: ['monthly', 'yearly', 'life_theme'],
  polarity: 'mixed',
  kind: 'state',
  tags: ['career', 'stability'],
});

const CAREER_GROWTH_PROMOTION = makePoint({
  id: 'CAREER_GROWTH_PROMOTION',
  theme: THEMES.CAREER_DIRECTION,
  subtype: SUBTYPES[THEMES.CAREER_DIRECTION].CAREER_GROWTH,
  label: 'Career growth / promotion',
  description: 'Promotion/growth windows, recognition, responsibility bands (non-absolute).',
  defaultScopes: ['monthly', 'yearly', 'life_theme'],
  polarity: 'positive',
  kind: 'achievement',
  tags: ['career', 'growth', 'promotion'],
});

const CAREER_JOB_CHANGE = makePoint({
  id: 'CAREER_JOB_CHANGE',
  theme: THEMES.CAREER_DIRECTION,
  subtype: SUBTYPES[THEMES.CAREER_DIRECTION].CAREER_CHANGE,
  label: 'Career job change / role shift',
  description: 'Role shift timing, readiness phases, and decision support (no guarantees).',
  defaultScopes: ['monthly', 'yearly', 'life_theme'],
  polarity: 'mixed',
  kind: 'event',
  tags: ['career', 'job_change', 'role_shift'],
});

const CAREER_WORKPLACE_CONFLICT = makePoint({
  id: 'CAREER_WORKPLACE_CONFLICT',
  theme: THEMES.CAREER_DIRECTION,
  subtype: SUBTYPES[THEMES.CAREER_DIRECTION].WORK_STRESS,
  label: 'Workplace conflict / politics',
  description: 'Colleague/boss friction, politics stress, repair and boundaries guidance.',
  defaultScopes: ['daily', 'weekly', 'monthly', 'yearly'],
  polarity: 'negative',
  kind: 'problem',
  tags: ['career', 'workplace', 'conflict', 'politics'],
});

const CAREER_SKILL_STAGNATION = makePoint({
  id: 'CAREER_SKILL_STAGNATION',
  theme: THEMES.CAREER_DIRECTION,
  subtype: SUBTYPES[THEMES.CAREER_DIRECTION].CAREER_GROWTH,
  label: 'Skill stagnation / growth block',
  description: 'Learning blocks vs upskilling support; relevance and competence cycles.',
  defaultScopes: ['weekly', 'monthly', 'yearly', 'life_theme'],
  polarity: 'mixed',
  kind: 'state',
  tags: ['career', 'skills', 'stagnation'],
});

const CAREER_GROWTH_BLOCKED = makePoint({
  id: 'CAREER_GROWTH_BLOCKED',
  theme: THEMES.CAREER_DIRECTION,
  subtype: SUBTYPES[THEMES.CAREER_DIRECTION].CAREER_GROWTH,
  label: 'Career growth blocked',
  description: 'कोशिश के बाद भी career growth न होना।',
});

const CAREER_SKILL_ALIGNMENT = makePoint({
  id: 'CAREER_SKILL_ALIGNMENT',
  theme: THEMES.CAREER_DIRECTION,
  subtype: SUBTYPES[THEMES.CAREER_DIRECTION].CAREER_GROWTH,
  label: 'Skill vs work alignment',
  description: 'खुद की ability vs चुने गए काम का mismatch / match।',
});

const CAREER_PUBLIC_RECOGNITION = makePoint({
  id: 'CAREER_PUBLIC_RECOGNITION',
  theme: THEMES.CAREER_DIRECTION,
  subtype: SUBTYPES[THEMES.CAREER_DIRECTION].CAREER_GROWTH,
  label: 'Public recognition / fame',
  description: 'नाम, fame, respect बढ़ने वाला समय।',
});

const CAREER_CHANGE_CONFUSION = makePoint({
  id: 'CAREER_CHANGE_CONFUSION',
  theme: THEMES.CAREER_DIRECTION,
  subtype: SUBTYPES[THEMES.CAREER_DIRECTION].CAREER_CHANGE,
  label: 'Career change confusion',
  description: 'करियर change को लेकर confusion, डर और clarity की कमी।',
});

const CAREER_CHANGE_RIGHT_TIME = makePoint({
  id: 'CAREER_CHANGE_RIGHT_TIME',
  theme: THEMES.CAREER_DIRECTION,
  subtype: SUBTYPES[THEMES.CAREER_DIRECTION].CAREER_CHANGE,
  label: 'Right time for career change',
  description: 'नई direction या industry में switch करने का सही समय।',
});

const CAREER_CHANGE_FORCED = makePoint({
  id: 'CAREER_CHANGE_FORCED',
  theme: THEMES.CAREER_DIRECTION,
  subtype: SUBTYPES[THEMES.CAREER_DIRECTION].CAREER_CHANGE,
  label: 'Forced career change',
  description: 'circumstances से forced change (company बंद, layoff, आदि)।',
});

const CAREER_WORKLOAD_HIGH_STRESS = makePoint({
  id: 'CAREER_WORKLOAD_HIGH_STRESS',
  theme: THEMES.CAREER_DIRECTION,
  subtype: SUBTYPES[THEMES.CAREER_DIRECTION].WORK_STRESS,
  label: 'High workload / burnout risk',
  description: 'काम का load बहुत ज़्यादा, burnout का risk।',
});

const CAREER_TEAM_CONFLICT = makePoint({
  id: 'CAREER_TEAM_CONFLICT',
  theme: THEMES.CAREER_DIRECTION,
  subtype: SUBTYPES[THEMES.CAREER_DIRECTION].WORK_STRESS,
  label: 'Team / boss conflict',
  description: 'boss/colleagues से conflict, politics और emotional drain।',
});

const CAREER_WORK_ENJOYMENT_HIGH = makePoint({
  id: 'CAREER_WORK_ENJOYMENT_HIGH',
  theme: THEMES.CAREER_DIRECTION,
  subtype: SUBTYPES[THEMES.CAREER_DIRECTION].WORK_STRESS,
  label: 'High work enjoyment',
  description: 'काम में joy, flow और creative satisfaction वाला समय।',
});

// Education / study related
const EDU_GENERAL_DIRECTION = makePoint({
  id: 'EDU_GENERAL_DIRECTION',
  theme: THEMES.CAREER_DIRECTION,
  subtype: SUBTYPES[THEMES.CAREER_DIRECTION].EDUCATION,
  label: 'Education general direction',
  description:
    'पढ़ाई की overall direction / higher studies kis side जाएँ, iski guidance.',
  polarity: 'mixed',
  kind: 'state',
  defaultScopes: ['monthly', 'yearly', 'life_theme'],
  tags: ['education', 'direction'],
});

const EDU_SUBJECT_SELECTION = makePoint({
  id: 'EDU_SUBJECT_SELECTION',
  theme: THEMES.CAREER_DIRECTION,
  subtype: SUBTYPES[THEMES.CAREER_DIRECTION].EDUCATION,
  label: 'Subject / stream selection',
  description:
    'School/college level par subject/stream choose karne ki dilemma (science/commerce/arts/IT etc.).',
  polarity: 'mixed',
  kind: 'problem',
  defaultScopes: ['yearly', 'life_theme'],
  tags: ['education', 'subject_choice'],
});

const EDU_COMPETITIVE_EXAMS = makePoint({
  id: 'EDU_COMPETITIVE_EXAMS',
  theme: THEMES.CAREER_DIRECTION,
  subtype: SUBTYPES[THEMES.CAREER_DIRECTION].EDUCATION,
  label: 'Competitive exams focus / pressure',
  description:
    'Competitive exams ki tayari, focus aur pressure se जुड़ी हुई स्थितियाँ।',
  polarity: 'mixed',
  kind: 'event',
  defaultScopes: ['daily', 'weekly', 'monthly'],
  tags: ['education', 'exam', 'pressure'],
});

// Career solution / stuck situations
const CAREER_SOLUTION_BLOCKED_PATH = makePoint({
  id: 'CAREER_SOLUTION_BLOCKED_PATH',
  theme: THEMES.CAREER_DIRECTION,
  subtype: SUBTYPES[THEMES.CAREER_DIRECTION].CAREER_SOLUTION,
  label: 'Career mein rasta na dikhna',
  description:
    'मेहनत ke baad bhi growth ya direction clear na hona, “ab kya karun?” wali situation.',
  polarity: 'negative',
  kind: 'problem',
  defaultScopes: ['monthly', 'yearly'],
  tags: ['career', 'solution', 'blocked'],
});

const CAREER_SOLUTION_FIELD_SWITCH = makePoint({
  id: 'CAREER_SOLUTION_FIELD_SWITCH',
  theme: THEMES.CAREER_DIRECTION,
  subtype: SUBTYPES[THEMES.CAREER_DIRECTION].CAREER_SOLUTION,
  label: 'Field / industry change solution',
  description:
    'Existing field se dusri field ya industry me shift karne ka decision aur uski guidance.',
  polarity: 'mixed',
  kind: 'problem',
  tags: ['career', 'field_change'],
});

// Career subject choice
const CAREER_SUBJECT_CHOICE = makePoint({
  id: 'CAREER_SUBJECT_CHOICE',
  theme: THEMES.CAREER_DIRECTION,
  subtype: SUBTYPES[THEMES.CAREER_DIRECTION].CAREER_SUBJECT_CHOICE,
  label: 'Career subject / specialization choice',
  description:
    'Graduation / post-graduation ya specialization choose karne wale important decisions.',
  polarity: 'mixed',
  kind: 'problem',
  defaultScopes: ['yearly', 'life_theme'],
  tags: ['career', 'subject_choice'],
});

// Govt vs private job nature
const CAREER_GOVT_JOB_TENDENCY = makePoint({
  id: 'CAREER_GOVT_JOB_TENDENCY',
  theme: THEMES.CAREER_DIRECTION,
  subtype: SUBTYPES[THEMES.CAREER_DIRECTION].JOB_NATURE,
  label: 'Sarkari naukri tendency',
  description:
    'Government job ke towards tendency / pattern / strong orientation.',
  polarity: 'mixed',
  kind: 'state',
  defaultScopes: ['yearly', 'life_theme'],
  tags: ['career', 'govt_job'],
});

const CAREER_PRIVATE_JOB_PATH = makePoint({
  id: 'CAREER_PRIVATE_JOB_PATH',
  theme: THEMES.CAREER_DIRECTION,
  subtype: SUBTYPES[THEMES.CAREER_DIRECTION].JOB_NATURE,
  label: 'Private / corporate job path',
  description:
    'Private / corporate sector ki taraf strong inclination aur uski possibilities.',
  polarity: 'mixed',
  kind: 'state',
  defaultScopes: ['yearly', 'life_theme'],
  tags: ['career', 'private_job'],
});

// THEME 3: RELATIONSHIPS – रिश्ते / प्रेम / marriage
const REL_LOVE_GENERAL = makePoint({
  id: 'REL_LOVE_GENERAL',
  theme: THEMES.RELATIONSHIPS,
  subtype: SUBTYPES[THEMES.RELATIONSHIPS].LOVE,
  label: 'Overall प्रेम जीवन',
  description: 'प्रेम जीवन की overall supportive vs dull स्थिति।',
});

// Relationship module (advanced, authored variants exist; taxonomy allow-list entry)
const RELATIONSHIP_GENERAL = makePoint({
  id: 'RELATIONSHIP_GENERAL',
  theme: THEMES.RELATIONSHIPS,
  subtype: SUBTYPES[THEMES.RELATIONSHIPS].LOVE,
  label: 'Relationship — overall direction',
  description: 'Overall relationship climate: support vs strain, maturity, and clarity.',
  defaultScopes: ['daily', 'weekly', 'monthly', 'yearly', 'life_theme'],
  polarity: 'mixed',
  kind: 'state',
  tags: ['relationship', 'general'],
});

const RELATIONSHIP_STABILITY = makePoint({
  id: 'RELATIONSHIP_STABILITY',
  theme: THEMES.RELATIONSHIPS,
  subtype: SUBTYPES[THEMES.RELATIONSHIPS].LOVE,
  label: 'Relationship stability',
  description: 'Stability vs distance cycles; long-term consistency themes (non-absolute).',
  defaultScopes: ['monthly', 'yearly', 'life_theme'],
  polarity: 'mixed',
  kind: 'state',
  tags: ['relationship', 'stability'],
});

const RELATIONSHIP_MARRIAGE_TIMING = makePoint({
  id: 'RELATIONSHIP_MARRIAGE_TIMING',
  theme: THEMES.RELATIONSHIPS,
  subtype: SUBTYPES[THEMES.RELATIONSHIPS].MARRIAGE_PARTNER,
  label: 'Marriage timing (month–year windows)',
  description: 'Timing windows and readiness framing for marriage decisions (no guarantees).',
  defaultScopes: ['monthly', 'yearly', 'life_theme'],
  polarity: 'mixed',
  kind: 'event',
  tags: ['relationship', 'marriage', 'timing'],
});

const RELATIONSHIP_CONFLICT_PATCHUP = makePoint({
  id: 'RELATIONSHIP_CONFLICT_PATCHUP',
  theme: THEMES.RELATIONSHIPS,
  subtype: SUBTYPES[THEMES.RELATIONSHIPS].LOVE,
  label: 'Conflict / patch-up cycles',
  description: 'Misunderstandings, repair potential, and reconnection support phases.',
  defaultScopes: ['daily', 'weekly', 'monthly'],
  polarity: 'mixed',
  kind: 'event',
  tags: ['relationship', 'conflict', 'patchup'],
});

const RELATIONSHIP_EMOTIONAL_DISTANCE = makePoint({
  id: 'RELATIONSHIP_EMOTIONAL_DISTANCE',
  theme: THEMES.RELATIONSHIPS,
  subtype: SUBTYPES[THEMES.RELATIONSHIPS].LOVE,
  label: 'Emotional distance',
  description: 'Distance/withdrawal cycles and communication repair framing (non-absolute).',
  defaultScopes: ['daily', 'weekly', 'monthly', 'yearly'],
  polarity: 'negative',
  kind: 'state',
  tags: ['relationship', 'distance'],
});

const FAMILY_RELATIONS_GENERAL = makePoint({
  id: 'FAMILY_RELATIONS_GENERAL',
  theme: THEMES.RELATIONSHIPS,
  subtype: SUBTYPES[THEMES.RELATIONSHIPS].FAMILY_RELATIONS,
  label: 'Family relations — overall',
  description: 'Family harmony vs friction; boundaries and support framing.',
  defaultScopes: ['weekly', 'monthly', 'yearly', 'life_theme'],
  polarity: 'mixed',
  kind: 'state',
  tags: ['family', 'relationships', 'general'],
});

const FAMILY_CONFLICT_PRESSURE = makePoint({
  id: 'FAMILY_CONFLICT_PRESSURE',
  theme: THEMES.RELATIONSHIPS,
  subtype: SUBTYPES[THEMES.RELATIONSHIPS].FAMILY_RELATIONS,
  label: 'Family conflict / pressure',
  description: 'External pressure and conflict sensitivity; calm boundaries framing.',
  defaultScopes: ['daily', 'weekly', 'monthly', 'yearly'],
  polarity: 'negative',
  kind: 'problem',
  tags: ['family', 'conflict', 'pressure'],
});

const LONG_TERM_RELATIONSHIP_BOND = makePoint({
  id: 'LONG_TERM_RELATIONSHIP_BOND',
  theme: THEMES.RELATIONSHIPS,
  subtype: SUBTYPES[THEMES.RELATIONSHIPS].LOVE,
  label: 'Long-term relationship bond',
  description: 'Bond strengthening vs erosion cycles; stability and repair posture.',
  defaultScopes: ['monthly', 'yearly', 'life_theme'],
  polarity: 'mixed',
  kind: 'state',
  tags: ['relationship', 'long_term', 'bond'],
});

const REL_LOVE_NEW_CONNECTION = makePoint({
  id: 'REL_LOVE_NEW_CONNECTION',
  theme: THEMES.RELATIONSHIPS,
  subtype: SUBTYPES[THEMES.RELATIONSHIPS].LOVE,
  label: 'New love connection',
  description: 'नया attraction / relationship शुरू होने के योग।',
});

const REL_LOVE_MISUNDERSTANDING = makePoint({
  id: 'REL_LOVE_MISUNDERSTANDING',
  theme: THEMES.RELATIONSHIPS,
  subtype: SUBTYPES[THEMES.RELATIONSHIPS].LOVE,
  label: 'Love misunderstandings',
  description: 'गलतफहमी, over-sensitivity और ego clash वाला दिन।',
});

const REL_LOVE_BREAKUP_PAIN = makePoint({
  id: 'REL_LOVE_BREAKUP_PAIN',
  theme: THEMES.RELATIONSHIPS,
  subtype: SUBTYPES[THEMES.RELATIONSHIPS].LOVE,
  label: 'Breakup / separation ka pain',
  description: 'Relationship break ya separation ke samay ka emotional pain phase.',
  polarity: 'negative',
  kind: 'problem',
  tags: ['love', 'breakup', 'pain'],
});

const REL_LOVE_HEALING_REUNION = makePoint({
  id: 'REL_LOVE_HEALING_REUNION',
  theme: THEMES.RELATIONSHIPS,
  subtype: SUBTYPES[THEMES.RELATIONSHIPS].LOVE,
  label: 'Love healing / reunion',
  description: 'healing, closure, patch-up या inner acceptance वाला समय।',
});

const REL_LOVE_PATCHUP_POSSIBILITY = makePoint({
  id: 'REL_LOVE_PATCHUP_POSSIBILITY',
  theme: THEMES.RELATIONSHIPS,
  subtype: SUBTYPES[THEMES.RELATIONSHIPS].LOVE,
  label: 'Patch-up / healing possibility',
  description:
    'Patch-up, healing, ya inner closure ke लिए supportive window / highlight period.',
  polarity: 'mixed',
  kind: 'event',
  defaultScopes: ['daily', 'weekly', 'monthly'],
  tags: ['love', 'healing', 'patchup'],
});

// Partner loyalty / trust
const REL_PARTNER_LOYALTY_TRUST = makePoint({
  id: 'REL_PARTNER_LOYALTY_TRUST',
  theme: THEMES.RELATIONSHIPS,
  subtype: SUBTYPES[THEMES.RELATIONSHIPS].PARTNER_LOYALTY,
  label: 'Partner loyalty / trust zone',
  description:
    'Partner ke saath trust, loyalty aur faith se जुड़ी situations (language soft, doubt ko bhi balanced tone me).',
  polarity: 'mixed',
  kind: 'problem',
  defaultScopes: ['daily', 'weekly', 'monthly'],
  tags: ['relationship', 'loyalty', 'trust'],
});

const REL_MARRIAGE_TIMING = makePoint({
  id: 'REL_MARRIAGE_TIMING',
  theme: THEMES.RELATIONSHIPS,
  subtype: SUBTYPES[THEMES.RELATIONSHIPS].MARRIAGE_PARTNER,
  label: 'Marriage timing',
  description: 'marriage delay vs सही timing की स्थितियाँ।',
});

const REL_MARRIAGE_HARMONY = makePoint({
  id: 'REL_MARRIAGE_HARMONY',
  theme: THEMES.RELATIONSHIPS,
  subtype: SUBTYPES[THEMES.RELATIONSHIPS].MARRIAGE_PARTNER,
  label: 'Marriage harmony',
  description: 'marriage में understanding, support और खुशी वाला phase।',
});

const REL_MARRIAGE_CONFLICT_COMPLEX = makePoint({
  id: 'REL_MARRIAGE_CONFLICT_COMPLEX',
  theme: THEMES.RELATIONSHIPS,
  subtype: SUBTYPES[THEMES.RELATIONSHIPS].MARRIAGE_PARTNER,
  label: 'Marriage conflict / complexity',
  description: 'frequent conflicts, coldness और complicated dynamics।',
});

const REL_MARRIAGE_FAMILY_PRESSURE = makePoint({
  id: 'REL_MARRIAGE_FAMILY_PRESSURE',
  theme: THEMES.RELATIONSHIPS,
  subtype: SUBTYPES[THEMES.RELATIONSHIPS].MARRIAGE_PARTNER,
  label: 'Marriage family pressure',
  description: 'शादी को लेकर family / social pressure।',
});

const REL_MARRIAGE_LOVE_ARRANGE_TENDENCY = makePoint({
  id: 'REL_MARRIAGE_LOVE_ARRANGE_TENDENCY',
  theme: THEMES.RELATIONSHIPS,
  subtype: SUBTYPES[THEMES.RELATIONSHIPS].MARRIAGE_PARTNER,
  label: 'Love vs arrange marriage tendency',
  description:
    'Chart me love marriage ya arrange marriage ki tendency / pattern ko softly describe karta hai.',
  polarity: 'mixed',
  kind: 'state',
  defaultScopes: ['yearly', 'life_theme'],
  tags: ['marriage', 'love', 'arrange'],
});

const REL_FAMILY_SUPPORT_STRONG = makePoint({
  id: 'REL_FAMILY_SUPPORT_STRONG',
  theme: THEMES.RELATIONSHIPS,
  subtype: SUBTYPES[THEMES.RELATIONSHIPS].FAMILY_RELATIONS,
  label: 'Strong family support',
  description: 'family से strong support और emotional सुरक्षा।',
});

const REL_FAMILY_RESPONSIBILITY_PRESSURE = makePoint({
  id: 'REL_FAMILY_RESPONSIBILITY_PRESSURE',
  theme: THEMES.RELATIONSHIPS,
  subtype: SUBTYPES[THEMES.RELATIONSHIPS].FAMILY_RELATIONS,
  label: 'Family responsibility pressure',
  description: 'ज़िम्मेदारी का load, caretaker role fatigue।',
});

const REL_FAMILY_CONFLICT_SAD = makePoint({
  id: 'REL_FAMILY_CONFLICT_SAD',
  theme: THEMES.RELATIONSHIPS,
  subtype: SUBTYPES[THEMES.RELATIONSHIPS].FAMILY_RELATIONS,
  label: 'Family conflict / sadness',
  description: 'घर के अंदर fights, नाराज़गी और emotional heaviness।',
});

const REL_PARENT_CHILD_BOND = makePoint({
  id: 'REL_PARENT_CHILD_BOND',
  theme: THEMES.RELATIONSHIPS,
  subtype: SUBTYPES[THEMES.RELATIONSHIPS].FAMILY_RELATIONS,
  label: 'Parent–child bond',
  description: 'parents / बच्चों के साथ संबंध – खुशी या tension।',
});

const REL_SOCIAL_LONELINESS = makePoint({
  id: 'REL_SOCIAL_LONELINESS',
  theme: THEMES.RELATIONSHIPS,
  subtype: SUBTYPES[THEMES.RELATIONSHIPS].SOCIAL_CONNECTIONS,
  label: 'Social loneliness',
  description: 'अकेलापन, belonging की कमी वाला phase।',
});

const REL_SOCIAL_NEW_NETWORK = makePoint({
  id: 'REL_SOCIAL_NEW_NETWORK',
  theme: THEMES.RELATIONSHIPS,
  subtype: SUBTYPES[THEMES.RELATIONSHIPS].SOCIAL_CONNECTIONS,
  label: 'New social network',
  description: 'नए दोस्त, network और helpful contacts।',
});

const REL_SOCIAL_REPUTATION_WIN = makePoint({
  id: 'REL_SOCIAL_REPUTATION_WIN',
  theme: THEMES.RELATIONSHIPS,
  subtype: SUBTYPES[THEMES.RELATIONSHIPS].SOCIAL_CONNECTIONS,
  label: 'Social reputation win',
  description: 'social respect और image improvement वाला समय।',
});

// THEME 4: FAMILY_HOME – घर / family / environment
const FAMILY_PARENTS_HEALTH_CONCERN = makePoint({
  id: 'FAMILY_PARENTS_HEALTH_CONCERN',
  theme: THEMES.FAMILY_HOME,
  subtype: SUBTYPES[THEMES.FAMILY_HOME].PARENTS,
  label: 'Parents health concern',
  description: 'माता-पिता की सेहत और उससे जुड़ी चिंता।',
});

const FAMILY_PARENTS_SUPPORT_STRONG = makePoint({
  id: 'FAMILY_PARENTS_SUPPORT_STRONG',
  theme: THEMES.FAMILY_HOME,
  subtype: SUBTYPES[THEMES.FAMILY_HOME].PARENTS,
  label: 'Parents support strong',
  description: 'parents से emotional / financial support।',
});

const FAMILY_PARENTS_RELATION_COMPLEX = makePoint({
  id: 'FAMILY_PARENTS_RELATION_COMPLEX',
  theme: THEMES.FAMILY_HOME,
  subtype: SUBTYPES[THEMES.FAMILY_HOME].PARENTS,
  label: 'Parents relation complex',
  description: 'distance, disagreement और generational tension।',
});

const FAMILY_CHILD_EDU_STRESS = makePoint({
  id: 'FAMILY_CHILD_EDU_STRESS',
  theme: THEMES.FAMILY_HOME,
  subtype: SUBTYPES[THEMES.FAMILY_HOME].CHILDREN,
  label: 'Child education / behaviour stress',
  description: 'बच्चे की पढ़ाई या behaviour concern से stress।',
});

const FAMILY_CHILD_HAPPY_PHASE = makePoint({
  id: 'FAMILY_CHILD_HAPPY_PHASE',
  theme: THEMES.FAMILY_HOME,
  subtype: SUBTYPES[THEMES.FAMILY_HOME].CHILDREN,
  label: 'Child happy phase',
  description: 'बच्चे से खुशी, bonding और proud moments।',
});

const FAMILY_CHILD_CONCEPTION_WINDOW = makePoint({
  id: 'FAMILY_CHILD_CONCEPTION_WINDOW',
  theme: THEMES.FAMILY_HOME,
  subtype: SUBTYPES[THEMES.FAMILY_HOME].CHILDREN,
  label: 'Child conception supportive window',
  description:
    'Bachcha conceive karne ke लिए relatively supportive window (koi guarantee language nahi).',
  polarity: 'mixed',
  kind: 'event',
  defaultScopes: ['monthly', 'yearly'],
  tags: ['children', 'conception'],
});

// Children / Progeny module (taxonomy allow-list entry; exact names required for ingest)
const CHILDREN_GENERAL = makePoint({
  id: 'CHILDREN_GENERAL',
  theme: THEMES.FAMILY_HOME,
  subtype: SUBTYPES[THEMES.FAMILY_HOME].CHILDREN,
  label: 'Children / progeny — overall',
  description: 'General progeny/children direction (advisory; non-absolute).',
  defaultScopes: ['monthly', 'yearly', 'life_theme'],
  polarity: 'mixed',
  kind: 'state',
  tags: ['children', 'progeny', 'general'],
});

const CHILDREN_PROGENY_SUPPORT = makePoint({
  id: 'CHILDREN_PROGENY_SUPPORT',
  theme: THEMES.FAMILY_HOME,
  subtype: SUBTYPES[THEMES.FAMILY_HOME].CHILDREN,
  label: 'Progeny support',
  description: 'Supportive phases for progeny-related progress (non-medical; non-absolute).',
  defaultScopes: ['monthly', 'yearly', 'life_theme'],
  polarity: 'positive',
  kind: 'state',
  tags: ['children', 'progeny', 'support'],
});

const CHILDREN_PROGENY_DELAY = makePoint({
  id: 'CHILDREN_PROGENY_DELAY',
  theme: THEMES.FAMILY_HOME,
  subtype: SUBTYPES[THEMES.FAMILY_HOME].CHILDREN,
  label: 'Progeny delay / block',
  description: 'Delay-style patterns and pacing (no diagnosis; no absolutes).',
  defaultScopes: ['monthly', 'yearly', 'life_theme'],
  polarity: 'negative',
  kind: 'state',
  tags: ['children', 'progeny', 'delay'],
});

const CHILDREN_PUTRA_YOG = makePoint({
  id: 'CHILDREN_PUTRA_YOG',
  theme: THEMES.FAMILY_HOME,
  subtype: SUBTYPES[THEMES.FAMILY_HOME].CHILDREN,
  label: 'Male-progeny inclination yog',
  description: 'Male-progeny inclination signals (soft; non-absolute; no guarantees).',
  defaultScopes: ['monthly', 'yearly', 'life_theme'],
  polarity: 'mixed',
  kind: 'state',
  tags: ['children', 'progeny', 'male_inclination'],
});

const CHILDREN_PUTRI_YOG = makePoint({
  id: 'CHILDREN_PUTRI_YOG',
  theme: THEMES.FAMILY_HOME,
  subtype: SUBTYPES[THEMES.FAMILY_HOME].CHILDREN,
  label: 'Female-progeny inclination yog',
  description: 'Female-progeny inclination signals (soft; non-absolute; no guarantees).',
  defaultScopes: ['monthly', 'yearly', 'life_theme'],
  polarity: 'mixed',
  kind: 'state',
  tags: ['children', 'progeny', 'female_inclination'],
});

const CHILDREN_MULTIPLE_PROGENY = makePoint({
  id: 'CHILDREN_MULTIPLE_PROGENY',
  theme: THEMES.FAMILY_HOME,
  subtype: SUBTYPES[THEMES.FAMILY_HOME].CHILDREN,
  label: 'Multiple progeny tendency',
  description: 'Soft tendency towards multiple children (non-absolute; no exact counts).',
  defaultScopes: ['yearly', 'life_theme'],
  polarity: 'mixed',
  kind: 'state',
  tags: ['children', 'progeny', 'multiple_tendency'],
});

const CHILDREN_PARENTING_PRESSURE = makePoint({
  id: 'CHILDREN_PARENTING_PRESSURE',
  theme: THEMES.FAMILY_HOME,
  subtype: SUBTYPES[THEMES.FAMILY_HOME].CHILDREN,
  label: 'Parenting pressure',
  description: 'Responsibility load and parenting-related stress cycles (advisory).',
  defaultScopes: ['daily', 'weekly', 'monthly', 'yearly'],
  polarity: 'negative',
  kind: 'state',
  tags: ['children', 'parenting', 'pressure'],
});

const CHILDREN_LONG_TERM_BOND = makePoint({
  id: 'CHILDREN_LONG_TERM_BOND',
  theme: THEMES.FAMILY_HOME,
  subtype: SUBTYPES[THEMES.FAMILY_HOME].CHILDREN,
  label: 'Long-term parent–child bond',
  description: 'Long-term bonding and nurturing direction (non-absolute).',
  defaultScopes: ['yearly', 'life_theme'],
  polarity: 'mixed',
  kind: 'state',
  tags: ['children', 'bond', 'long_term'],
});

// Progeny module point codes (authored variants exist; taxonomy allow-list entry)
const PROGENY_GENERAL = makePoint({
  id: 'PROGENY_GENERAL',
  theme: THEMES.FAMILY_HOME,
  subtype: SUBTYPES[THEMES.FAMILY_HOME].CHILDREN,
  label: 'Progeny — general',
  description: 'General progeny/children direction (advisory; non-absolute).',
  defaultScopes: ['monthly', 'yearly', 'life_theme'],
  polarity: 'mixed',
  kind: 'state',
  tags: ['progeny', 'children', 'general'],
});

const PROGENY_TIMING_WINDOW = makePoint({
  id: 'PROGENY_TIMING_WINDOW',
  theme: THEMES.FAMILY_HOME,
  subtype: SUBTYPES[THEMES.FAMILY_HOME].CHILDREN,
  label: 'Progeny — timing window',
  description: 'Timing-sensitive windows for progeny-related progress (no exact dates).',
  defaultScopes: ['monthly', 'yearly', 'life_theme'],
  polarity: 'mixed',
  kind: 'event',
  tags: ['progeny', 'timing', 'window'],
});

const PROGENY_DELAY_BLOCK = makePoint({
  id: 'PROGENY_DELAY_BLOCK',
  theme: THEMES.FAMILY_HOME,
  subtype: SUBTYPES[THEMES.FAMILY_HOME].CHILDREN,
  label: 'Progeny — delay/block',
  description: 'Delay-style patterns and pacing guidance (no diagnosis; no absolutes).',
  defaultScopes: ['monthly', 'yearly', 'life_theme'],
  polarity: 'negative',
  kind: 'state',
  tags: ['progeny', 'delay', 'block'],
});

const PROGENY_MULTIPLE_TENDENCY = makePoint({
  id: 'PROGENY_MULTIPLE_TENDENCY',
  theme: THEMES.FAMILY_HOME,
  subtype: SUBTYPES[THEMES.FAMILY_HOME].CHILDREN,
  label: 'Progeny — multiple tendency',
  description: 'Soft tendency towards multiple children (non-absolute; no exact counts).',
  defaultScopes: ['yearly', 'life_theme'],
  polarity: 'mixed',
  kind: 'state',
  tags: ['progeny', 'multiple_tendency'],
});

const PROGENY_PARENTING_PRESSURE = makePoint({
  id: 'PROGENY_PARENTING_PRESSURE',
  theme: THEMES.FAMILY_HOME,
  subtype: SUBTYPES[THEMES.FAMILY_HOME].CHILDREN,
  label: 'Progeny — parenting pressure',
  description: 'Responsibility load, stress cycles, and pacing guidance (advisory).',
  defaultScopes: ['daily', 'weekly', 'monthly', 'yearly'],
  polarity: 'negative',
  kind: 'state',
  tags: ['progeny', 'parenting', 'pressure'],
});

const PROGENY_EMOTIONAL_BOND = makePoint({
  id: 'PROGENY_EMOTIONAL_BOND',
  theme: THEMES.FAMILY_HOME,
  subtype: SUBTYPES[THEMES.FAMILY_HOME].CHILDREN,
  label: 'Progeny — emotional bond',
  description: 'Bonding/nurturing direction and emotional connection cycles (non-absolute).',
  defaultScopes: ['weekly', 'monthly', 'yearly', 'life_theme'],
  polarity: 'mixed',
  kind: 'state',
  tags: ['progeny', 'bond', 'emotional'],
});

const FAMILY_CHILD_RESPONSIBILITY_PRESSURE = makePoint({
  id: 'FAMILY_CHILD_RESPONSIBILITY_PRESSURE',
  theme: THEMES.FAMILY_HOME,
  subtype: SUBTYPES[THEMES.FAMILY_HOME].CHILDREN,
  label: 'Parenting responsibility pressure',
  description:
    'Bachchon ki zimmedari, workload ya tension se related parenting stress.',
  polarity: 'negative',
  kind: 'problem',
  tags: ['children', 'parenting', 'stress'],
});

const FAMILY_HOME_PEACEFUL = makePoint({
  id: 'FAMILY_HOME_PEACEFUL',
  theme: THEMES.FAMILY_HOME,
  subtype: SUBTYPES[THEMES.FAMILY_HOME].HOME_ENVIRONMENT,
  label: 'Peaceful home environment',
  description: 'घर का माहौल शांत, loving और secure।',
});

const FAMILY_HOME_TENSION = makePoint({
  id: 'FAMILY_HOME_TENSION',
  theme: THEMES.FAMILY_HOME,
  subtype: SUBTYPES[THEMES.FAMILY_HOME].HOME_ENVIRONMENT,
  label: 'Tension at home',
  description: 'घर में लगातार tension, arguments और heaviness।',
});

const FAMILY_HOME_SHIFT_RELOCATION = makePoint({
  id: 'FAMILY_HOME_SHIFT_RELOCATION',
  theme: THEMES.FAMILY_HOME,
  subtype: SUBTYPES[THEMES.FAMILY_HOME].HOME_ENVIRONMENT,
  label: 'Home shift / relocation',
  description: 'घर बदलना और relocation से जुड़ी ups & downs।',
});

const FAMILY_HOME_OWN_HOUSE_POSSIBILITY = makePoint({
  id: 'FAMILY_HOME_OWN_HOUSE_POSSIBILITY',
  theme: THEMES.FAMILY_HOME,
  subtype: SUBTYPES[THEMES.FAMILY_HOME].FAMILY_PROPERTY_HOME,
  label: 'Apna ghar / property possibility',
  description:
    'Apne ghar / property lene की दिशा ya opportunity window ko highlight karta hai.',
  polarity: 'mixed',
  kind: 'event',
  defaultScopes: ['yearly', 'life_theme'],
  tags: ['home', 'property', 'own_house'],
});

const FAMILY_RENTAL_SHIFT_STRESS = makePoint({
  id: 'FAMILY_RENTAL_SHIFT_STRESS',
  theme: THEMES.FAMILY_HOME,
  subtype: SUBTYPES[THEMES.FAMILY_HOME].FAMILY_PROPERTY_HOME,
  label: 'Bar-bar shifting / rental stress',
  description:
    'Ghar ya shehar frequently change hone se aane wala stress aur instability.',
  polarity: 'negative',
  kind: 'problem',
  tags: ['home', 'rental', 'stress'],
});

// THEME 5: HEALTH_BODY – स्वास्थ्य / शरीर
const HEALTH_ENERGY_HIGH = makePoint({
  id: 'HEALTH_ENERGY_HIGH',
  theme: THEMES.HEALTH_BODY,
  subtype: SUBTYPES[THEMES.HEALTH_BODY].BODY_ENERGY,
  label: 'High body energy',
  description: 'high energy, stamina और body supportive feel।',
});

const HEALTH_ENERGY_LOW_TIRED = makePoint({
  id: 'HEALTH_ENERGY_LOW_TIRED',
  theme: THEMES.HEALTH_BODY,
  subtype: SUBTYPES[THEMES.HEALTH_BODY].BODY_ENERGY,
  label: 'Low energy / tired',
  description: 'थकान, low energy और काम करने का मन न होना।',
});

const HEALTH_SLEEP_DISTURB = makePoint({
  id: 'HEALTH_SLEEP_DISTURB',
  theme: THEMES.HEALTH_BODY,
  subtype: SUBTYPES[THEMES.HEALTH_BODY].BODY_ENERGY,
  label: 'Sleep disturbance',
  description: 'नींद disturb – insomnia या unrest वाला समय।',
});

const HEALTH_ACUTE_ISSUE = makePoint({
  id: 'HEALTH_ACUTE_ISSUE',
  theme: THEMES.HEALTH_BODY,
  subtype: SUBTYPES[THEMES.HEALTH_BODY].ILLNESS_RECOVERY,
  label: 'Acute health issue',
  description: 'sudden minor समस्या (cold / fever type, acute).',
});

const HEALTH_RECOVERY_SUPPORT = makePoint({
  id: 'HEALTH_RECOVERY_SUPPORT',
  theme: THEMES.HEALTH_BODY,
  subtype: SUBTYPES[THEMES.HEALTH_BODY].ILLNESS_RECOVERY,
  label: 'Recovery support',
  description: 'recovery fast होने वाला supportive समय।',
});

const HEALTH_SENSITIVITY_CAUTION = makePoint({
  id: 'HEALTH_SENSITIVITY_CAUTION',
  theme: THEMES.HEALTH_BODY,
  subtype: SUBTYPES[THEMES.HEALTH_BODY].ILLNESS_RECOVERY,
  label: 'Health sensitivity / caution',
  description: 'थोड़ा सावधानी वाला समय – immunity low / overexertion risk।',
});

const HEALTH_LIFESTYLE_IMPROVEMENT_WIN = makePoint({
  id: 'HEALTH_LIFESTYLE_IMPROVEMENT_WIN',
  theme: THEMES.HEALTH_BODY,
  subtype: SUBTYPES[THEMES.HEALTH_BODY].LIFESTYLE_BALANCE,
  label: 'Lifestyle improvement win',
  description: 'lifestyle बदलने का अच्छा मौका (diet, exercise, routine).',
});

const HEALTH_LIFESTYLE_NEGLECT = makePoint({
  id: 'HEALTH_LIFESTYLE_NEGLECT',
  theme: THEMES.HEALTH_BODY,
  subtype: SUBTYPES[THEMES.HEALTH_BODY].LIFESTYLE_BALANCE,
  label: 'Lifestyle neglect',
  description: 'health ignore करना, irregular routine और self-care की कमी।',
});

// Critical health (soft, non-fear based language)
const HEALTH_CRITICAL_SENSITIVITY_PERIOD = makePoint({
  id: 'HEALTH_CRITICAL_SENSITIVITY_PERIOD',
  theme: THEMES.HEALTH_BODY,
  subtype: SUBTYPES[THEMES.HEALTH_BODY].CRITICAL_HEALTH,
  label: 'Health me extra sensitivity ka period',
  description:
    'ऐसा समय जब health par extra dhyan, rest aur precaution ki ज़रूरत ho.',
  polarity: 'negative',
  kind: 'problem',
  defaultScopes: ['monthly', 'yearly'],
  tags: ['health', 'sensitivity', 'precaution'],
});

const HEALTH_OPERATION_WINDOW_SUPPORT = makePoint({
  id: 'HEALTH_OPERATION_WINDOW_SUPPORT',
  theme: THEMES.HEALTH_BODY,
  subtype: SUBTYPES[THEMES.HEALTH_BODY].CRITICAL_HEALTH,
  label: 'Treatment / operation supportive window',
  description:
    'Jab medical treatment ya operation ke लिए relatively supportive window हो सकती है.',
  polarity: 'mixed',
  kind: 'event',
  defaultScopes: ['monthly', 'yearly'],
  tags: ['health', 'treatment', 'support'],
});

const HEALTH_RECOVERY_LONG_TERM = makePoint({
  id: 'HEALTH_RECOVERY_LONG_TERM',
  theme: THEMES.HEALTH_BODY,
  subtype: SUBTYPES[THEMES.HEALTH_BODY].CRITICAL_HEALTH,
  label: 'Long-term recovery phase',
  description:
    'लम्बे समय tak चलने वाली recovery / rehabilitation ka शांत phase.',
  polarity: 'mixed',
  kind: 'state',
  defaultScopes: ['monthly', 'yearly', 'life_theme'],
  tags: ['health', 'recovery', 'long_term'],
});

// Health / Well-being (advanced, non-medical)
const HEALTH_GENERAL = makePoint({
  id: 'HEALTH_GENERAL',
  theme: THEMES.HEALTH_BODY,
  subtype: SUBTYPES[THEMES.HEALTH_BODY].WELL_BEING,
  label: 'Overall health & well-being direction',
  description: 'Non-medical: energy vs strain, recovery direction, routine balance.',
  defaultScopes: ['daily', 'weekly', 'monthly', 'yearly', 'life_theme'],
  polarity: 'mixed',
  kind: 'state',
  tags: ['health', 'wellbeing', 'direction'],
});

const HEALTH_ENERGY_LEVEL = makePoint({
  id: 'HEALTH_ENERGY_LEVEL',
  theme: THEMES.HEALTH_BODY,
  subtype: SUBTYPES[THEMES.HEALTH_BODY].WELL_BEING,
  label: 'Energy level & stamina band',
  description: 'Non-medical: energy band, fatigue sensitivity, recovery pacing.',
  defaultScopes: ['daily', 'weekly', 'monthly', 'yearly', 'life_theme'],
  polarity: 'mixed',
  kind: 'state',
  tags: ['health', 'energy', 'stamina'],
});

const HEALTH_STRESS_PRESSURE = makePoint({
  id: 'HEALTH_STRESS_PRESSURE',
  theme: THEMES.HEALTH_BODY,
  subtype: SUBTYPES[THEMES.HEALTH_BODY].WELL_BEING,
  label: 'Stress pressure & reactivity',
  description: 'Non-medical: stress load sensitivity, pacing, boundaries.',
  defaultScopes: ['daily', 'weekly', 'monthly', 'yearly', 'life_theme'],
  polarity: 'negative',
  kind: 'state',
  tags: ['health', 'stress', 'pressure'],
});

const HEALTH_RECOVERY_PHASE = makePoint({
  id: 'HEALTH_RECOVERY_PHASE',
  theme: THEMES.HEALTH_BODY,
  subtype: SUBTYPES[THEMES.HEALTH_BODY].WELL_BEING,
  label: 'Recovery phase & repair support',
  description: 'Non-medical: recovery windows, repair posture, pacing.',
  defaultScopes: ['daily', 'weekly', 'monthly', 'yearly', 'life_theme'],
  polarity: 'mixed',
  kind: 'state',
  tags: ['health', 'recovery', 'repair'],
});

const HEALTH_IMMUNITY_BALANCE = makePoint({
  id: 'HEALTH_IMMUNITY_BALANCE',
  theme: THEMES.HEALTH_BODY,
  subtype: SUBTYPES[THEMES.HEALTH_BODY].WELL_BEING,
  label: 'Resilience / immunity balance',
  description: 'Non-medical: resilience and recovery stability (no diagnosis).',
  defaultScopes: ['daily', 'weekly', 'monthly', 'yearly', 'life_theme'],
  polarity: 'mixed',
  kind: 'state',
  tags: ['health', 'resilience', 'immunity_balance'],
});

const HEALTH_LIFESTYLE_IMPACT = makePoint({
  id: 'HEALTH_LIFESTYLE_IMPACT',
  theme: THEMES.HEALTH_BODY,
  subtype: SUBTYPES[THEMES.HEALTH_BODY].WELL_BEING,
  label: 'Lifestyle impact on energy',
  description: 'Non-medical: routine consistency vs disruption impact.',
  defaultScopes: ['daily', 'weekly', 'monthly', 'yearly', 'life_theme'],
  polarity: 'mixed',
  kind: 'state',
  tags: ['health', 'lifestyle', 'routine'],
});

const HEALTH_WORK_HEALTH_TRADEOFF = makePoint({
  id: 'HEALTH_WORK_HEALTH_TRADEOFF',
  theme: THEMES.HEALTH_BODY,
  subtype: SUBTYPES[THEMES.HEALTH_BODY].WELL_BEING,
  label: 'Work vs health tradeoff',
  description: 'Non-medical: workload sustainability and recovery tradeoffs.',
  defaultScopes: ['daily', 'weekly', 'monthly', 'yearly', 'life_theme'],
  polarity: 'mixed',
  kind: 'state',
  tags: ['health', 'workload', 'tradeoff'],
});

const HEALTH_LONG_TERM_VITALITY = makePoint({
  id: 'HEALTH_LONG_TERM_VITALITY',
  theme: THEMES.HEALTH_BODY,
  subtype: SUBTYPES[THEMES.HEALTH_BODY].WELL_BEING,
  label: 'Long-term vitality (2–5 year)',
  description: 'Non-medical: long-term vitality direction and resilience cycles.',
  defaultScopes: ['yearly', 'life_theme'],
  polarity: 'mixed',
  kind: 'state',
  tags: ['health', 'long_term', 'vitality'],
});

// THEME 6: MENTAL_STATE – मन / भावनाएँ / mental स्थिति
const MIND_STRESS_SENSITIVE_DAY = makePoint({
  id: 'MIND_STRESS_SENSITIVE_DAY',
  theme: THEMES.MENTAL_STATE,
  subtype: SUBTYPES[THEMES.MENTAL_STATE].STRESS_ANXIETY,
  label: 'Sensitive emotional time',
  description: 'कभी-कभी mind overreact या emotional overflow हो सकता है।',
  polarity: 'negative',
  kind: 'problem',
  defaultScopes: ['hourly', 'daily'],
});

const MIND_ANXIETY_HIGH = makePoint({
  id: 'MIND_ANXIETY_HIGH',
  theme: THEMES.MENTAL_STATE,
  subtype: SUBTYPES[THEMES.MENTAL_STATE].STRESS_ANXIETY,
  label: 'High anxiety / overthinking',
  description: 'overthinking, fear और future worry high।',
  polarity: 'negative',
  kind: 'problem',
  tags: ['anxiety', 'mind', 'stress'],
});

const MIND_STRESS_RELEASE_WINDOW = makePoint({
  id: 'MIND_STRESS_RELEASE_WINDOW',
  theme: THEMES.MENTAL_STATE,
  subtype: SUBTYPES[THEMES.MENTAL_STATE].STRESS_ANXIETY,
  label: 'Stress release window',
  description: 'stress कम होने का window, relief वाला समय।',
});

const MIND_CLARITY_FOCUS = makePoint({
  id: 'MIND_CLARITY_FOCUS',
  theme: THEMES.MENTAL_STATE,
  subtype: SUBTYPES[THEMES.MENTAL_STATE].CONFIDENCE_CLARITY,
  label: 'Clarity & focus',
  description: 'focus अच्छा, decisions clear और mind steady।',
});

const MIND_CONFIDENCE_HIGH_WIN = makePoint({
  id: 'MIND_CONFIDENCE_HIGH_WIN',
  theme: THEMES.MENTAL_STATE,
  subtype: SUBTYPES[THEMES.MENTAL_STATE].CONFIDENCE_CLARITY,
  label: 'High confidence / win',
  description: 'self-belief strong, जीत का feel और bold actions।',
});

const MIND_CONFIDENCE_LOW_SELFDOUBT = makePoint({
  id: 'MIND_CONFIDENCE_LOW_SELFDOUBT',
  theme: THEMES.MENTAL_STATE,
  subtype: SUBTYPES[THEMES.MENTAL_STATE].CONFIDENCE_CLARITY,
  label: 'Low confidence / self-doubt',
  description: 'self-doubt, comparison और under-confidence वाला समय।',
});

const MIND_EMOTIONAL_OVERFLOW = makePoint({
  id: 'MIND_EMOTIONAL_OVERFLOW',
  theme: THEMES.MENTAL_STATE,
  subtype: SUBTYPES[THEMES.MENTAL_STATE].EMOTIONAL_HEALING,
  label: 'Emotional overflow',
  description: 'भावनाएँ बहुत ज़्यादा – tearful, meltdown tendency।',
});

const MIND_HEALING_PROCESS = makePoint({
  id: 'MIND_HEALING_PROCESS',
  theme: THEMES.MENTAL_STATE,
  subtype: SUBTYPES[THEMES.MENTAL_STATE].EMOTIONAL_HEALING,
  label: 'Emotional healing process',
  description: 'पुराने घाव heal होना, forgiveness और release।',
});

const MIND_NEED_FOR_SPACE = makePoint({
  id: 'MIND_NEED_FOR_SPACE',
  theme: THEMES.MENTAL_STATE,
  subtype: SUBTYPES[THEMES.MENTAL_STATE].EMOTIONAL_HEALING,
  label: 'Need for space',
  description: 'अकेले समय की ज़रूरत, recharge लेने की need।',
});

// THEME 7: SPIRITUAL_GROWTH – साधना / अध्यात्म / purpose
const SPIRIT_SADHANA_DEEP = makePoint({
  id: 'SPIRIT_SADHANA_DEEP',
  theme: THEMES.SPIRITUAL_GROWTH,
  subtype: SUBTYPES[THEMES.SPIRITUAL_GROWTH].SADHANA,
  label: 'Deep sadhana',
  description: 'ध्यान / जप में गहराई और inner connection strong।',
});

const SPIRIT_SADHANA_BLOCKED = makePoint({
  id: 'SPIRIT_SADHANA_BLOCKED',
  theme: THEMES.SPIRITUAL_GROWTH,
  subtype: SUBTYPES[THEMES.SPIRITUAL_GROWTH].SADHANA,
  label: 'Sadhana blocked',
  description: 'साधना में मन न लगना, dryness और disconnect।',
});

const SPIRIT_SADHANA_NEW_START = makePoint({
  id: 'SPIRIT_SADHANA_NEW_START',
  theme: THEMES.SPIRITUAL_GROWTH,
  subtype: SUBTYPES[THEMES.SPIRITUAL_GROWTH].SADHANA,
  label: 'New start / return to sadhana',
  description: 'spiritual practice शुरू करने या वापस लाने का अच्छा समय।',
});

const SPIRIT_FAITH_DOUBT = makePoint({
  id: 'SPIRIT_FAITH_DOUBT',
  theme: THEMES.SPIRITUAL_GROWTH,
  subtype: SUBTYPES[THEMES.SPIRITUAL_GROWTH].FAITH_CRISIS,
  label: 'Faith doubt',
  description: 'faith, trust और divine connection पर doubts।',
});

const SPIRIT_FAITH_RENEWAL = makePoint({
  id: 'SPIRIT_FAITH_RENEWAL',
  theme: THEMES.SPIRITUAL_GROWTH,
  subtype: SUBTYPES[THEMES.SPIRITUAL_GROWTH].FAITH_CRISIS,
  label: 'Faith renewal',
  description: 'विश्वास वापस आना, inner reassurance और support।',
});

const SPIRIT_PURPOSE_SEARCH = makePoint({
  id: 'SPIRIT_PURPOSE_SEARCH',
  theme: THEMES.SPIRITUAL_GROWTH,
  subtype: SUBTYPES[THEMES.SPIRITUAL_GROWTH].PURPOSE_MEANING,
  label: 'Purpose search',
  description: '“life me main kya karu?” वाली intense search।',
  defaultScopes: ['yearly', 'life_theme'],
  polarity: 'mixed',
  kind: 'state',
  tags: ['purpose', 'search', 'long_term'],
});

const SPIRIT_PURPOSE_ALIGNMENT_WIN = makePoint({
  id: 'SPIRIT_PURPOSE_ALIGNMENT_WIN',
  theme: THEMES.SPIRITUAL_GROWTH,
  subtype: SUBTYPES[THEMES.SPIRITUAL_GROWTH].PURPOSE_MEANING,
  label: 'Purpose alignment win',
  description: 'काम + purpose align होना, deep satisfaction वाला समय।',
});

// THEME 8: TIMING_LUCK – समय / luck / ups & downs
const TIME_LUCK_SUPPORTIVE_WIN = makePoint({
  id: 'TIME_LUCK_SUPPORTIVE_WIN',
  theme: THEMES.TIMING_LUCK,
  subtype: SUBTYPES[THEMES.TIMING_LUCK].GOOD_PERIOD,
  label: 'Supportive luck / win period',
  description: 'luck supportive – चीज़ें आसानी से बनती हुई दिखें।',
  polarity: 'positive',
  kind: 'achievement',
  tags: ['luck', 'support', 'win'],
});

const TIME_LUCK_HELP_FROM_OTHERS = makePoint({
  id: 'TIME_LUCK_HELP_FROM_OTHERS',
  theme: THEMES.TIMING_LUCK,
  subtype: SUBTYPES[THEMES.TIMING_LUCK].GOOD_PERIOD,
  label: 'Help from others',
  description: 'सही समय पर सही मदद, गुरु या मित्र मिलना।',
});

const TIME_CHALLENGE_TEST_PHASE = makePoint({
  id: 'TIME_CHALLENGE_TEST_PHASE',
  theme: THEMES.TIMING_LUCK,
  subtype: SUBTYPES[THEMES.TIMING_LUCK].CHALLENGE_PERIOD,
  label: 'Challenge / test phase',
  description: 'test/exam type period – patience और resilience सीखने का समय।',
  polarity: 'mixed',
  kind: 'problem',
  tags: ['challenge', 'test', 'growth'],
});

const TIME_DELAY_BLOCKS = makePoint({
  id: 'TIME_DELAY_BLOCKS',
  theme: THEMES.TIMING_LUCK,
  subtype: SUBTYPES[THEMES.TIMING_LUCK].CHALLENGE_PERIOD,
  label: 'Delays / blocks',
  description: 'delays, रुकावटें और slow-motion feeling वाला समय।',
});

const TIME_TURNING_POINT_DECISION = makePoint({
  id: 'TIME_TURNING_POINT_DECISION',
  theme: THEMES.TIMING_LUCK,
  subtype: SUBTYPES[THEMES.TIMING_LUCK].TURNING_POINTS,
  label: 'Turning point decisions',
  description: 'ऐसे decisions जो life direction बदल सकते हैं।',
});

const TIME_END_OF_PHASE = makePoint({
  id: 'TIME_END_OF_PHASE',
  theme: THEMES.TIMING_LUCK,
  subtype: SUBTYPES[THEMES.TIMING_LUCK].TURNING_POINTS,
  label: 'End of a phase',
  description: 'किसी पुराने cycle का naturally close होना।',
});

// THEME 9: EVENTS_CHANGES – events / बड़े बदलाव
const EVENT_TRAVEL_OPPORTUNITY = makePoint({
  id: 'EVENT_TRAVEL_OPPORTUNITY',
  theme: THEMES.EVENTS_CHANGES,
  subtype: SUBTYPES[THEMES.EVENTS_CHANGES].TRAVEL_MOVE,
  label: 'Travel opportunity',
  description: 'यात्रा के अवसर और beneficial movement।',
});

const EVENT_RELOCATION_BIG_CHANGE = makePoint({
  id: 'EVENT_RELOCATION_BIG_CHANGE',
  theme: THEMES.EVENTS_CHANGES,
  subtype: SUBTYPES[THEMES.EVENTS_CHANGES].TRAVEL_MOVE,
  label: 'Relocation / big change',
  description: 'शहर या देश change – बड़ी बदलाव की wave।',
});

const EVENT_EDU_STUDY_FOCUS = makePoint({
  id: 'EVENT_EDU_STUDY_FOCUS',
  theme: THEMES.EVENTS_CHANGES,
  subtype: SUBTYPES[THEMES.EVENTS_CHANGES].EDUCATION_EXAMS,
  label: 'Study focus',
  description: 'पढ़ाई में focus, learning fast होने वाला समय।',
});

const EVENT_EXAM_PRESSURE_STRESS = makePoint({
  id: 'EVENT_EXAM_PRESSURE_STRESS',
  theme: THEMES.EVENTS_CHANGES,
  subtype: SUBTYPES[THEMES.EVENTS_CHANGES].EDUCATION_EXAMS,
  label: 'Exam pressure / stress',
  description: 'exam anxiety और performance pressure।',
  defaultScopes: ['daily', 'weekly'],
  polarity: 'negative',
  kind: 'event',
  tags: ['exam', 'pressure', 'stress'],
});

const EVENT_LEGAL_CONFLICT = makePoint({
  id: 'EVENT_LEGAL_CONFLICT',
  theme: THEMES.EVENTS_CHANGES,
  subtype: SUBTYPES[THEMES.EVENTS_CHANGES].LEGAL_CONFLICTS,
  label: 'Legal conflict phase',
  description: 'court / कानूनी conflict वाला phase (tone soft रखते हुए)।',
});

const EVENT_LEGAL_RESOLUTION_WIN = makePoint({
  id: 'EVENT_LEGAL_RESOLUTION_WIN',
  theme: THEMES.EVENTS_CHANGES,
  subtype: SUBTYPES[THEMES.EVENTS_CHANGES].LEGAL_CONFLICTS,
  label: 'Legal resolution / settlement',
  description: 'legal matters में resolution या settlement के संकेत।',
});

const EVENT_LOSS_GRIEF_PAIN = makePoint({
  id: 'EVENT_LOSS_GRIEF_PAIN',
  theme: THEMES.EVENTS_CHANGES,
  subtype: SUBTYPES[THEMES.EVENTS_CHANGES].LOSS_GRIEF,
  label: 'Loss / grief pain',
  description: 'किसी हानि के बाद grief, shock और emotional dip।',
});

const EVENT_GRIEF_HEALING = makePoint({
  id: 'EVENT_GRIEF_HEALING',
  theme: THEMES.EVENTS_CHANGES,
  subtype: SUBTYPES[THEMES.EVENTS_CHANGES].LOSS_GRIEF,
  label: 'Grief healing',
  description: 'धीरे-धीरे acceptance, healing और peace वापस आना।',
});

// THEME 10: SELF_IDENTITY – खुद की पहचान / expression
const SELF_WORTH_LOW = makePoint({
  id: 'SELF_WORTH_LOW',
  theme: THEMES.SELF_IDENTITY,
  subtype: SUBTYPES[THEMES.SELF_IDENTITY].SELF_WORTH,
  label: 'Low self-worth',
  description: 'खुद को कम आंकना, guilt / shame और दूसरों की बातों से hurt।',
});

const SELF_WORTH_HEALING = makePoint({
  id: 'SELF_WORTH_HEALING',
  theme: THEMES.SELF_IDENTITY,
  subtype: SUBTYPES[THEMES.SELF_IDENTITY].SELF_WORTH,
  label: 'Self-worth healing',
  description: 'self-respect वापस बनना और healthy boundaries सीखना।',
});

const SELF_WORTH_HIGH_HEALTHY = makePoint({
  id: 'SELF_WORTH_HIGH_HEALTHY',
  theme: THEMES.SELF_IDENTITY,
  subtype: SUBTYPES[THEMES.SELF_IDENTITY].SELF_WORTH,
  label: 'Healthy high self-worth',
  description: 'grounded confidence और clearly “ना” बोल पाने की क्षमता।',
});

const SELF_EXPRESSION_BLOCKED = makePoint({
  id: 'SELF_EXPRESSION_BLOCKED',
  theme: THEMES.SELF_IDENTITY,
  subtype: SUBTYPES[THEMES.SELF_IDENTITY].EXPRESSION,
  label: 'Expression blocked',
  description: 'दिल की बात न कह पाना, creative block और inner suppression।',
});

const SELF_EXPRESSION_FLOW = makePoint({
  id: 'SELF_EXPRESSION_FLOW',
  theme: THEMES.SELF_IDENTITY,
  subtype: SUBTYPES[THEMES.SELF_IDENTITY].EXPRESSION,
  label: 'Expression in flow',
  description: 'creativity, speaking, writing सब आसानी से flow करना।',
});

const SELF_BOUNDARY_ISSUES = makePoint({
  id: 'SELF_BOUNDARY_ISSUES',
  theme: THEMES.SELF_IDENTITY,
  subtype: SUBTYPES[THEMES.SELF_IDENTITY].BOUNDARIES,
  label: 'Boundary issues',
  description: 'दूसरों के लिए खुद को over-give करना, exhaustion feel होना।',
});

const SELF_BOUNDARY_HEALTHY = makePoint({
  id: 'SELF_BOUNDARY_HEALTHY',
  theme: THEMES.SELF_IDENTITY,
  subtype: SUBTYPES[THEMES.SELF_IDENTITY].BOUNDARIES,
  label: 'Healthy boundaries',
  description: 'healthy “no”, balance और respect दोनों तरफ से।',
});

// Hierarchical taxonomy: theme → subtype → points
export const problemTaxonomy = {
  [THEMES.MONEY_FINANCE]: {
    id: THEMES.MONEY_FINANCE,
    label: 'धन / वित्त (Money & Finance)',
    subtypes: {
      [SUBTYPES[THEMES.MONEY_FINANCE].BUSINESS]: {
        id: SUBTYPES[THEMES.MONEY_FINANCE].BUSINESS,
        label: 'व्यापार (Business)',
        points: [
          MONEY_BUSINESS_GENERAL,
          MONEY_BUSINESS_START,
          MONEY_BUSINESS_GROWTH_WIN,
          MONEY_BUSINESS_LOSS_RISK,
          MONEY_BUSINESS_PARTNERSHIP_COMPLEX,
        ],
      },
      [SUBTYPES[THEMES.MONEY_FINANCE].JOB_INCOME]: {
        id: SUBTYPES[THEMES.MONEY_FINANCE].JOB_INCOME,
        label: 'नौकरी / वेतन (Job & Income)',
        points: [
          MONEY_JOB_STABILITY,
          MONEY_JOB_PROMOTION_WIN,
        ],
      },
      [SUBTYPES[THEMES.MONEY_FINANCE].BASIC_STABILITY]: {
        id: SUBTYPES[THEMES.MONEY_FINANCE].BASIC_STABILITY,
        label: 'Basic आर्थिक सुरक्षा (Basic Stability)',
        points: [],
      },
      [SUBTYPES[THEMES.MONEY_FINANCE].WEALTH_GROWTH]: {
        id: SUBTYPES[THEMES.MONEY_FINANCE].WEALTH_GROWTH,
        label: 'दीर्घकालिक धन वृद्धि (Wealth Growth)',
        points: [],
      },
      [SUBTYPES[THEMES.MONEY_FINANCE].PERSONAL_FINANCE]: {
        id: SUBTYPES[THEMES.MONEY_FINANCE].PERSONAL_FINANCE,
        label: 'Personal finance (Advanced)',
        points: [
          FINANCE_GENERAL,
          FINANCE_INCOME_FLOW,
          FINANCE_EXPENSE_PRESSURE,
          FINANCE_SAVINGS_GROWTH,
          FINANCE_DEBT_LOAN,
          FINANCE_INVESTMENT_TIMING,
          FINANCE_SUDDEN_GAIN_LOSS,
          FINANCE_LONG_TERM_WEALTH,
        ],
      },
      [SUBTYPES[THEMES.MONEY_FINANCE].SOURCE_OF_EARNINGS]: {
        id: SUBTYPES[THEMES.MONEY_FINANCE].SOURCE_OF_EARNINGS,
        label: 'आय के स्रोत (Source of earnings)',
        points: [],
      },
    },
  },
  [THEMES.CAREER_DIRECTION]: {
    id: THEMES.CAREER_DIRECTION,
    label: 'करियर / दिशा (Career Direction)',
    subtypes: {
      [SUBTYPES[THEMES.CAREER_DIRECTION].CAREER_GROWTH]: {
        id: SUBTYPES[THEMES.CAREER_DIRECTION].CAREER_GROWTH,
        label: 'Career growth',
        points: [
          CAREER_GENERAL,
          CAREER_STABILITY,
          CAREER_GROWTH_PROMOTION,
          CAREER_SKILL_STAGNATION,
        ],
      },
      [SUBTYPES[THEMES.CAREER_DIRECTION].CAREER_CHANGE]: {
        id: SUBTYPES[THEMES.CAREER_DIRECTION].CAREER_CHANGE,
        label: 'Career change',
        points: [
          CAREER_JOB_CHANGE,
        ],
      },
      [SUBTYPES[THEMES.CAREER_DIRECTION].WORK_STRESS]: {
        id: SUBTYPES[THEMES.CAREER_DIRECTION].WORK_STRESS,
        label: 'Work stress',
        points: [
          CAREER_WORKPLACE_CONFLICT,
        ],
      },
      [SUBTYPES[THEMES.CAREER_DIRECTION].EDUCATION]: {
        id: SUBTYPES[THEMES.CAREER_DIRECTION].EDUCATION,
        label: 'Education',
        points: [],
      },
      [SUBTYPES[THEMES.CAREER_DIRECTION].CAREER_SOLUTION]: {
        id: SUBTYPES[THEMES.CAREER_DIRECTION].CAREER_SOLUTION,
        label: 'Career solutions',
        points: [],
      },
      [SUBTYPES[THEMES.CAREER_DIRECTION].CAREER_SUBJECT_CHOICE]: {
        id: SUBTYPES[THEMES.CAREER_DIRECTION].CAREER_SUBJECT_CHOICE,
        label: 'Career subject choice',
        points: [],
      },
      [SUBTYPES[THEMES.CAREER_DIRECTION].JOB_NATURE]: {
        id: SUBTYPES[THEMES.CAREER_DIRECTION].JOB_NATURE,
        label: 'Job nature (Govt vs Private)',
        points: [CAREER_GOVT_JOB_TENDENCY, CAREER_PRIVATE_JOB_PATH],
      },
    },
  },
  [THEMES.RELATIONSHIPS]: {
    id: THEMES.RELATIONSHIPS,
    label: 'रिश्ते (Relationships)',
    subtypes: {
      [SUBTYPES[THEMES.RELATIONSHIPS].LOVE]: {
        id: SUBTYPES[THEMES.RELATIONSHIPS].LOVE,
        label: 'प्रेम (Love)',
        points: [
          RELATIONSHIP_GENERAL,
          RELATIONSHIP_STABILITY,
          RELATIONSHIP_CONFLICT_PATCHUP,
          RELATIONSHIP_EMOTIONAL_DISTANCE,
          LONG_TERM_RELATIONSHIP_BOND,
          REL_LOVE_GENERAL,
          REL_LOVE_BREAKUP_PAIN,
        ],
      },
      [SUBTYPES[THEMES.RELATIONSHIPS].MARRIAGE_PARTNER]: {
        id: SUBTYPES[THEMES.RELATIONSHIPS].MARRIAGE_PARTNER,
        label: 'Marriage / life partner',
        points: [RELATIONSHIP_MARRIAGE_TIMING],
      },
      [SUBTYPES[THEMES.RELATIONSHIPS].FAMILY_RELATIONS]: {
        id: SUBTYPES[THEMES.RELATIONSHIPS].FAMILY_RELATIONS,
        label: 'Family relations',
        points: [
          FAMILY_RELATIONS_GENERAL,
          FAMILY_CONFLICT_PRESSURE,
        ],
      },
      [SUBTYPES[THEMES.RELATIONSHIPS].SOCIAL_CONNECTIONS]: {
        id: SUBTYPES[THEMES.RELATIONSHIPS].SOCIAL_CONNECTIONS,
        label: 'Social connections',
        points: [],
      },
      [SUBTYPES[THEMES.RELATIONSHIPS].PARTNER_LOYALTY]: {
        id: SUBTYPES[THEMES.RELATIONSHIPS].PARTNER_LOYALTY,
        label: 'Partner loyalty / trust',
        points: [],
      },
    },
  },
  [THEMES.FAMILY_HOME]: {
    id: THEMES.FAMILY_HOME,
    label: 'परिवार / घर (Family & Home)',
    subtypes: {
      [SUBTYPES[THEMES.FAMILY_HOME].PARENTS]: {
        id: SUBTYPES[THEMES.FAMILY_HOME].PARENTS,
        label: 'Parents',
        points: [],
      },
      [SUBTYPES[THEMES.FAMILY_HOME].CHILDREN]: {
        id: SUBTYPES[THEMES.FAMILY_HOME].CHILDREN,
        label: 'Children',
        points: [
          PROGENY_GENERAL,
          PROGENY_TIMING_WINDOW,
          PROGENY_DELAY_BLOCK,
          PROGENY_MULTIPLE_TENDENCY,
          PROGENY_PARENTING_PRESSURE,
          PROGENY_EMOTIONAL_BOND,
        ],
      },
      [SUBTYPES[THEMES.FAMILY_HOME].HOME_ENVIRONMENT]: {
        id: SUBTYPES[THEMES.FAMILY_HOME].HOME_ENVIRONMENT,
        label: 'Home environment',
        points: [],
      },
      [SUBTYPES[THEMES.FAMILY_HOME].FAMILY_PROPERTY_HOME]: {
        id: SUBTYPES[THEMES.FAMILY_HOME].FAMILY_PROPERTY_HOME,
        label: 'Family property / home',
        points: [],
      },
    },
  },
  [THEMES.HEALTH_BODY]: {
    id: THEMES.HEALTH_BODY,
    label: 'स्वास्थ्य / शरीर (Health & Body)',
    subtypes: {
      [SUBTYPES[THEMES.HEALTH_BODY].BODY_ENERGY]: {
        id: SUBTYPES[THEMES.HEALTH_BODY].BODY_ENERGY,
        label: 'Body energy',
        points: [],
      },
      [SUBTYPES[THEMES.HEALTH_BODY].ILLNESS_RECOVERY]: {
        id: SUBTYPES[THEMES.HEALTH_BODY].ILLNESS_RECOVERY,
        label: 'Illness & recovery',
        points: [],
      },
      [SUBTYPES[THEMES.HEALTH_BODY].LIFESTYLE_BALANCE]: {
        id: SUBTYPES[THEMES.HEALTH_BODY].LIFESTYLE_BALANCE,
        label: 'Lifestyle balance',
        points: [],
      },
      [SUBTYPES[THEMES.HEALTH_BODY].CRITICAL_HEALTH]: {
        id: SUBTYPES[THEMES.HEALTH_BODY].CRITICAL_HEALTH,
        label: 'Critical health periods',
        points: [],
      },
      [SUBTYPES[THEMES.HEALTH_BODY].WELL_BEING]: {
        id: SUBTYPES[THEMES.HEALTH_BODY].WELL_BEING,
        label: 'Health / Well-being (Advanced)',
        points: [
          HEALTH_GENERAL,
          HEALTH_ENERGY_LEVEL,
          HEALTH_STRESS_PRESSURE,
          HEALTH_RECOVERY_PHASE,
          HEALTH_IMMUNITY_BALANCE,
          HEALTH_LIFESTYLE_IMPACT,
          HEALTH_WORK_HEALTH_TRADEOFF,
          HEALTH_LONG_TERM_VITALITY,
        ],
      },
    },
  },
  [THEMES.MENTAL_STATE]: {
    id: THEMES.MENTAL_STATE,
    label: 'मानसिक स्थिति (Mental State)',
    subtypes: {
      [SUBTYPES[THEMES.MENTAL_STATE].STRESS_ANXIETY]: {
        id: SUBTYPES[THEMES.MENTAL_STATE].STRESS_ANXIETY,
        label: 'Stress & anxiety',
        points: [],
      },
      [SUBTYPES[THEMES.MENTAL_STATE].CONFIDENCE_CLARITY]: {
        id: SUBTYPES[THEMES.MENTAL_STATE].CONFIDENCE_CLARITY,
        label: 'Confidence & clarity',
        points: [],
      },
      [SUBTYPES[THEMES.MENTAL_STATE].EMOTIONAL_HEALING]: {
        id: SUBTYPES[THEMES.MENTAL_STATE].EMOTIONAL_HEALING,
        label: 'Emotional healing',
        points: [],
      },
    },
  },
  [THEMES.SPIRITUAL_GROWTH]: {
    id: THEMES.SPIRITUAL_GROWTH,
    label: 'Spiritual growth',
    subtypes: {
      [SUBTYPES[THEMES.SPIRITUAL_GROWTH].SADHANA]: {
        id: SUBTYPES[THEMES.SPIRITUAL_GROWTH].SADHANA,
        label: 'Sadhana',
        points: [],
      },
      [SUBTYPES[THEMES.SPIRITUAL_GROWTH].FAITH_CRISIS]: {
        id: SUBTYPES[THEMES.SPIRITUAL_GROWTH].FAITH_CRISIS,
        label: 'Faith & trust',
        points: [],
      },
      [SUBTYPES[THEMES.SPIRITUAL_GROWTH].PURPOSE_MEANING]: {
        id: SUBTYPES[THEMES.SPIRITUAL_GROWTH].PURPOSE_MEANING,
        label: 'Purpose & meaning',
        points: [],
      },
    },
  },
  [THEMES.TIMING_LUCK]: {
    id: THEMES.TIMING_LUCK,
    label: 'Timing / luck',
    subtypes: {
      [SUBTYPES[THEMES.TIMING_LUCK].GOOD_PERIOD]: {
        id: SUBTYPES[THEMES.TIMING_LUCK].GOOD_PERIOD,
        label: 'Good periods',
        points: [],
      },
      [SUBTYPES[THEMES.TIMING_LUCK].CHALLENGE_PERIOD]: {
        id: SUBTYPES[THEMES.TIMING_LUCK].CHALLENGE_PERIOD,
        label: 'Challenge periods',
        points: [],
      },
      [SUBTYPES[THEMES.TIMING_LUCK].TURNING_POINTS]: {
        id: SUBTYPES[THEMES.TIMING_LUCK].TURNING_POINTS,
        label: 'Turning points',
        points: [],
      },
    },
  },
  [THEMES.EVENTS_CHANGES]: {
    id: THEMES.EVENTS_CHANGES,
    label: 'Events / big changes',
    subtypes: {
      [SUBTYPES[THEMES.EVENTS_CHANGES].TRAVEL_MOVE]: {
        id: SUBTYPES[THEMES.EVENTS_CHANGES].TRAVEL_MOVE,
        label: 'Travel / relocation',
        points: [],
      },
      [SUBTYPES[THEMES.EVENTS_CHANGES].EDUCATION_EXAMS]: {
        id: SUBTYPES[THEMES.EVENTS_CHANGES].EDUCATION_EXAMS,
        label: 'Education / exams',
        points: [],
      },
      [SUBTYPES[THEMES.EVENTS_CHANGES].LEGAL_CONFLICTS]: {
        id: SUBTYPES[THEMES.EVENTS_CHANGES].LEGAL_CONFLICTS,
        label: 'Legal matters',
        points: [],
      },
      [SUBTYPES[THEMES.EVENTS_CHANGES].LOSS_GRIEF]: {
        id: SUBTYPES[THEMES.EVENTS_CHANGES].LOSS_GRIEF,
        label: 'Loss / grief',
        points: [],
      },
    },
  },
  [THEMES.SELF_IDENTITY]: {
    id: THEMES.SELF_IDENTITY,
    label: 'Self identity & expression',
    subtypes: {
      [SUBTYPES[THEMES.SELF_IDENTITY].SELF_WORTH]: {
        id: SUBTYPES[THEMES.SELF_IDENTITY].SELF_WORTH,
        label: 'Self worth',
        points: [],
      },
      [SUBTYPES[THEMES.SELF_IDENTITY].EXPRESSION]: {
        id: SUBTYPES[THEMES.SELF_IDENTITY].EXPRESSION,
        label: 'Expression',
        points: [],
      },
      [SUBTYPES[THEMES.SELF_IDENTITY].BOUNDARIES]: {
        id: SUBTYPES[THEMES.SELF_IDENTITY].BOUNDARIES,
        label: 'Boundaries',
        points: [],
      },
    },
  },
};

// Flattened access to all points (useful for tools / scripts)
export const allPoints = Object.values(problemTaxonomy).flatMap((theme) =>
  Object.values(theme.subtypes).flatMap((subtype) => subtype.points)
);

// Fast lookup map: pointId -> point definition
const pointsById = allPoints.reduce((acc, point) => {
  acc[point.id] = point;
  return acc;
}, {});

/**
 * Get a point definition by its id (e.g. 'MONEY_BUSINESS_GENERAL')
 */
export function getPointById(pointId) {
  return pointsById[pointId] || null;
}


