import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import type { ApiErrorCode } from '@job-tracker/shared';

import {
  DEFAULT_LANGUAGE,
  LANGUAGES,
  resolveInitialLanguage,
  storeLanguage,
  type Language
} from '@/app/language';

import common from '@/locales/en/common.json';
import auth from '@/locales/en/auth.json';
import jobs from '@/locales/en/jobs.json';
import analytics from '@/locales/en/analytics.json';
import cvVersions from '@/locales/en/cvVersions.json';
import taxonomies from '@/locales/en/taxonomies.json';
import jobFields from '@/locales/en/jobFields.json';
import companies from '@/locales/en/companies.json';
import profile from '@/locales/en/profile.json';
import mailConnection from '@/locales/en/mailConnection.json';
import mailMatch from '@/locales/en/mailMatch.json';
import mailQueue from '@/locales/en/mailQueue.json';
import adminUsers from '@/locales/en/adminUsers.json';
import feedback from '@/locales/en/feedback.json';
import adminFeedback from '@/locales/en/adminFeedback.json';
import adminTranslations from '@/locales/en/adminTranslations.json';
import apiErrors from '@/locales/en/apiErrors.json';
import legal from '@/locales/en/legal.json';

import plCommon from '@/locales/pl/common.json';
import plAuth from '@/locales/pl/auth.json';
import plJobs from '@/locales/pl/jobs.json';
import plAnalytics from '@/locales/pl/analytics.json';
import plCvVersions from '@/locales/pl/cvVersions.json';
import plTaxonomies from '@/locales/pl/taxonomies.json';
import plJobFields from '@/locales/pl/jobFields.json';
import plCompanies from '@/locales/pl/companies.json';
import plProfile from '@/locales/pl/profile.json';
import plMailConnection from '@/locales/pl/mailConnection.json';
import plMailMatch from '@/locales/pl/mailMatch.json';
import plMailQueue from '@/locales/pl/mailQueue.json';
import plAdminUsers from '@/locales/pl/adminUsers.json';
import plFeedback from '@/locales/pl/feedback.json';
import plAdminFeedback from '@/locales/pl/adminFeedback.json';
import plApiErrors from '@/locales/pl/apiErrors.json';
import plLegal from '@/locales/pl/legal.json';
import plAdminTranslations from '@/locales/pl/adminTranslations.json';

import ruCommon from '@/locales/ru/common.json';
import ruAuth from '@/locales/ru/auth.json';
import ruJobs from '@/locales/ru/jobs.json';
import ruAnalytics from '@/locales/ru/analytics.json';
import ruCvVersions from '@/locales/ru/cvVersions.json';
import ruTaxonomies from '@/locales/ru/taxonomies.json';
import ruJobFields from '@/locales/ru/jobFields.json';
import ruCompanies from '@/locales/ru/companies.json';
import ruProfile from '@/locales/ru/profile.json';
import ruMailConnection from '@/locales/ru/mailConnection.json';
import ruMailMatch from '@/locales/ru/mailMatch.json';
import ruMailQueue from '@/locales/ru/mailQueue.json';
import ruAdminUsers from '@/locales/ru/adminUsers.json';
import ruFeedback from '@/locales/ru/feedback.json';
import ruAdminFeedback from '@/locales/ru/adminFeedback.json';
import ruAdminTranslations from '@/locales/ru/adminTranslations.json';
import ruApiErrors from '@/locales/ru/apiErrors.json';
import ruLegal from '@/locales/ru/legal.json';

import beCommon from '@/locales/be/common.json';
import beAuth from '@/locales/be/auth.json';
import beJobs from '@/locales/be/jobs.json';
import beAnalytics from '@/locales/be/analytics.json';
import beCvVersions from '@/locales/be/cvVersions.json';
import beTaxonomies from '@/locales/be/taxonomies.json';
import beJobFields from '@/locales/be/jobFields.json';
import beCompanies from '@/locales/be/companies.json';
import beProfile from '@/locales/be/profile.json';
import beMailConnection from '@/locales/be/mailConnection.json';
import beMailMatch from '@/locales/be/mailMatch.json';
import beMailQueue from '@/locales/be/mailQueue.json';
import beAdminUsers from '@/locales/be/adminUsers.json';
import beFeedback from '@/locales/be/feedback.json';
import beAdminFeedback from '@/locales/be/adminFeedback.json';
import beAdminTranslations from '@/locales/be/adminTranslations.json';
import beApiErrors from '@/locales/be/apiErrors.json';
import beLegal from '@/locales/be/legal.json';

