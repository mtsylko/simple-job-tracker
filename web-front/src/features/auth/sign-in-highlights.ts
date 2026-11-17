import { BarChart2, Briefcase, FileText, type LucideIcon } from 'lucide-react';

export type SignInHighlight = {
  /** Suffix of the `signIn.brand.highlights.*` translation keys. */
  key: string;
  icon: LucideIcon;
};

export const SIGN_IN_HIGHLIGHTS: SignInHighlight[] = [
  { key: 'applications', icon: Briefcase },
  { key: 'cvVersions', icon: FileText },
  { key: 'analytics', icon: BarChart2 }
];
