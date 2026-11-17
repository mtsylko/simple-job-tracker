import { useRef, type ReactNode, type RefObject } from 'react';
import { X } from 'lucide-react';
import { AlertDialog as AlertDialogPrimitive } from '@base-ui/react/alert-dialog';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';

type Props = {
  open: boolean;
  title: string;
  description?: ReactNode;
  /** A field or a list under the description. */
  children?: ReactNode;
  cancelLabel: string;
  confirmLabel: string;
  /** Keeps the confirm button disabled while the action is in flight. */
  confirmPending?: boolean;
  /** Keeps the confirm button disabled until the body holds a valid choice. */
  confirmDisabled?: boolean;
  /** `danger` for an action that deletes, discards or blocks something. */
  tone?: 'default' | 'danger';
  /** Focused on open; Cancel, the safe choice, when not given. */
  initialFocus?: RefObject<HTMLElement | null>;
  onConfirm: () => void;
  /** Cancel, the close button and Escape all end here. */
  onCancel: () => void;
};

/** The app's one dialog: title and close button, optional body, Cancel and a confirm action. */
export function Modal({
  open,
  title,
  description,
  children,
  cancelLabel,
  confirmLabel,
  confirmPending = false,
  confirmDisabled = false,
  tone = 'default',
  initialFocus,
  onConfirm,
  onCancel
}: Props) {
  const { t } = useTranslation('common');
  const cancelRef = useRef<HTMLButtonElement>(null);

  return (
    <AlertDialogPrimitive.Root
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onCancel();
      }}
    >
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Backdrop className="fixed inset-0 z-50 backdrop-blur-[2px] [background:color-mix(in_oklab,var(--ink)_38%,transparent)] duration-100 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />

        <AlertDialogPrimitive.Popup
          initialFocus={initialFocus ?? cancelRef}
          className="fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-[460px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-border bg-card shadow-popover outline-none duration-100 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95"
        >
          <div className="flex items-start justify-between gap-4 px-6 pt-5">
            <AlertDialogPrimitive.Title className="mt-0.5 font-serif text-xl font-medium tracking-display text-foreground">
              {title}
            </AlertDialogPrimitive.Title>
            <AlertDialogPrimitive.Close
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-lg"
                  className="-mr-2 shrink-0 text-muted-foreground hover:text-foreground"
                  aria-label={t('dialog.close')}
                />
              }
            >
              <X aria-hidden="true" />
            </AlertDialogPrimitive.Close>
          </div>

          <div className="px-6 pb-5">
            {description ? (
              <AlertDialogPrimitive.Description
                render={<div />}
                className="mt-1.5 text-sm leading-normal text-muted-foreground"
              >
                {description}
              </AlertDialogPrimitive.Description>
            ) : null}
            {children ? <div className="mt-6">{children}</div> : null}
          </div>

          <div className="flex justify-end gap-2 bg-background px-6 py-3.5">
            <Button
              ref={cancelRef}
              type="button"
              variant="outline"
              onClick={onCancel}
            >
              {cancelLabel}
            </Button>
            <Button
              type="button"
              disabled={confirmPending || confirmDisabled}
              onClick={onConfirm}
              className={
                tone === 'danger'
                  ? 'border-danger bg-danger text-white shadow-danger hover:border-danger-hover hover:bg-danger-hover'
                  : undefined
              }
            >
              {confirmLabel}
            </Button>
          </div>
        </AlertDialogPrimitive.Popup>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  );
}
