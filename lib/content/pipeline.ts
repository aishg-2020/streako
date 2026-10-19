// The content pipeline: ordered stages a ContentItem moves through.
// Mirrors the `ContentStatus` enum in prisma/schema.prisma (plain strings on SQLite).

import type { ContentStatus } from '@/types/schema';

export const CONTENT_PIPELINE = [
  'IDEA',
  'PLANNED',
  'SCRIPT_READY',
  'IN_PRODUCTION',
  'READY_TO_PUBLISH',
  'PUBLISHED',
] as const satisfies readonly ContentStatus[];

export const CONTENT_STATUS_LABELS: Record<ContentStatus, string> = {
  IDEA: 'Idea',
  PLANNED: 'Planned',
  SCRIPT_READY: 'Script Ready',
  IN_PRODUCTION: 'In Production',
  READY_TO_PUBLISH: 'Ready to Publish',
  PUBLISHED: 'Published',
};

export function isContentStatus(value: unknown): value is ContentStatus {
  return typeof value === 'string' && (CONTENT_PIPELINE as readonly string[]).includes(value);
}

export function statusLabel(value: string): string {
  return isContentStatus(value) ? CONTENT_STATUS_LABELS[value] : value;
}

export function statusIndex(status: string): number {
  return (CONTENT_PIPELINE as readonly string[]).indexOf(status);
}

/** The stage after `status`, or null when already at the end of the pipeline. */
export function nextStatus(status: string): ContentStatus | null {
  const i = statusIndex(status);
  return i >= 0 && i < CONTENT_PIPELINE.length - 1 ? CONTENT_PIPELINE[i + 1] : null;
}

/** The stage before `status`, or null when at the start of the pipeline. */
export function prevStatus(status: string): ContentStatus | null {
  const i = statusIndex(status);
  return i > 0 ? CONTENT_PIPELINE[i - 1] : null;
}

export const CONTENT_LIMITS = {
  title: 200,
  notes: 20000,
} as const;
