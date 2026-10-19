// Shared, client-safe definitions for posts and metric snapshots.

import { z } from 'zod';

export const METRIC_FIELDS = ['views', 'likes', 'comments', 'shares', 'saves'] as const;
export type MetricField = (typeof METRIC_FIELDS)[number];

export const METRIC_LABELS: Record<MetricField, string> = {
  views: 'Views',
  likes: 'Likes',
  comments: 'Comments',
  shares: 'Shares',
  saves: 'Saves',
};

const MAX_METRIC = 1_000_000_000_000;

const Count = z
  .number('Enter a whole number')
  .int('Enter a whole number')
  .min(0, 'Metrics can’t be negative')
  .max(MAX_METRIC, 'That number is too large');

/** One metrics submission. Every field is optional, but at least one must be given. */
export const MetricSnapshotSchema = z
  .object({
    views: Count.optional(),
    likes: Count.optional(),
    comments: Count.optional(),
    shares: Count.optional(),
    saves: Count.optional(),
  })
  .refine((m) => METRIC_FIELDS.some((f) => m[f] !== undefined), { message: 'Enter at least one metric' });

export type MetricSnapshotInput = z.input<typeof MetricSnapshotSchema>;

export function formatCount(value: number | null | undefined): string {
  return value === null || value === undefined ? '—' : value.toLocaleString('en-US');
}
