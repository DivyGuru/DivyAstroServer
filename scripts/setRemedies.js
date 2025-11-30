#!/usr/bin/env node

// Authoring script: Set initial remedies for a problem taxonomy point.
// Usage:
//   node scripts/setRemedies.js MONEY_BUSINESS_GENERAL

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getPointById, THEMES } from '../src/config/problemTaxonomy.js';
import { query } from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function printHeader(title) {
  console.log('='.repeat(60));
  console.log(title);
  console.log('='.repeat(60));
}

async function saveRemediesJson(point, remedies) {
  const dir = path.resolve(
    __dirname,
    '../astro-authoring/remedies',
    point.theme,
    point.subtype
  );
  await fs.promises.mkdir(dir, { recursive: true });

  const filePath = path.join(dir, `${point.id}.remedies.json`);

  const payload = {
    pointId: point.id,
    theme: point.theme,
    subtype: point.subtype,
    polarity: point.polarity,
    kind: point.kind,
    defaultScopes: point.defaultScopes,
    remedies,
  };

  await fs.promises.writeFile(filePath, JSON.stringify(payload, null, 2), 'utf8');
  console.log(`\n💾 Saved draft remedies to ${filePath}`);
}

// Map taxonomy theme → prediction_theme enum-ish tags for remedies
function mapThemeToPredictionTheme(theme) {
  switch (theme) {
    case THEMES.MONEY_FINANCE:
      return 'money';
    case THEMES.CAREER_DIRECTION:
      return 'career';
    case THEMES.RELATIONSHIPS:
      return 'relationship';
    case THEMES.FAMILY_HOME:
      return 'family';
    case THEMES.HEALTH_BODY:
      return 'health';
    case THEMES.MENTAL_STATE:
      return 'mental_state';
    case THEMES.SPIRITUAL_GROWTH:
      return 'spirituality';
    default:
      return 'general';
  }
}

