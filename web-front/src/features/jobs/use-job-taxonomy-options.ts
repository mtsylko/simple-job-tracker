import {
  listJobContractTypeOptions,
  listJobEmploymentTypeOptions,
  listJobLevelOptions,
  listJobRoleOptions,
  listJobTypeOptions
} from '@/features/jobs/job-api';
import { useAsyncData } from '@/hooks/use-async-data';

const EMPTY: string[] = [];

export function useJobTaxonomyOptions() {
  const { data: roleOptions } = useAsyncData(listJobRoleOptions, EMPTY);
  const { data: levelOptions } = useAsyncData(listJobLevelOptions, EMPTY);
  const { data: typeOptions } = useAsyncData(listJobTypeOptions, EMPTY);
  const { data: employmentTypeOptions } = useAsyncData(
    listJobEmploymentTypeOptions,
    EMPTY
  );
  const { data: contractTypeOptions } = useAsyncData(
    listJobContractTypeOptions,
    EMPTY
  );

  return {
    roleOptions,
    levelOptions,
    typeOptions,
    employmentTypeOptions,
    contractTypeOptions
  };
}
