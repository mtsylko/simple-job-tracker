import { useCallback, useEffect, useRef, useState } from 'react';

import i18n from '@/i18n';
import { notify } from '@/lib/notifications';
import {
  fetchFormLayout,
  saveFormLayout
} from '@/features/jobs/form-layout-api';

import {
  defaultOrders,
  reconcileLayout,
  toLayout,
  type FieldOrders,
  type FormSection,
  type SectionField
} from './form-layout-model';

export {
  FORM_SECTION_FIELDS,
  type FieldOrders,
  type FormSection,
  type SectionField
} from './form-layout-model';

/**
 * The layout belongs to the signed-in user and only changes through `reorder`, so it
 * is fetched once per session rather than on every mount. Re-fetching per mount made
 * the form paint the declaration order first and reshuffle when the GET landed.
 */
let cachedOrders: FieldOrders | null = null;
let pendingLoad: Promise<FieldOrders> | null = null;

/** Shared across mounts so two forms opened at once issue a single request. */
function loadOrders(): Promise<FieldOrders> {
  if (cachedOrders) {
    return Promise.resolve(cachedOrders);
  }

  pendingLoad ??= fetchFormLayout()
    .then((layout) => {
      cachedOrders = reconcileLayout(layout);
      return cachedOrders;
    })
    .finally(() => {
      // Cleared either way: a failed load should be retried on the next open.
      pendingLoad = null;
    });

  return pendingLoad;
}

/**
 * Per-section field order, persisted per user.
 *
 * Reordering applies immediately and saves in the background; a failed save is
 * rolled back so what is on screen always matches what is stored.
 *
 * `isReady` is false only while the first load of the session is in flight — the
 * caller should hold the fields back until then rather than render an order that is
 * about to change.
 */
export function useFormFieldOrder() {
  const [orders, setOrders] = useState<FieldOrders>(
    () => cachedOrders ?? defaultOrders()
  );
  const [isReady, setIsReady] = useState(cachedOrders !== null);
  // Mirrors `orders` so `reorder` can read the current value without taking it as
  // a dependency, and so the save stays outside the state updater — updaters run
  // twice under StrictMode, which would double-fire the request.
  const ordersRef = useRef(orders);
  // Guards against a slow GET landing after the user has already dragged
  // something and overwriting their change with the stored layout.
  const hasReordered = useRef(false);

  const applyOrders = useCallback((next: FieldOrders) => {
    ordersRef.current = next;
    cachedOrders = next;
    setOrders(next);
  }, []);

  useEffect(() => {
    if (cachedOrders) {
      return;
    }

    let cancelled = false;

    loadOrders()
      .then((loaded) => {
        if (!cancelled && !hasReordered.current) {
          applyOrders(loaded);
        }
      })
      .catch(() => {
        // A missing or unreachable layout is not worth interrupting the form for —
        // the defaults it falls back to are a usable order.
      })
      .finally(() => {
        if (!cancelled) {
          setIsReady(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [applyOrders]);

  const reorder = useCallback(
    <S extends FormSection>(section: S, next: SectionField<S>[]) => {
      hasReordered.current = true;

      const previous = ordersRef.current;
      applyOrders({ ...previous, [section]: next });

      void saveFormLayout(toLayout(ordersRef.current)).catch(
        (error: unknown) => {
          applyOrders(previous);
          notify.error(
            i18n.t('form.reorderSaveFailed', { ns: 'jobs' }),
            error instanceof Error && error.message.trim().length > 0
              ? error.message
              : undefined
          );
        }
      );
    },
    [applyOrders]
  );

  return { orders, reorder, isReady };
}
