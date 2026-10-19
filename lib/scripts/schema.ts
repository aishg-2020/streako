// Shared, client-safe definitions for scripts and AI script feedback.

import { z } from 'zod';

export const SCRIPT_LIMITS = {
  body: 50000,
} as const;

/** Structured feedback produced by /api/ai/script-feedback (streamed as JSON text). */
export const ScriptFeedbackSchema = z.object({
  overallScore: z.number().min(1).max(10),
  strengths: z.array(z.string()),
  improvements: z.array(z.string()),
  hookAnalysis: z.string(),
  pacing: z.string(),
  suggestions: z.array(z.string()),
  shotList: z.array(
    z.object({
      scene: z.number(),
      description: z.string(),
      type: z.string(),
    })
  ),
});

export type ScriptFeedback = z.infer<typeof ScriptFeedbackSchema>;

/** Request body for POST /api/ai/script-feedback. */
export const ScriptFeedbackRequestSchema = z.object({
  scriptBody: z.string().trim().min(1, 'Script is empty').max(SCRIPT_LIMITS.body),
});

/**
 * `Script.aiFeedback` is `Json?` on Postgres and a JSON string on the SQLite dev schema.
 * Returns the parsed feedback if the stored value is valid, otherwise null.
 */
export function parseScriptFeedback(value: unknown): ScriptFeedback | null {
  let raw: unknown = value;
  if (typeof value === 'string') {
    try {
      raw = JSON.parse(value);
    } catch {
      return null;
    }
  }
  const parsed = ScriptFeedbackSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}
