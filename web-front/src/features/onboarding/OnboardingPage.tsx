import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  findJobPreset,
  presetOffer,
  type ApplyPresetInput
} from '@job-tracker/shared';

import { Modal } from '@/components/Modal';
import { Button } from '@/components/ui/button';
import { notify } from '@/lib/notifications';

import { applyPreset, skipOnboarding } from './onboarding-api';
import { PresetPickStep } from './components/PresetPickStep';
import {
  PresetChoiceStep,
  type PresetChoiceGroup
} from './components/PresetChoiceStep';
import {
  PresetReviewStep,
  type PresetValueGroup
} from './components/PresetReviewStep';

type Step = 'pick' | 'direction' | 'specialize' | 'review';
type GroupKey = Exclude<keyof ApplyPresetInput, 'key' | 'specializations'>;

const valueId = (groupKey: string, value: string) => `${groupKey}:${value}`;

const toggled =
  (key: string) =>
  (current: ReadonlySet<string>): ReadonlySet<string> => {
    const next = new Set(current);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    return next;
  };

function errorDetail(error: unknown): string | undefined {
  return error instanceof Error && error.message.trim().length > 0
    ? error.message
    : undefined;
}

/**
 * Shown once, before the app, to a user who has not been through it yet. Picking
 * a preset or skipping it both close it for good, so a preset can never be
 * applied by accident later.
 */
