import {
  CircleDot,
  Clock,
  FileSignature,
  Flag,
  IdCard,
  Layers,
  MapPin,
  type LucideIcon
} from 'lucide-react';

import type { TaxonomyKind } from '@/features/taxonomies/use-taxonomy-lists';

export type CategoryKind = TaxonomyKind | 'status';

// In the order the application form shows the same fields.
export const CATEGORY_SLUGS = [
  'roles',
  'levels',
  'work-types',
  'employment-types',
  'contract-types',
  'statuses',
  'outcomes'
] as const;

export type CategorySlug = (typeof CATEGORY_SLUGS)[number];

export const CATEGORY_KIND_BY_SLUG: Record<CategorySlug, CategoryKind> = {
  roles: 'role',
  levels: 'level',
  'work-types': 'type',
  'employment-types': 'employmentType',
  'contract-types': 'contractType',
  statuses: 'status',
  outcomes: 'outcome'
};

export const CATEGORY_ICON_BY_SLUG: Record<CategorySlug, LucideIcon> = {
  roles: IdCard,
  levels: Layers,
  'work-types': MapPin,
  'employment-types': Clock,
  'contract-types': FileSignature,
  statuses: CircleDot,
  outcomes: Flag
};

export function isCategorySlug(
  value: string | undefined
): value is CategorySlug {
  return (CATEGORY_SLUGS as readonly string[]).includes(value ?? '');
}
