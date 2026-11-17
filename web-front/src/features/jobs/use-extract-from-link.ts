/** The fields the form fills; local because the public shared package has no extraction contract. */
type ExtractedFields = Partial<
  Record<'company' | 'role' | 'level' | 'type' | 'salaryRange', string | null>
>;

type UseExtractFromLink = (
  link: string,
  apply: (result: ExtractedFields) => void
) => {
  canExtract: boolean;
  isExtracting: boolean;
  extractError: string | null;
  extract: () => void;
};

/** Public build: no extension and no AI, so the form never offers the action. */
export const useExtractFromLink: UseExtractFromLink = () => ({
  canExtract: false,
  isExtracting: false,
  extractError: null,
  extract: () => {}
});
