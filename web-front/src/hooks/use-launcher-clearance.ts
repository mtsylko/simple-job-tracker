import { useLayoutEffect, useState, type RefObject } from 'react';

/** Room under the last row once a table runs into the feedback launcher; matches `pb-12`. */
const LAUNCHER_CLEARANCE_PX = 48;

/** Whether a scroller's content, plus the launcher's room, outgrows the box the page gives it (the scroller's parent). */
export function useLauncherClearance(
  scrollerRef: RefObject<HTMLElement | null>,
  contentRef: RefObject<HTMLElement | null>
): boolean {
  const [needsClearance, setNeedsClearance] = useState(false);

  // Measured against the box the page allows, so a short table never gains an empty band.
  useLayoutEffect(() => {
    const content = contentRef.current;
    const pageBox = scrollerRef.current?.parentElement;
    if (!content || !pageBox) {
      return;
    }

    const observer = new ResizeObserver(() => {
      setNeedsClearance(
        content.offsetHeight + LAUNCHER_CLEARANCE_PX > pageBox.clientHeight
      );
    });
    observer.observe(content);
    observer.observe(pageBox);
    return () => observer.disconnect();
  }, [scrollerRef, contentRef]);

  return needsClearance;
}
