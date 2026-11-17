import type { TFunction } from 'i18next';

import { type JobRow } from '@/features/jobs/types';

function csvCell(
  value: string | boolean | number | null | undefined,
  t: TFunction<'jobs'>
): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'boolean') {
    return value ? t('export.booleanTrue') : t('export.booleanFalse');
  }
  const s = String(value);
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
    t('export.headers.customCv'),
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
      '',
      job.salaryRange,
      job.salaryExpectations,
      job.cv,
      job.appliedAt,
      job.statusChangedAt,
      job.type,
      job.employmentType,
      job.contractType,
      job.location,
      ''
    ]
      .map((value) => csvCell(value, t))
      .join(',')
  );

  const csv = [HEADERS.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `interviews-export-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
