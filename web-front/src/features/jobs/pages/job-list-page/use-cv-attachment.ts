import { useCvVersionsStore } from '@/features/cv-versions/cv-version-store';

/** The PDF attached to the CV version named `name`, or '' when it has none. */
export function useCvAttachment(name: string): string {
  const trimmedName = name.trim();

  return useCvVersionsStore((state) => {
    let attachment = '';
    if (trimmedName.length === 0) {
      return attachment;
    }

    for (const cvVersion of state.cvVersions) {
      const candidate = cvVersion.attachment.trim();
      if (candidate.length > 0 && cvVersion.name.trim() === trimmedName) {
        attachment = candidate;
      }
    }

    return attachment;
  });
}
