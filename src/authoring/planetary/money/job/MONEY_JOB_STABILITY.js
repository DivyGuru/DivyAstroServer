export function getMONEY_JOB_STABILITYVariants() {
  const effectTheme = 'money';
  const area = 'money_job_income';
  const pointId = 'MONEY_JOB_STABILITY';

  return [
    {
      code: 'GENERIC_BASE',
      label: 'Generic draft condition (baseline).',
      condition_tree: { generic_condition: { note: 'Author real job-stability conditions here.' } },
      effect_json: { theme: effectTheme, area, trend: 'mixed', intensity: 0.6, tone: 'mixed', trigger: 'natal', point_id: pointId },
    },
    {
      code: 'GENERIC_SUPPORT',
      label: 'Generic supportive variant.',
      condition_tree: { generic_condition: { note: 'Author real job-stability supportive conditions here.' } },
      effect_json: { theme: effectTheme, area, trend: 'up', intensity: 0.7, tone: 'positive', trigger: 'natal', point_id: pointId },
    },
    {
      code: 'GENERIC_CHALLENGE',
      label: 'Generic challenging variant.',
      condition_tree: { generic_condition: { note: 'Author real job-stability challenging conditions here.' } },
      effect_json: { theme: effectTheme, area, trend: 'down', intensity: 0.7, tone: 'challenging', trigger: 'natal', point_id: pointId },
    },
    {
      code: 'TRANSIT_GENERIC',
      label: 'Generic transit variant (short-term movement).',
      scopes: ['hourly', 'daily', 'weekly'],
      condition_tree: { generic_condition: { note: 'Replace with real transit conditions during authoring.' } },
      effect_json: { theme: effectTheme, area, trend: 'mixed', intensity: 0.5, tone: 'mixed', trigger: 'transit', point_id: pointId },
    },
    {
      code: 'DASHA_GENERIC',
      label: 'Generic dasha variant (longer-term phase).',
      scopes: ['monthly', 'yearly', 'life_theme'],
      condition_tree: { generic_condition: { note: 'Replace with real dasha conditions during authoring.' } },
      effect_json: { theme: effectTheme, area, trend: 'mixed', intensity: 0.5, tone: 'mixed', trigger: 'dasha', point_id: pointId },
    },
  ];
}


