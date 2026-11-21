import type { TFunction } from 'i18next';
import { normalizeCompanyName } from '@job-tracker/shared';

import { saveBlobAs } from '@/features/cv-versions/attachment';
import { useBlacklistStore } from '@/features/companies/blacklist-store';
import { type JobRow } from '@/features/jobs/types';

// Excel reads a file without a byte order mark as the system code page and garbles Cyrillic and Polish letters.
const BYTE_ORDER_MARK = '\uFEFF';

// A cell starting with one of these runs as a formula when the file is opened in a spreadsheet.
const FORMULA_START = /^[=+\-@\t\r]/;

function csvCell(
  value: string | boolean | number | null | undefined,
  t: TFunction<'jobs'>
): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'boolean') {
    return value ? t('export.booleanTrue') : t('export.booleanFalse');
  }
  let s = String(value);
  if (FORMULA_START.test(s)) {
    s = `'${s}`;
  }
  if (
    s.includes(',') ||
    s.includes('"') ||
    s.includes('\n') ||
    s.includes('\r')
  ) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function exportApplicationsCSV(
  jobs: JobRow[],
  t: TFunction<'jobs'>
): void {
  const HEADERS = [
    t('export.headers.id'),
    t('export.headers.companyName'),
    t('export.headers.isProductCompany'),
    t('export.headers.notes'),
    t('export.headers.applicationQuestions'),
    t('export.headers.jobPostLink'),
    t('export.headers.role'),
    t('export.headers.level'),
    t('export.headers.stage'),
    t('export.headers.outcome'),
    t('export.headers.salaryRange'),
    t('export.headers.mySalaryExpectations'),
    t('export.headers.cv'),
    t('export.headers.dateOfApplication'),
    t('export.headers.statusChanged'),
    t('export.headers.type'),
    t('export.headers.employmentType'),
    t('export.headers.contractType'),
    t('export.headers.location'),
    t('export.headers.blacklisted')
  ];

  const blacklist = useBlacklistStore.getState();
  // Left empty rather than "False" while the blacklist has not loaded.
  const isBlacklisted = (company: string) =>
    blacklist.isLoaded
      ? blacklist.byCompany.has(normalizeCompanyName(company))
      : null;

  const rows = jobs.map((job) =>
    [
      job.id,
      job.company,
      job.isProductCompany,
      job.notes,
      job.applicationQuestions,
      job.jobPostLink,
      job.role,
      job.level,
      job.status,
      job.outcome,
      job.salaryRange,
      job.salaryExpectations,
      job.cv,
      job.appliedAt,
      job.statusChangedAt,
      job.type,
      job.employmentType,
      job.contractType,
      job.location,
      isBlacklisted(job.company)
    ]
      .map((value) => csvCell(value, t))
      .join(',')
  );

  const csv = BYTE_ORDER_MARK + [HEADERS.join(','), ...rows].join('\n');
  saveBlobAs(
    new Blob([csv], { type: 'text/csv;charset=utf-8;' }),
    `interviews-export-${new Date().toISOString().slice(0, 10)}.csv`
  );
}
