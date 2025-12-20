export function getCAREER_PRIVATE_JOB_PATHVariants() {
  const effectTheme = 'career';
  const area = 'job_nature';
  const pointId = 'CAREER_PRIVATE_JOB_PATH';

  return [
    {
      code: 'GENERIC_BASE',
      label: 'Generic draft condition (baseline).',
      condition_tree: { generic_condition: { note: 'Author real private-job path conditions here.' } },
      effect_json: { theme: effectTheme, area, trend: 'mixed', intensity: 0.6, tone: 'mixed', trigger: 'natal', point_id: pointId },
    },
    {
      code: 'GENERIC_SUPPORT',
      label: 'Generic supportive variant.',
      condition_tree: { generic_condition: { note: 'Author real supportive private-job path conditions here.' } },
      effect_json: { theme: effectTheme, area, trend: 'up', intensity: 0.65, tone: 'positive', trigger: 'natal', point_id: pointId },
    },
    {
      code: 'TRANSIT_GENERIC',
      label: 'Generic transit variant.',
      scopes: ['daily', 'weekly', 'monthly'],
      condition_tree: { generic_condition: { note: 'Replace with real transit conditions during authoring.' } },
      effect_json: { theme: effectTheme, area, trend: 'mixed', intensity: 0.5, tone: 'mixed', trigger: 'transit', point_id: pointId },
    },
    {
      code: 'DASHA_GENERIC',
      label: 'Generic dasha variant.',
      scopes: ['monthly', 'yearly', 'life_theme'],
      condition_tree: { generic_condition: { note: 'Replace with real dasha conditions during authoring.' } },
      effect_json: { theme: effectTheme, area, trend: 'mixed', intensity: 0.5, tone: 'mixed', trigger: 'dasha', point_id: pointId },
    },
  ];
}


