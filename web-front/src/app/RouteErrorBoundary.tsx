import { Component, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';

function RouteErrorFallback() {
  const { t } = useTranslation('common');

  return (
    <main className="mx-auto w-full max-w-4xl py-8 md:py-10">
      <section role="alert" className="rounded-lg border bg-card p-4">
        <h1 className="m-0 text-2xl font-medium text-foreground">
          {t('errorBoundary.title')}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t('errorBoundary.body')}
        </p>
        <div className="mt-4">
          <Button variant="outline" onClick={() => window.location.reload()}>
            {t('errorBoundary.reload')}
          </Button>
        </div>
      </section>
    </main>
  );
}

type RouteErrorBoundaryProps = {
  children: ReactNode;
  /** The current path: moving to another page clears the error. */
  resetKey: string;
};

type RouteErrorBoundaryState = { hasError: boolean; resetKey: string };

/** Catches a render error in the page, so the sidebar stays usable instead of the whole app going blank. */
export class RouteErrorBoundary extends Component<
  RouteErrorBoundaryProps,
  RouteErrorBoundaryState
> {
  state: RouteErrorBoundaryState = {
    hasError: false,
    resetKey: this.props.resetKey
  };

  static getDerivedStateFromError(): Partial<RouteErrorBoundaryState> {
    return { hasError: true };
  }

  static getDerivedStateFromProps(
    props: RouteErrorBoundaryProps,
    state: RouteErrorBoundaryState
  ): Partial<RouteErrorBoundaryState> | null {
    return props.resetKey === state.resetKey
      ? null
      : { hasError: false, resetKey: props.resetKey };
  }

  render(): ReactNode {
    return this.state.hasError ? <RouteErrorFallback /> : this.props.children;
  }
}
