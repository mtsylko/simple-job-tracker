export const FEEDBACK_KINDS = ['bug', 'idea', 'question'] as const;

export type FeedbackKind = (typeof FEEDBACK_KINDS)[number];

export const FEEDBACK_MESSAGE_MAX_LENGTH = 4000;

export interface CreateFeedbackInput {
  kind: FeedbackKind;
  message: string;
  /** The app path the user wrote from, without the query string. */
  pagePath: string | null;
}

export interface UpdateFeedbackInput {
  resolved: boolean;
}

/** One message as the admin feedback list shows it, with its sender. */
export interface AdminFeedback {
  id: string;
  kind: FeedbackKind;
  message: string;
  pagePath: string | null;
  userAgent: string | null;
  createdAt: string;
  resolvedAt: string | null;
  user: {
    id: string;
    email: string;
    displayName: string | null;
  };
}
