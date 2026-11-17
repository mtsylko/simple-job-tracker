import type { CreateJobFieldInput } from './job-fields';

/**
 * Starter configurations offered once, on the onboarding screen. A preset is
 * pure data, versioned with the code — no DB catalog, no admin. Applying it creates
 * ordinary user-owned taxonomy values and field definitions; nothing keeps
 * referencing the preset afterwards, so the user edits and deletes freely.
 *
 * The taxonomy values are literal strings (the app is English-only, like every
 * other stored taxonomy). Only the preset's own display label/description are UI
 * copy and resolved through i18n by `key`, so they are not stored here.
 */
export type JobPreset = {
  key: string;
  /** Roles of a preset without specializations; the others take them from those. */
  roles: string[];
  levels: string[];
  types: string[];
  customFields: CreateJobFieldInput[];
  /** Broad areas picked before the specializations; absent when there are none. */
  directions?: string[];
  specializations: JobSpecialization[];
};

/** A narrower trade inside a preset's field, picked on its own onboarding step. */
export type JobSpecialization = {
  key: string;
  roles: string[];
  /** Its own seniority ladder, used instead of the field's levels. */
  levels?: string[];
  /** The direction it sits under, on a preset that has directions. */
  direction?: string;
};

/** The work-type list is remoteness, the same three places for every field. */
const WORK_TYPES = ['Remote', 'Hybrid', 'On-site'];

/** The "Other" choice, listed last: a profession-neutral minimum. */
export const GENERIC_PRESET_KEY = 'generic';