function generateRemediesForPoint(point) {
  const themeTag = mapThemeToPredictionTheme(point.theme);

  if (point.theme === THEMES.MENTAL_STATE) {
    return [
      {
        type: 'meditation',
        name: 'Breath awareness meditation',
        description:
          'Spend 10–15 minutes daily observing the natural flow of your breath to calm the mind and reduce overthinking.',
        target_planets: [],
        target_themes: [themeTag],
        min_duration_days: 21,
        recommended_frequency: 'daily',
        safety_notes: 'Practice in a comfortable posture, stop if you feel dizzy or unwell.',
      },
      {
        type: 'meditation',
        name: 'Guided body scan relaxation',
        description:
          'Once a day, slowly scan attention from head to toe, relaxing each area and noticing sensations without judgment.',
        target_planets: [],
        target_themes: [themeTag],
        min_duration_days: 21,
        recommended_frequency: 'daily',
        safety_notes: 'Practice lying down or seated; avoid if you have conditions that make stillness uncomfortable for long periods.',
      },
      {
        type: 'donation',
        name: 'Support a mental health cause',
        description:
          'Once a week, make a small donation or contribution to a trusted mental health or emotional well-being initiative.',
        target_planets: [],
        target_themes: [themeTag, 'general'],
        min_duration_days: 28,
        recommended_frequency: 'weekly',
        safety_notes: 'Give only within your financial comfort; focus on sincerity rather than amount.',
      },
      {
        type: 'feeding_beings',
        name: 'Small act of kindness',
        description:
          'Regularly perform a simple act of kindness for someone in need, such as offering help, listening, or sharing food.',
        target_planets: [],
        target_themes: [themeTag, 'general'],
        min_duration_days: 21,
        recommended_frequency: 'weekly',
        safety_notes: 'Ensure your own boundaries and safety are respected while helping others.',
      },
      {
        type: 'mantra',
        name: 'Calming affirmation repetition',
        description:
          'Repeat a gentle, self-supportive affirmation such as "I am safe and I am learning to relax" for a few minutes daily.',
        target_planets: [],
        target_themes: [themeTag],
        min_duration_days: 30,
        recommended_frequency: 'daily',
        safety_notes: 'Use wording that feels emotionally safe and non-triggering for you.',
      },
      {
        type: 'meditation',
        name: 'Mindful walking',
        description:
          'Take a short daily walk while gently noticing your breath, body sensations and surroundings without analysing them.',
        target_planets: [],
        target_themes: [themeTag],
        min_duration_days: 21,
        recommended_frequency: 'daily',
        safety_notes:
          'Remain aware of your environment and personal safety while walking; avoid using this practice in unsafe locations.',
      },
      {
        type: 'mantra',
        name: 'Grounding phrase repetition',
        description:
          'Repeat a simple grounding phrase such as "One step at a time" or "I can handle this moment" for a few minutes whenever anxiety rises.',
        target_planets: [],
        target_themes: [themeTag],
        min_duration_days: 30,
        recommended_frequency: 'as_needed',
        safety_notes: 'Choose phrases that feel genuinely supportive rather than harsh or demanding.',
      },
    ];
  }

  if (point.theme === THEMES.RELATIONSHIPS) {
    return [
      {
        type: 'meditation',
        name: 'Empathic listening practice',
        description:
          'Once a week, offer 10–15 minutes of focused, non-judgmental listening to a loved one without interrupting.',
        target_planets: [],
        target_themes: [themeTag],
        min_duration_days: 30,
        recommended_frequency: 'weekly',
        safety_notes: 'Do this only in emotionally safe relationships; do not force conversations that feel unsafe.',
      },
      {
        type: 'feeding_beings',
        name: 'Gentle act of service',
        description:
          'Once a week, perform a small act of service or care for someone outside yourself to soften emotional rigidity in relationships.',
        target_planets: [],
        target_themes: [themeTag, 'general'],
        min_duration_days: 21,
        recommended_frequency: 'weekly',
        safety_notes: 'Help only within your energy and time limits; avoid over-giving.',
      },
      {
        type: 'meditation',
        name: 'Loving-kindness meditation',
        description:
          'Spend a few minutes sending simple wishes of well-being first to yourself and then to close people, such as "May I be peaceful, may they be peaceful."',
        target_planets: [],
        target_themes: [themeTag],
        min_duration_days: 21,
        recommended_frequency: 'daily',
        safety_notes: 'If thinking of certain people is triggering, keep the practice focused on yourself or neutral figures.',
      },
      {
        type: 'donation',
        name: 'Relationship-supportive charity',
        description:
          'Make small, heartfelt contributions to causes that support families, children, or community harmony.',
        target_planets: [],
        target_themes: [themeTag, 'general'],
        min_duration_days: 30,
        recommended_frequency: 'monthly',
        safety_notes: 'Choose reputable causes and give only what feels comfortable.',
      },
      {
        type: 'mantra',
        name: 'Soft communication intention',
        description:
          'Before important conversations, take a minute to silently set the intention to speak honestly and kindly, and to listen fully.',
        target_planets: [],
        target_themes: [themeTag],
        min_duration_days: 14,
        recommended_frequency: 'as_needed',
        safety_notes: 'Use this to support, not to suppress genuine feelings that need to be expressed.',
      },
      {
        type: 'meditation',
        name: 'Heart-centered breathing',
        description:
          'Spend a few minutes breathing slowly while placing attention on the heart area, inviting warmth and openness towards yourself and others.',
        target_planets: [],
        target_themes: [themeTag],
        min_duration_days: 21,
        recommended_frequency: 'daily',
        safety_notes:
          'If difficult emotions surface, slow down and ground yourself; consider talking to a trusted person or professional.',
      },
      {
        type: 'feeding_beings',
        name: 'Shared meal or tea time',
        description:
          'From time to time, invite someone you care about to share a simple meal or cup of tea with the intention of relaxed connection.',
        target_planets: [],
        target_themes: [themeTag, 'general'],
        min_duration_days: 28,
        recommended_frequency: 'weekly',
        safety_notes: 'Only do this in relationships where you feel reasonably safe and respected.',
      },
    ];
  }

  if (point.theme === THEMES.HEALTH_BODY) {
    return [
      {
        type: 'meditation',
        name: 'Gentle body awareness',
        description:
          'Spend a few minutes each day noticing how your body feels, without judgment, to build a kinder connection with your physical state.',
        target_planets: [],
        target_themes: [themeTag],
        min_duration_days: 30,
        recommended_frequency: 'daily',
        safety_notes:
          'This practice is not a substitute for medical care; always follow the guidance of your healthcare professionals.',
      },
      {
        type: 'meditation',
        name: 'Relaxed breathing breaks',
        description:
          'Take short breaks during the day to breathe slowly and deeply for a few cycles, relaxing the shoulders and jaw.',
        target_planets: [],
        target_themes: [themeTag],
        min_duration_days: 21,
        recommended_frequency: 'daily',
        safety_notes: 'If you have respiratory or cardiac conditions, breathe gently and within comfort.',
      },
      {
        type: 'donation',
        name: 'Support health-related causes',
        description:
          'Offer small, regular support to organizations that work for health, nutrition or healing for others.',
        target_planets: [],
        target_themes: [themeTag, 'general'],
        min_duration_days: 30,
        recommended_frequency: 'monthly',
        safety_notes: 'Give only what is financially comfortable; intention matters more than amount.',
      },
      {
        type: 'feeding_beings',
        name: 'Share nourishing food',
        description:
          'Whenever possible, share fresh, simple, nourishing food with someone who may benefit from it.',
        target_planets: [],
        target_themes: [themeTag, 'general'],
        min_duration_days: 21,
        recommended_frequency: 'weekly',
        safety_notes: 'Ensure hygiene and respect dietary restrictions of the recipient.',
      },
      {
        type: 'mantra',
        name: 'Kindness towards the body',
        description:
          'Once a day, mentally thank your body for one thing it allowed you to do, reinforcing a more compassionate inner attitude.',
        target_planets: [],
        target_themes: [themeTag],
        min_duration_days: 30,
        recommended_frequency: 'daily',
        safety_notes: 'This is a mindset practice and should never replace medical treatment.',
      },
      {
        type: 'meditation',
        name: 'Evening wind-down breathing',
        description:
          'Before sleep, spend a few minutes breathing more slowly and gently, allowing the body to soften and release the day.',
        target_planets: [],
        target_themes: [themeTag],
        min_duration_days: 21,
        recommended_frequency: 'daily',
        safety_notes:
          'People with respiratory or cardiac conditions should keep the practice very gentle and consult professionals if unsure.',
      },
      {
        type: 'donation',
        name: 'Support basic health supplies',
        description:
          'Whenever feasible, contribute small amounts or items towards clean water, food or basic medical support for others.',
        target_planets: [],
        target_themes: [themeTag, 'general'],
        min_duration_days: 30,
        recommended_frequency: 'monthly',
        safety_notes:
          'Verify that any organisation or person you support is trustworthy; give only what feels sustainable for you.',
      },
    ];
  }

  if (point.theme === THEMES.SPIRITUAL_GROWTH) {
    return [
      {
        type: 'mantra',
        name: 'Simple name or mantra repetition',
        description:
          'Spend 5–10 minutes daily repeating a peaceful name or short mantra that naturally uplifts you.',
        target_planets: [],
        target_themes: [themeTag],
        min_duration_days: 40,
        recommended_frequency: 'daily',
        safety_notes: 'There are no rigid rules; practice in a way that feels respectful and sincere to you.',
      },
      {
        type: 'meditation',
        name: 'Quiet sitting with intention',
        description:
          'Sit quietly for a few minutes each day with the intention to be present and available to deeper guidance, without forcing any experience.',
        target_planets: [],
        target_themes: [themeTag],
        min_duration_days: 30,
        recommended_frequency: 'daily',
        safety_notes: 'If strong emotions arise, consider seeking support from a trusted guide or professional.',
      },
      {
        type: 'donation',
        name: 'Offer support to genuine spiritual work',
        description:
          'From time to time, support teachers, centers or initiatives that you feel are genuinely working for upliftment.',
        target_planets: [],
        target_themes: [themeTag, 'general'],
        min_duration_days: 40,
        recommended_frequency: 'monthly',
        safety_notes: 'Support only paths and teachers you personally resonate with and trust.',
      },
      {
        type: 'feeding_beings',
        name: 'Selfless act of service',
        description:
          'Choose a small, selfless act of service that you can do regularly without expectation of return.',
        target_planets: [],
        target_themes: [themeTag, 'general'],
        min_duration_days: 30,
        recommended_frequency: 'weekly',
        safety_notes: 'Do not compromise your own basic needs or safety while serving others.',
      },
      {
        type: 'mantra',
        name: 'Gratitude reflection',
        description:
          'At the end of the day, recall one or two moments you felt supported or guided, and mentally offer gratitude.',
        target_planets: [],
        target_themes: [themeTag],
        min_duration_days: 21,
        recommended_frequency: 'daily',
        safety_notes: 'This is an inner contemplation; there is no right or wrong way to feel.',
      },
      {
        type: 'donation',
        name: 'Quiet support for contemplative spaces',
        description:
          'Offer simple, unobtrusive support to spaces such as libraries, retreat centers or places of reflection that help people turn inward.',
        target_planets: [],
        target_themes: [themeTag, 'general'],
        min_duration_days: 30,
        recommended_frequency: 'monthly',
        safety_notes:
          'Support only environments you feel are ethical and balanced; avoid groups that pressure or manipulate.',
      },
      {
        type: 'meditation',
        name: 'Nature contemplation',
        description:
          'When possible, sit quietly in a natural setting, noticing patterns in the sky, trees or water, and allowing a sense of connection to something larger.',
        target_planets: [],
        target_themes: [themeTag],
        min_duration_days: 21,
        recommended_frequency: 'weekly',
        safety_notes:
          'Choose safe outdoor locations and protect yourself from harsh weather or environmental risks.',
      },
    ];
  }

  // Default money / practical-support remedies
  return [
    {
      type: 'donation',
      name: 'Simple weekly giving',
      description:
        'Once a week, offer a small, comfortable amount or useful item to someone who genuinely needs support, with a relaxed and generous attitude.',
      target_planets: [5], // e.g. 5 = Jupiter in your internal system
      target_themes: [themeTag],
      min_duration_days: 40,
      recommended_frequency: 'weekly',
      safety_notes: 'Give only within your financial comfort; there should be no fear or pressure around giving.',
    },
    {
      type: 'meditation',
      name: 'Breath awareness for money stress',
      description:
        'Spend 10–15 minutes focusing on slow, steady breathing while gently acknowledging and relaxing worries about business or income.',
      target_planets: [],
      target_themes: [themeTag, 'general'],
      min_duration_days: 21,
      recommended_frequency: 'daily',
      safety_notes: 'Practice in a comfortable posture; stop if you feel strain or discomfort.',
    },
    {
      type: 'feeding_beings',
      name: 'Share food or resources',
      description:
        'Regularly share a small portion of food or resources with people, animals or initiatives connected to nourishment and stability.',
      target_planets: [],
      target_themes: [themeTag, 'general'],
      min_duration_days: 30,
      recommended_frequency: 'weekly',
      safety_notes: 'Ensure safe and hygienic sharing; respect local guidelines and personal boundaries.',
    },
    {
      type: 'mantra',
      name: 'Abundance mindset reflection',
      description:
        'Once a day, reflect for a few minutes on areas where life is already providing enough, supporting a calmer attitude towards money.',
      target_planets: [],
      target_themes: [themeTag],
      min_duration_days: 30,
      recommended_frequency: 'daily',
      safety_notes: 'Use this to balance fear, not to avoid practical financial planning.',
    },
    {
      type: 'donation',
      name: 'Support skill-building or education',
      description:
        'Whenever possible, support skill-building, education or training efforts that help you or others create more sustainable income.',
      target_planets: [],
      target_themes: [themeTag, 'career'],
      min_duration_days: 40,
      recommended_frequency: 'monthly',
      safety_notes: 'Invest only in learning or initiatives you have reasonably researched and trust.',
    },
    {
      type: 'mantra',
      name: 'Calm decision affirmation',
      description:
        'Before major financial choices, repeat a brief affirmation such as "I decide with clarity, care and patience" to steady your mindset.',
      target_planets: [],
      target_themes: [themeTag],
      min_duration_days: 21,
      recommended_frequency: 'as_needed',
      safety_notes:
        'Use this to support clear thinking, while still checking facts and, when necessary, consulting professionals.',
    },
    {
      type: 'meditation',
      name: 'Short financial clarity pause',
      description:
        'Take a few slow breaths and observe your thoughts about money for a couple of minutes before acting, so that reactions become more thoughtful.',
      target_planets: [],
      target_themes: [themeTag, 'general'],
      min_duration_days: 21,
      recommended_frequency: 'daily',
      safety_notes:
        'If financial stress feels overwhelming, consider seeking personalised guidance from a qualified advisor or counsellor.',
    },
  ];
}

