import { Bug, CircleHelp, Lightbulb, type LucideIcon } from 'lucide-react';
import type { FeedbackKind } from '@job-tracker/shared';

export const FEEDBACK_KIND_ICONS: Record<FeedbackKind, LucideIcon> = {
  bug: Bug,
  idea: Lightbulb,
  question: CircleHelp
};
