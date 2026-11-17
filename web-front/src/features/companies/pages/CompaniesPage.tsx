import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { normalizeCompanyName, type CompanySummary } from '@job-tracker/shared';

import { Modal } from '@/components/Modal';
import { PageTabs } from '@/components/PageTabs';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput
} from '@/components/ui/input-group';
import { BlacklistDialog } from '@/features/companies/components/BlacklistDialog';
import { BlacklistPanel } from '@/features/companies/components/BlacklistPanel';
import { CompaniesTable } from '@/features/companies/components/CompaniesTable';
import { ReasonDialog } from '@/features/companies/components/ReasonDialog';
import type { CompaniesTab } from '@/features/companies/types';
import type { CompaniesState } from '@/features/companies/use-companies';
import { useCompanyBlacklisting } from '@/features/companies/use-company-blacklisting';
import { notify } from '@/lib/notifications';

export function CompaniesPage({
  state,
  tab,
  onTabChange,
  onAddToBlacklist,
  onUpdateReason,
  onRemoveFromBlacklist,
  onBlacklisted
}: {
  state: CompaniesState;
  tab: CompaniesTab;
  onTabChange: (tab: CompaniesTab) => void;
  onAddToBlacklist: (company: string, reason: string | null) => Promise<void>;
  onUpdateReason: (id: string, reason: string | null) => Promise<void>;
  onRemoveFromBlacklist: (company: CompanySummary) => Promise<void>;
  onBlacklisted: () => void;
}) {
  const { t } = useTranslation('companies');
  const [search, setSearch] = useState('');
  // Kept after the dialog closes so its title survives the exit animation.
  const [pendingRemoval, setPendingRemoval] = useState<CompanySummary | null>(
    null
  );
  const [isRemoveOpen, setIsRemoveOpen] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const requestRemoval = (company: CompanySummary) => {
    setPendingRemoval(company);
    setIsRemoveOpen(true);
  };
  // Kept after closing for the same reason as the removal above.
  const [reasonCompany, setReasonCompany] = useState<CompanySummary | null>(
    null
  );
  const [isReasonOpen, setIsReasonOpen] = useState(false);
  const [isSavingReason, setIsSavingReason] = useState(false);

  const requestReasonEdit = (company: CompanySummary) => {
    setReasonCompany(company);
    setIsReasonOpen(true);
  };
  const {
    companyPendingBlacklist,
    isBlacklisting,
    requestBlacklist,
    cancelBlacklist,
    confirmBlacklist
  } = useCompanyBlacklisting(onBlacklisted);

  // Most recently blacklisted first, as the standalone page listed them.
  const blacklisted = useMemo(
    () =>
      state.companies
        .filter((company) => company.blacklist)
        .sort((a, b) =>
          (b.blacklist?.blacklistedAt ?? '').localeCompare(
            a.blacklist?.blacklistedAt ?? ''
          )
        ),
    [state.companies]
  );

  const query = normalizeCompanyName(search);
  const visible = (
    tab === 'blacklisted' ? blacklisted : state.companies
  ).filter(
    (company) => !query || normalizeCompanyName(company.name).includes(query)
  );
  const emptyMessage = query
    ? t('list.noMatch')
    : t(tab === 'blacklisted' ? 'blacklisted.empty' : 'list.empty');

  const confirmRemoval = async () => {
    if (!pendingRemoval) {
      return;
    }
    setIsRemoving(true);
    try {
      await onRemoveFromBlacklist(pendingRemoval);
      setIsRemoveOpen(false);
    } finally {
      setIsRemoving(false);
    }
  };

  // A failed save keeps the dialog open so the typed reason is not lost.
  const saveReason = async (reason: string | null) => {
    if (!reasonCompany?.id) {
      return;
    }
    setIsSavingReason(true);
    try {
      await onUpdateReason(reasonCompany.id, reason);
      setIsReasonOpen(false);
    } catch (error) {
      notify.error(
        t('blacklist.reasonFailed', { company: reasonCompany.name }),
        error instanceof Error ? error.message : undefined
      );
    } finally {
      setIsSavingReason(false);
    }
  };

  return (
    <main className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-col gap-1 px-4 pb-4 pt-5 sm:px-7 sm:pb-5 sm:pt-7">
        <h1 className="m-0 font-serif text-3xl font-normal leading-tight tracking-tight text-foreground">
          {t('page.title')}
        </h1>
        <p className="text-sm text-muted-foreground">{t('page.subtitle')}</p>
      </div>

      <PageTabs
        tabs={[
          {
            key: 'all',
            label: t('tabs.all'),
            count: state.isLoading ? undefined : state.companies.length
          },
          {
            key: 'blacklisted',
            label: t('tabs.blacklisted'),
            count: state.isLoading ? undefined : blacklisted.length
          }
        ]}
        value={tab}
        onChange={onTabChange}
      />

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-20 pt-4 sm:px-7">
        <div className="flex flex-col gap-4">
          <InputGroup className="w-full sm:w-56">
            <InputGroupAddon align="inline-start">
              <Search className="size-3.5" aria-hidden="true" />
            </InputGroupAddon>
            <InputGroupInput
              aria-label={t('page.searchLabel')}
              placeholder={t('page.searchPlaceholder')}
              value={search}
              onChange={(event) => setSearch(event.currentTarget.value)}
            />
          </InputGroup>

          <div className="overflow-hidden rounded-xl border border-warm-line bg-card">
            {state.error ? (
              <p className="px-5 py-4 text-sm text-destructive">
                {state.error}
              </p>
            ) : state.isLoading ? (
              <p className="px-5 py-4 text-sm text-muted-foreground">…</p>
            ) : tab === 'blacklisted' ? (
              <BlacklistPanel
                companies={visible}
                emptyMessage={emptyMessage}
                onAdd={onAddToBlacklist}
                onEditReason={requestReasonEdit}
                onRemove={requestRemoval}
              />
            ) : (
              <CompaniesTable
                companies={visible}
                emptyMessage={emptyMessage}
                onBlacklist={(company) => requestBlacklist(company.name)}
                onUnblacklist={requestRemoval}
              />
            )}
          </div>
        </div>
      </div>

      <BlacklistDialog
        company={companyPendingBlacklist}
        isPending={isBlacklisting}
        onConfirm={(reason) => void confirmBlacklist(reason)}
        onCancel={cancelBlacklist}
      />

      <ReasonDialog
        open={isReasonOpen}
        company={reasonCompany}
        isPending={isSavingReason}
        onConfirm={(reason) => void saveReason(reason)}
        onCancel={() => setIsReasonOpen(false)}
      />

      <Modal
        open={isRemoveOpen}
        tone="danger"
        title={t('removeDialog.title', { company: pendingRemoval?.name ?? '' })}
        description={t('removeDialog.body')}
        confirmLabel={t('removeDialog.confirm')}
        cancelLabel={t('form.cancel')}
        confirmPending={isRemoving}
        onConfirm={() => void confirmRemoval()}
        onCancel={() => setIsRemoveOpen(false)}
      />
    </main>
  );
}