async function insertOrUpdateRemedies(point, remedies) {
  const inserted = [];

  for (const remedy of remedies) {
    const fullName = `[${point.id}] ${remedy.name}`;

    // Merge point theme tag into target_themes
    const themeTag = mapThemeToPredictionTheme(point.theme);
    const mergedThemes = Array.from(
      new Set([themeTag, ...(remedy.target_themes || [])].filter(Boolean))
    );

    // Check for existing remedy by name
    const existing = await query('SELECT id FROM remedies WHERE name = $1 LIMIT 1', [fullName]);

    if (existing.rows.length > 0) {
      const remedyId = existing.rows[0].id;
      const updateSql = `
        UPDATE remedies
        SET type = $2,
            description = $3,
            target_planets = $4,
            target_themes = $5,
            min_duration_days = $6,
            recommended_frequency = $7,
            safety_notes = $8,
            is_active = TRUE
        WHERE id = $1
        RETURNING *;
      `;

      const res = await query(updateSql, [
        remedyId,
        remedy.type,
        remedy.description,
        remedy.target_planets && remedy.target_planets.length > 0 ? remedy.target_planets : null,
        mergedThemes.length > 0 ? mergedThemes : null,
        remedy.min_duration_days,
        remedy.recommended_frequency,
        remedy.safety_notes,
      ]);

      inserted.push(res.rows[0]);
    } else {
      const insertSql = `
        INSERT INTO remedies (
          name,
          type,
          description,
          target_planets,
          target_themes,
          min_duration_days,
          recommended_frequency,
          safety_notes,
          is_active
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE)
        RETURNING *;
      `;

      const res = await query(insertSql, [
        fullName,
        remedy.type,
        remedy.description,
        remedy.target_planets && remedy.target_planets.length > 0 ? remedy.target_planets : null,
        mergedThemes.length > 0 ? mergedThemes : null,
        remedy.min_duration_days,
        remedy.recommended_frequency,
        remedy.safety_notes,
      ]);

      inserted.push(res.rows[0]);
    }
  }

  return inserted;
}

async function main() {
  const pointId = process.argv[2];

  printHeader('🧪 setRemedies');

  if (!pointId) {
    console.error('❌ pointId missing.');
    console.error('   Usage: node scripts/setRemedies.js MONEY_BUSINESS_GENERAL');
    process.exit(1);
  }

  console.log(`➡️  Point ID: ${pointId}\n`);

  const point = getPointById(pointId);
  if (!point) {
    console.error(`❌ Point not found in taxonomy: ${pointId}`);
    process.exit(1);
  }

  console.log('🧩 Point metadata:');
  console.log(JSON.stringify(point, null, 2));

  try {
    const remedies = generateRemediesForPoint(point);
    console.log('\n📝 Mock remedies (preview):');
    console.log(JSON.stringify(remedies, null, 2));

    // Save to authoring JSON file (for AI / manual editing)
    await saveRemediesJson(point, remedies);

    const inserted = await insertOrUpdateRemedies(point, remedies);
    console.log('\n💊 Remedies inserted:');
    inserted.forEach((r) => {
      console.log(`   id=${r.id}, name=${r.name}, type=${r.type}`);
    });

    console.log('\n✅ setRemedies completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error in setRemedies:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  // eslint-disable-next-line no-console
  main();
}