export function OnboardingPage({ onDone }: { onDone: () => void }) {
  const { t } = useTranslation(['taxonomies', 'common']);
  const [step, setStep] = useState<Step>('pick');
  const [pickedKey, setPickedKey] = useState<string | null>(null);
  const [dirKeys, setDirKeys] = useState<ReadonlySet<string>>(new Set());
  const [specKeys, setSpecKeys] = useState<ReadonlySet<string>>(new Set());
  const [excluded, setExcluded] = useState<ReadonlySet<string>>(new Set());
  const [pending, setPending] = useState<'apply' | 'skip' | null>(null);
  const [isConfirmingSkip, setIsConfirmingSkip] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const shownStep = useRef(step);

  // The button that changed the step may be gone, so focus moves to the new title.
  useEffect(() => {
    if (shownStep.current === step) {
      return;
    }
    shownStep.current = step;
    headingRef.current?.focus();
  }, [step]);

  const preset = pickedKey ? findJobPreset(pickedKey) : undefined;
  const hasDirections = (preset?.directions?.length ?? 0) > 0;

  // Before any direction is picked, every direction counts, so the step total holds.
  const specGroups = useMemo(() => {
    if (!preset) {
      return [];
    }
    if (!preset.directions?.length) {
      return [{ key: preset.key, specs: preset.specializations }];
    }
    const directions = preset.directions.filter(
      (direction) => dirKeys.size === 0 || dirKeys.has(direction)
    );
    return directions.map((direction) => ({
      key: direction,
      specs: preset.specializations.filter(
        (spec) => spec.direction === direction
      )
    }));
  }, [preset, dirKeys]);

  // A direction with a single specialization brings it in without asking.
  const choosableGroups = specGroups.filter((group) => group.specs.length > 1);
  const needsSpecStep = choosableGroups.length > 0;

  // Catalog order, so the review step and the request list them alike.
  const pickedSpecs = useMemo(() => {
    if (!preset || (hasDirections && dirKeys.size === 0)) {
      return [];
    }
    const included = new Set(
      specGroups.flatMap((group) =>
        group.specs
          .filter((spec) => group.specs.length === 1 || specKeys.has(spec.key))
          .map((spec) => spec.key)
      )
    );
    return preset.specializations.filter((spec) => included.has(spec.key));
  }, [preset, hasDirections, dirKeys, specGroups, specKeys]);

  const groups = useMemo<Array<PresetValueGroup & { key: GroupKey }>>(() => {
    if (!preset) {
      return [];
    }
    const offer = presetOffer(
      preset,
      pickedSpecs.map((spec) => spec.key)
    );
    const all: Array<PresetValueGroup & { key: GroupKey }> = [
      { key: 'roles', title: t('sections.role.title'), values: offer.roles },
      {
        key: 'levels',
        title: t('sections.level.title'),
        values: offer.levels
      },
      { key: 'types', title: t('sections.type.title'), values: offer.types },
      {
        key: 'customFields',
        title: t('presets.fieldsGroup'),
        values: offer.customFields.map((field) => field.label)
      }
    ];
    return all.filter((group) => group.values.length > 0);
  }, [preset, pickedSpecs, t]);

  const isExcluded = (groupKey: string, value: string) =>
    excluded.has(valueId(groupKey, value));

  const keptValues = (groupKey: GroupKey) =>
    groups
      .find((group) => group.key === groupKey)
      ?.values.filter((value) => !isExcluded(groupKey, value)) ?? [];

  const keptTotal = groups.reduce(
    (sum, group) => sum + keptValues(group.key).length,
    0
  );

  const pick = (key: string) => {
    // Clicking the picked card again after Back keeps the choices made since.
    if (key === pickedKey) {
      return;
    }
    setPickedKey(key);
    setDirKeys(new Set());
    setSpecKeys(new Set());
    setExcluded(new Set());
  };

  const toggleDirection = (key: string) => setDirKeys(toggled(key));
  const toggleSpec = (key: string) => setSpecKeys(toggled(key));

  const toggle = (groupKey: string, value: string) => {
    setExcluded((current) => {
      const next = new Set(current);
      const id = valueId(groupKey, value);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleGroup = (group: PresetValueGroup, include: boolean) => {
    setExcluded((current) => {
      const next = new Set(current);
      for (const value of group.values) {
        const id = valueId(group.key, value);
        if (include) {
          next.delete(id);
        } else {
          next.add(id);
        }
      }
      return next;
    });
  };

  const skip = async () => {
    setPending('skip');
    try {
      await skipOnboarding();
      onDone();
    } catch (error) {
      notify.error(t('presets.skipError'), errorDetail(error));
      setPending(null);
    }
  };

  const finish = async () => {
    if (!preset || keptTotal === 0) {
      await skip();
      return;
    }
    setPending('apply');
    try {
      await applyPreset({
        key: preset.key,
        specializations: pickedSpecs.map((spec) => spec.key),
        roles: keptValues('roles'),
        levels: keptValues('levels'),
        types: keptValues('types'),
        customFields: keptValues('customFields')
      });
      onDone();
    } catch (error) {
      notify.error(t('presets.applyError'), errorDetail(error));
      setPending(null);
    }
  };

  const isBusy = pending !== null;
  const steps: Step[] = [
    'pick',
    ...(hasDirections ? (['direction'] as const) : []),
    ...(!preset || needsSpecStep ? (['specialize'] as const) : []),
    'review'
  ];
  const stepAt = (offset: number) => steps[steps.indexOf(step) + offset];
  const specLabel = (key: string) =>
    preset ? t(`presets.options.${preset.key}.specializations.${key}`) : key;
  const directionLabel = (key: string) =>
    preset ? t(`presets.options.${preset.key}.directions.${key}`) : key;

  const directionGroups: PresetChoiceGroup[] = [
    {
      key: 'directions',
      choices: (preset?.directions ?? []).map((direction) => ({
        key: direction,
        label: directionLabel(direction)
      }))
    }
  ];
  // Areas with a single specialization come in as they are, shown as fixed tiles.
  const lockedGroups = hasDirections
    ? specGroups.filter((group) => group.specs.length === 1)
    : [];
  const specChoiceGroups: PresetChoiceGroup[] = [
    ...choosableGroups.map((group) => ({
      key: group.key,
      title:
        hasDirections && specGroups.length > 1
          ? directionLabel(group.key)
          : undefined,
      choices: group.specs.map((spec) => ({
        key: spec.key,
        label: specLabel(spec.key)
      }))
    })),
    ...(lockedGroups.length > 0
      ? [
          {
            key: 'included',
            title: t('presets.includedTitle'),
            locked: true,
            choices: lockedGroups.map((group) => ({
              key: group.specs[0].key,
              label: directionLabel(group.key)
            }))
          }
        ]
      : [])
  ];
  const choosableSpecPicked = choosableGroups.some((group) =>
    group.specs.some((spec) => specKeys.has(spec.key))
  );

  // What the user chose so far, as one plain line above the title.
  const contextItems =
    step === 'review'
      ? pickedSpecs.map((spec) => specLabel(spec.key))
      : step === 'specialize' && hasDirections
        ? (preset?.directions ?? [])
            .filter((key) => dirKeys.has(key))
            .map((key) => directionLabel(key))
        : [];
  const context =
    step !== 'pick' && preset
      ? [t(`presets.options.${preset.key}.label`), contextItems.join(', ')]
          .filter(Boolean)
          .join(' · ')
      : null;

  const titles: Record<Step, { title: string; subtitle: string }> = {
    pick: {
      title: t('presets.pickTitle'),
      subtitle: t('presets.pickSubtitle')
    },
    direction: {
      title: t('presets.directionTitle'),
      subtitle: t('presets.directionSubtitle')
    },
    specialize: {
      title: t('presets.specializeTitle'),
      subtitle: t('presets.specializeSubtitle')
    },
    review: {
      title: t('presets.reviewTitle'),
      subtitle: t('presets.reviewSubtitle')
    }
  };

  return (
    // #root clips its overflow; this box scrolls only on a screen too short for the card.
    <div className="min-h-0 flex-1 overflow-y-auto bg-warm-bg">
      <div className="flex h-full flex-col items-center px-5 pt-8 sm:px-8 sm:pb-8 lg:py-10">
        <header className="mb-6 flex w-full max-w-[960px] shrink-0 items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img
              src="/icon.svg"
              alt=""
              className="size-8 shrink-0 rounded-md"
            />
            <span className="font-serif text-lg font-medium tracking-tight text-ink">
              {t('brand.name', { ns: 'common' })}
            </span>
          </div>
          <span className="text-sm text-ink-3">
            {/* The total depends on the answers until the areas are picked. */}
            {step === 'specialize' || step === 'review'
              ? t('presets.step', {
                  current: steps.indexOf(step) + 1,
                  total: steps.length
                })
              : t('presets.stepNumber', { current: steps.indexOf(step) + 1 })}
          </span>
        </header>

        {/* One card height on every step: the title and the footer stay put, only the step's list scrolls. */}
        <main className="flex min-h-0 w-full max-w-[960px] flex-1 flex-col sm:max-h-[800px] sm:overflow-hidden sm:rounded-xl sm:border sm:border-border sm:bg-card">
          <div className="flex shrink-0 flex-col gap-2 pb-5 sm:px-10 sm:pt-9">
            {/* Kept on step one too, empty, so the title never shifts. */}
            <p className="m-0 min-h-5 truncate text-sm text-ink-3">{context}</p>
            <h1
              ref={headingRef}
              tabIndex={-1}
              className="m-0 font-serif text-3xl font-normal leading-tight tracking-tight text-foreground outline-none"
            >
              {titles[step].title}
            </h1>
            <p className="m-0 max-w-[640px] min-h-[3lh] text-ink-2 sm:min-h-[2lh]">
              {titles[step].subtitle}
            </p>
          </div>

          {/* Keyed by step, so a new step starts scrolled to its top. */}
          <div
            key={step}
            className="-mx-5 min-h-40 flex-1 overflow-y-auto px-5 pt-1 pb-6 [scrollbar-gutter:stable] sm:mx-0 sm:px-10 sm:pb-8"
          >
            {step === 'pick' && (
              <PresetPickStep pickedKey={pickedKey} onPick={pick} />
            )}
            {step === 'direction' && (
              <PresetChoiceStep
                groups={directionGroups}
                picked={dirKeys}
                onToggle={toggleDirection}
              />
            )}
            {step === 'specialize' && (
              <PresetChoiceStep
                groups={specChoiceGroups}
                picked={specKeys}
                onToggle={toggleSpec}
              />
            )}
            {step === 'review' && (
              <PresetReviewStep
                groups={groups}
                isExcluded={isExcluded}
                onToggle={toggle}
                onToggleGroup={toggleGroup}
              />
            )}
          </div>

          {/* Skipping cannot be undone, so it keeps one place on every step, away from the primary. */}
          <div className="-mx-5 flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-border bg-warm-bg px-5 py-3 sm:mx-0 sm:bg-card sm:px-10 sm:pt-6 sm:pb-9">
            <Button
              type="button"
              variant="ghost"
              size="lg"
              className="-ml-3"
              disabled={isBusy}
              // Once a field is picked there are choices to lose, so skipping asks first.
              onClick={() =>
                pickedKey ? setIsConfirmingSkip(true) : void skip()
              }
            >
              {t('presets.skip')}
            </Button>
            <div className="ml-auto flex flex-wrap items-center gap-3">
              {step !== 'pick' && (
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  disabled={isBusy}
                  onClick={() => setStep(stepAt(-1))}
                >
                  {t('presets.back')}
                </Button>
              )}
              {step !== 'review' && (
                <Button
                  type="button"
                  size="lg"
                  disabled={
                    isBusy ||
                    (step === 'pick' && !preset) ||
                    (step === 'direction' && dirKeys.size === 0) ||
                    (step === 'specialize' && !choosableSpecPicked)
                  }
                  onClick={() => setStep(stepAt(1))}
                >
                  {t('presets.next')}
                </Button>
              )}
              {step === 'review' && (
                <Button
                  type="button"
                  size="lg"
                  disabled={isBusy}
                  onClick={() => void finish()}
                >
                  {keptTotal === 0
                    ? t('presets.addNone')
                    : t('presets.add', { count: keptTotal })}
                </Button>
              )}
            </div>
          </div>
        </main>
      </div>

      <Modal
        open={isConfirmingSkip}
        title={t('presets.skipConfirmTitle')}
        description={t('presets.skipConfirmBody')}
        cancelLabel={t('presets.skipConfirmCancel')}
        confirmLabel={t('presets.skipConfirm')}
        onConfirm={() => {
          setIsConfirmingSkip(false);
          void skip();
        }}
        onCancel={() => setIsConfirmingSkip(false)}
      />
    </div>
  );
}