export const JOB_PRESETS: JobPreset[] = [
  {
    key: 'software',
    roles: [],
    levels: ['Junior', 'Middle', 'Senior', 'Staff', 'Principal'],
    types: WORK_TYPES,
    customFields: [],
    directions: ['engineering', 'qa', 'management', 'product'],
    specializations: [
      {
        key: 'frontend',
        direction: 'engineering',
        roles: ['Frontend Engineer']
      },
      { key: 'backend', direction: 'engineering', roles: ['Backend Engineer'] },
      {
        key: 'fullstack',
        direction: 'engineering',
        roles: ['Full-stack Engineer']
      },
      { key: 'mobile', direction: 'engineering', roles: ['Mobile Engineer'] },
      {
        key: 'qa',
        direction: 'qa',
        roles: ['QA Engineer', 'Test Automation Engineer']
      },
      { key: 'devops', direction: 'engineering', roles: ['DevOps Engineer'] },
      {
        key: 'data',
        direction: 'engineering',
        roles: ['Data Engineer', 'Data Scientist', 'Data Analyst']
      },
      {
        key: 'security',
        direction: 'engineering',
        roles: ['Security Engineer']
      },
      {
        key: 'management',
        direction: 'management',
        roles: ['Engineering Manager', 'Tech Lead'],
        levels: ['Lead', 'Manager', 'Director', 'VP']
      },
      {
        key: 'product',
        direction: 'product',
        roles: ['Product Manager', 'Project Manager'],
        levels: ['Junior', 'Middle', 'Senior', 'Lead']
      }
    ]
  },
  {
    key: 'design',
    roles: [],
    levels: ['Junior', 'Mid', 'Senior', 'Lead'],
    types: WORK_TYPES,
    customFields: [{ label: 'Portfolio URL', type: 'text' }],
    specializations: [
      { key: 'product-ux', roles: ['Product Designer'] },
      { key: 'ui', roles: ['UI Designer'] },
      { key: 'graphic', roles: ['Graphic Designer', 'Illustrator'] },
      { key: 'motion', roles: ['Motion Designer', '3D Artist'] },
      { key: 'research', roles: ['UX Researcher', 'UX Writer'] }
    ]
  },
  {
    key: 'healthcare',
    roles: [],
    levels: ['Junior', 'Senior', 'Lead'],
    types: WORK_TYPES,
    customFields: [{ label: 'License number', type: 'text' }],
    specializations: [
      {
        key: 'physicians',
        roles: [
          'General Practitioner',
          'Surgeon',
          'Pediatrician',
          'Psychiatrist',
          'Anesthesiologist'
        ],
        levels: [
          'Intern',
          'Resident',
          'Specialist',
          'Consultant',
          'Head of Department'
        ]
      },
      {
        key: 'nursing',
        roles: ['Registered Nurse', 'Midwife'],
        levels: ['Assistant', 'Staff Nurse', 'Senior Nurse', 'Head Nurse']
      },
      { key: 'pharmacy', roles: ['Pharmacist', 'Pharmacy Technician'] },
      { key: 'lab', roles: ['Lab Technician', 'Radiographer'] },
      {
        key: 'allied',
        roles: [
          'Physiotherapist',
          'Occupational Therapist',
          'Speech Therapist',
          'Dietitian'
        ]
      },
      {
        key: 'care',
        roles: ['Caregiver'],
        levels: ['Assistant', 'Senior', 'Coordinator']
      }
    ]
  },
  {
    key: 'finance',
    roles: [],
    levels: ['Junior', 'Senior', 'Manager', 'Director'],
    types: WORK_TYPES,
    customFields: [],
    specializations: [
      { key: 'accounting', roles: ['Accountant', 'Payroll Specialist'] },
      { key: 'audit', roles: ['Auditor', 'Compliance Officer'] },
      {
        key: 'analysis',
        roles: ['Financial Analyst', 'Investment Analyst']
      },
      { key: 'tax', roles: ['Tax Advisor'] },
      { key: 'controlling', roles: ['Controller', 'Treasury Analyst'] }
    ]
  },
  {
    key: 'education',
    roles: [],
    levels: ['Assistant', 'Teacher', 'Senior Teacher', 'Head of Department'],
    types: WORK_TYPES,
    customFields: [],
    specializations: [
      { key: 'school', roles: ['Primary Teacher', 'Secondary Teacher'] },
      {
        key: 'higher',
        roles: ['Lecturer', 'Researcher'],
        levels: ['Assistant', 'Lecturer', 'Senior Lecturer', 'Professor']
      },
      {
        key: 'tutoring',
        roles: ['Tutor', 'Language Teacher'],
        levels: ['Junior', 'Senior']
      },
      { key: 'early', roles: ['Preschool Teacher', 'Nanny'] },
      {
        key: 'admin',
        roles: ['School Administrator', 'Principal'],
        levels: ['Coordinator', 'Manager', 'Director']
      }
    ]
  },
  {
    key: 'sales-marketing',
    roles: [],
    levels: ['Junior', 'Mid', 'Senior', 'Lead'],
    types: WORK_TYPES,
    customFields: [],
    specializations: [
      {
        key: 'sales',
        roles: ['Sales Representative', 'Account Executive']
      },
      {
        key: 'accounts',
        roles: ['Account Manager', 'Customer Success Manager']
      },
      {
        key: 'marketing',
        roles: ['Marketing Manager', 'Performance Marketer']
      },
      {
        key: 'content',
        roles: ['Content Manager', 'Copywriter', 'SEO Specialist']
      }
    ]
  },
  {
    key: GENERIC_PRESET_KEY,
    roles: ['Specialist', 'Manager', 'Coordinator', 'Assistant'],
    levels: ['Junior', 'Mid', 'Senior', 'Lead'],
    types: WORK_TYPES,
    customFields: [],
    specializations: []
  }
];

/** The onboarding screen's answer: a preset and the values the user kept ticked. */
export type ApplyPresetInput = {
  key: string;
  /** Keys of the specializations picked; empty for a preset without any. */
  specializations: string[];
  roles: string[];
  levels: string[];
  types: string[];
  /** Labels of the preset's custom fields to create. */
  customFields: string[];
};

export function findJobPreset(key: string): JobPreset | undefined {
  return JOB_PRESETS.find((preset) => preset.key === key);
}

/**
 * Everything a preset offers for the picked specializations, deduped in catalog
 * order: their roles, and their own levels or else the field's.
 */
export function presetOffer(
  preset: JobPreset,
  specializationKeys: string[]
): Omit<JobPreset, 'key' | 'specializations'> {
  if (preset.specializations.length === 0) {
    return preset;
  }
  const picked = new Set(specializationKeys);
  const chosen = preset.specializations.filter((spec) => picked.has(spec.key));
  const unique = (values: string[]) => [...new Set(values)];
  return {
    roles: unique(chosen.flatMap((spec) => spec.roles)),
    levels: unique(chosen.flatMap((spec) => spec.levels ?? preset.levels)),
    types: preset.types,
    customFields: preset.customFields
  };
}
