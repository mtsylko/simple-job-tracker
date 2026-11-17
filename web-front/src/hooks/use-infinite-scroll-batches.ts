import { useEffect, useRef, useState } from 'react';

const LOAD_MORE_THRESHOLD_PX = 300;

export function findNearestScrollContainer(
  startNode: HTMLElement | null
): HTMLElement | null {
  let current = startNode?.parentElement ?? null;
  while (current) {
    const style = window.getComputedStyle(current);
    const overflowY = style.overflowY;
    if (
      overflowY === 'auto' ||
      overflowY === 'scroll' ||
      overflowY === 'overlay'
    ) {
      return current;
    }

    current = current.parentElement;
  }

  return null;
}

type UseInfiniteScrollBatchesOptions = {
  enabled: boolean;
  totalCount: number;
  batchSize: number;
};

/**
 * Reveals rows in batches as the sentinel element approaches the bottom of the
 * nearest scroll container (falling back to the window).
 */
export function useInfiniteScrollBatches({
  enabled,
  totalCount,
  batchSize
}: UseInfiniteScrollBatchesOptions) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  // Batches are stored against the count they were counted for, so a result set
  // of a different size derives back to a single batch instead of needing a
  // reset write. Returning to the same count (clearing a filter) keeps the
  // depth already scrolled to, which costs no more than it did before.
  const [loaded, setLoaded] = useState({ totalCount, batches: 1 });

  const loadedBatches = loaded.totalCount === totalCount ? loaded.batches : 1;
  const visibleCount = Math.min(totalCount, loadedBatches * batchSize);
  const hasMore = enabled && visibleCount < totalCount;

  useEffect(() => {
    if (!hasMore || !sentinelRef.current) {
      return;
    }

    const scrollContainer = findNearestScrollContainer(sentinelRef.current);
    const scrollTarget: HTMLElement | Window = scrollContainer ?? window;
    let animationFrame = 0;

    const checkIfNearBottom = () => {
      const sentinel = sentinelRef.current;
      if (!sentinel) {
        return;
      }

      const viewportBottom = scrollContainer
        ? scrollContainer.getBoundingClientRect().bottom
        : window.innerHeight;
      const isNearBottom =
        sentinel.getBoundingClientRect().top <=
        viewportBottom + LOAD_MORE_THRESHOLD_PX;

      if (isNearBottom) {
        setLoaded((previous) => {
          const batches =
            previous.totalCount === totalCount ? previous.batches : 1;
          return batches * batchSize < totalCount
            ? { totalCount, batches: batches + 1 }
            : previous;
        });
      }
    };

    const handleScrollOrResize = () => {
      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame);
      }

      animationFrame = window.requestAnimationFrame(checkIfNearBottom);
    };

    scrollTarget.addEventListener('scroll', handleScrollOrResize, {
      passive: true
    });
    window.addEventListener('resize', handleScrollOrResize);
    handleScrollOrResize();

    return () => {
      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame);
      }
      scrollTarget.removeEventListener('scroll', handleScrollOrResize);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [batchSize, totalCount, hasMore, visibleCount]);

  return { sentinelRef, visibleCount, hasMore };
}
