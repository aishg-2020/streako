// Shared, client-safe definitions for the Ideas module.
// Used by the server actions, the /api/ai/ideate route and the ideas UI components.

import { z } from 'zod';
import type { ContentFormat, IdeaStatus, Platform } from '@/types/schema';

export const PLATFORMS = ['INSTAGRAM', 'YOUTUBE', 'TIKTOK', 'LINKEDIN', 'TWITTER', 'OTHER'] as const satisfies readonly Platform[];

export const CONTENT_FORMATS = [
  'SHORT_VIDEO',
  'LONG_VIDEO',
  'CAROUSEL',
  'STATIC_POST',
  'BLOG',
  'PODCAST',
  'OTHER',
] as const satisfies readonly ContentFormat[];

export const IDEA_STATUSES = ['SAVED', 'CONVERTED', 'REJECTED'] as const satisfies readonly IdeaStatus[];

export const PLATFORM_LABELS: Record<Platform, string> = {
  INSTAGRAM: 'Instagram',
  YOUTUBE: 'YouTube',
  TIKTOK: 'TikTok',
  LINKEDIN: 'LinkedIn',
  TWITTER: 'X / Twitter',
  OTHER: 'Other',
};

export const FORMAT_LABELS: Record<ContentFormat, string> = {
  SHORT_VIDEO: 'Short video',
  LONG_VIDEO: 'Long video',
  CAROUSEL: 'Carousel',
  STATIC_POST: 'Static post',
  BLOG: 'Blog',
  PODCAST: 'Podcast',
  OTHER: 'Other',
};

export const IDEA_STATUS_LABELS: Record<IdeaStatus, string> = {
  SAVED: 'Saved',
  CONVERTED: 'Converted',
  REJECTED: 'Rejected',
};

// The SQLite dev client types enums as plain `string`, so labels accept any string.
export function platformLabel(value: string): string {
  return PLATFORM_LABELS[value as Platform] ?? value;
}

export function formatLabel(value: string): string {
  return FORMAT_LABELS[value as ContentFormat] ?? value;
}

/**
 * Array columns (idea hooks, profile platforms) are `String[]` on Postgres but a
 * JSON-encoded string on the SQLite dev schema. Accepts either form.
 */
export function parseStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((h): h is string => typeof h === 'string');
  if (typeof value === 'string') {
    try {
      const parsed: unknown = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.filter((h): h is string => typeof h === 'string') : [];
    } catch {
      return [];
    }
  }
  return [];
}

export const parseHooks = parseStringArray;

export const IDEA_LIMITS = {
  title: 200,
  description: 5000,
  hook: 300,
  hooks: 10,
} as const;

/** Hook lines: trimmed, blanks dropped, then capped. */
const HooksSchema = z
  .array(z.string().trim().max(IDEA_LIMITS.hook, `Each hook must be ${IDEA_LIMITS.hook} characters or fewer`))
  .transform((hooks) => hooks.filter(Boolean))
  .pipe(z.array(z.string()).max(IDEA_LIMITS.hooks, `Add at most ${IDEA_LIMITS.hooks} hooks`));

/** Input accepted when creating an idea (manual form or saving an AI-generated idea). */
export const IdeaInputSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title is required')
    .max(IDEA_LIMITS.title, `Title must be ${IDEA_LIMITS.title} characters or fewer`),
  description: z
    .string()
    .trim()
    .min(1, 'Description is required')
    .max(IDEA_LIMITS.description, `Description must be ${IDEA_LIMITS.description} characters or fewer`),
  platform: z.enum(PLATFORMS, 'Choose a platform'),
  format: z.enum(CONTENT_FORMATS, 'Choose a format'),
  hooks: HooksSchema.default([]),
});

export type IdeaInput = z.input<typeof IdeaInputSchema>;

/**
 * Partial input for editing an idea. Deliberately has no `hooks` default: zod applies
 * defaults even inside `.partial()`, which would wipe hooks on a title-only edit.
 */
export const IdeaUpdateSchema = IdeaInputSchema.extend({ hooks: HooksSchema }).partial();

export type IdeaUpdate = z.input<typeof IdeaUpdateSchema>;

/** A single idea as produced by the AI (or the mock). */
export const GeneratedIdeaSchema = z.object({
  title: z.string(),
  description: z.string(),
  format: z.enum(CONTENT_FORMATS),
  platform: z.enum(PLATFORMS),
  hooks: z.array(z.string()),
});

export type GeneratedIdea = z.infer<typeof GeneratedIdeaSchema>;

/** Shape streamed by POST /api/ai/ideate (as JSON text, token by token). */
export const GeneratedIdeasSchema = z.object({
  ideas: z.array(GeneratedIdeaSchema),
});

export const IDEATE_MAX_COUNT = 5;

/** Request body for POST /api/ai/ideate. */
export const IdeateRequestSchema = z.object({
  topic: z.string().trim().max(200).optional(),
  /** How many ideas to generate: 5 for a fresh batch, 1 when regenerating a single idea. */
  count: z.number().int().min(1).max(IDEATE_MAX_COUNT).default(IDEATE_MAX_COUNT),
  /** Titles the generator should not repeat (already shown, rejected or saved). */
  exclude: z.array(z.string().max(IDEA_LIMITS.title * 2)).max(100).default([]),
});

export type IdeateRequest = z.input<typeof IdeateRequestSchema>;
