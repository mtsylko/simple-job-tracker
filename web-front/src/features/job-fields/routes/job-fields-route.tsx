import { JobFieldsPage } from '@/features/job-fields/pages/JobFieldsPage';
import { useJobFields } from '@/features/job-fields/use-job-fields';

export function JobFieldsRoute() {
  const { state, add, update, remove } = useJobFields();

  return (
    <JobFieldsPage
      state={state}
      onAdd={add}
      onUpdate={update}
      onDelete={remove}
    />
  );
}
