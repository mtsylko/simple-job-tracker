import { Navigate, useParams } from 'react-router-dom';

import { taxonomiesListPath } from '@/app/routes';
import { isCategorySlug } from '@/features/taxonomies/categories';
import { TaxonomiesPage } from '@/features/taxonomies/pages/taxonomies-page';
import { useTaxonomyLists } from '@/features/taxonomies/use-taxonomy-lists';
import { useStatusList } from '@/features/taxonomies/use-status-list';

export function TaxonomiesRoute() {
  const { list } = useParams<{ list: string }>();
  const {
    state,
    addValue,
    renameValue,
    removeValue,
    setDefaultValue,
    reorderValues
  } = useTaxonomyLists();

  const status = useStatusList();

  if (!isCategorySlug(list)) {
    return <Navigate to={taxonomiesListPath('roles')} replace />;
  }

  return (
    <TaxonomiesPage
      slug={list}
      state={state}
      onAdd={addValue}
      onRename={renameValue}
      onDelete={removeValue}
      onSetDefault={setDefaultValue}
      onReorder={reorderValues}
      statusState={status.state}
      onStatusAdd={status.add}
      onStatusRename={(id, value) => status.update(id, { value })}
      onStatusColorChange={(id, color) => status.update(id, { color })}
      onStatusToggleTab={(id, showAsTab) => status.update(id, { showAsTab })}
      onStatusDelete={status.remove}
      onStatusSetDefault={status.setDefault}
      onStatusReorder={status.reorder}
    />
  );
}