import ukCommon from '@/locales/uk/common.json';
import ukAuth from '@/locales/uk/auth.json';
import ukJobs from '@/locales/uk/jobs.json';
import ukAnalytics from '@/locales/uk/analytics.json';
import ukCvVersions from '@/locales/uk/cvVersions.json';
import ukTaxonomies from '@/locales/uk/taxonomies.json';
import ukJobFields from '@/locales/uk/jobFields.json';
import ukCompanies from '@/locales/uk/companies.json';
import ukProfile from '@/locales/uk/profile.json';
import ukMailConnection from '@/locales/uk/mailConnection.json';
import ukMailMatch from '@/locales/uk/mailMatch.json';
import ukMailQueue from '@/locales/uk/mailQueue.json';
import ukAdminUsers from '@/locales/uk/adminUsers.json';
import ukFeedback from '@/locales/uk/feedback.json';
import ukAdminFeedback from '@/locales/uk/adminFeedback.json';
import ukAdminTranslations from '@/locales/uk/adminTranslations.json';
import ukApiErrors from '@/locales/uk/apiErrors.json';
import ukLegal from '@/locales/uk/legal.json';

export const defaultNS = 'common';

const en = {
  common,
  auth,
  jobs,
  analytics,
  cvVersions,
  taxonomies,
  jobFields,
  companies,
  profile,
  mailConnection,
  mailMatch,
  mailQueue,
  adminUsers,
  feedback,
  adminFeedback,
  adminTranslations,
  // A code the API can send without English copy fails the build.
  apiErrors: apiErrors satisfies Record<ApiErrorCode, string>,
  legal
};

/** English's key tree with any string, so a key missing from a translation fails the build. */
type Translation<T> = {
  [K in keyof T]: T[K] extends string ? string : Translation<T[K]>;
};

const pl: Translation<typeof en> = {
  common: plCommon,
  auth: plAuth,
  jobs: plJobs,
  analytics: plAnalytics,
  cvVersions: plCvVersions,
  taxonomies: plTaxonomies,
  jobFields: plJobFields,
  companies: plCompanies,
  profile: plProfile,
  mailConnection: plMailConnection,
  mailMatch: plMailMatch,
  mailQueue: plMailQueue,
  adminUsers: plAdminUsers,
  feedback: plFeedback,
  adminFeedback: plAdminFeedback,
  adminTranslations: plAdminTranslations,
  apiErrors: plApiErrors,
  legal: plLegal
};

const ru: Translation<typeof en> = {
  common: ruCommon,
  auth: ruAuth,
  jobs: ruJobs,
  analytics: ruAnalytics,
  cvVersions: ruCvVersions,
  taxonomies: ruTaxonomies,
  jobFields: ruJobFields,
  companies: ruCompanies,
  profile: ruProfile,
  mailConnection: ruMailConnection,
  mailMatch: ruMailMatch,
  mailQueue: ruMailQueue,
  adminUsers: ruAdminUsers,
  feedback: ruFeedback,
  adminFeedback: ruAdminFeedback,
  adminTranslations: ruAdminTranslations,
  apiErrors: ruApiErrors,
  legal: ruLegal
};

const be: Translation<typeof en> = {
  common: beCommon,
  auth: beAuth,
  jobs: beJobs,
  analytics: beAnalytics,
  cvVersions: beCvVersions,
  taxonomies: beTaxonomies,
  jobFields: beJobFields,
  companies: beCompanies,
  profile: beProfile,
  mailConnection: beMailConnection,
  mailMatch: beMailMatch,
  mailQueue: beMailQueue,
  adminUsers: beAdminUsers,
  feedback: beFeedback,
  adminFeedback: beAdminFeedback,
  adminTranslations: beAdminTranslations,
  apiErrors: beApiErrors,
  legal: beLegal
};

const uk: Translation<typeof en> = {
  common: ukCommon,
  auth: ukAuth,
  jobs: ukJobs,
  analytics: ukAnalytics,
  cvVersions: ukCvVersions,
  taxonomies: ukTaxonomies,
  jobFields: ukJobFields,
  companies: ukCompanies,
  profile: ukProfile,
  mailConnection: ukMailConnection,
  mailMatch: ukMailMatch,
  mailQueue: ukMailQueue,
  adminUsers: ukAdminUsers,
  feedback: ukFeedback,
  adminFeedback: ukAdminFeedback,
  adminTranslations: ukAdminTranslations,
  apiErrors: ukApiErrors,
  legal: ukLegal
};

/** The copy as shipped; the live store starts as a copy, so admin overrides never reach these. */
export const bundledResources = { en, pl, ru, be, uk };

i18n.on('languageChanged', (language) => {
  document.documentElement.lang = language;
});

void i18n.use(initReactI18next).init({
  lng: resolveInitialLanguage(),
  fallbackLng: DEFAULT_LANGUAGE,
  supportedLngs: LANGUAGES,
  defaultNS,
  // i18next writes into the objects it is given, so it gets its own copy.
  resources: structuredClone(bundledResources),
  interpolation: {
    escapeValue: false
  },
  // Re-renders on overrides added after the first paint.
  react: {
    bindI18nStore: 'added'
  }
});

/** Switches the UI language and remembers it as an explicit choice. */
export function setLanguage(language: Language): void {
  storeLanguage(language);
  void i18n.changeLanguage(language);
}

export default i18n;
