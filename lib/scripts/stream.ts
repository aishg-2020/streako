// Client-side reader for POST /api/ai/script-feedback.
// The route streams raw JSON text token by token (real model and mock alike); we parse the
// partial JSON after every chunk so the panel can render each section as it fills in.

import { parsePartialJson } from 'ai';
import { ScriptFeedbackSchema, type ScriptFeedback } from './schema';

/** Feedback that may still be streaming in: any field can be missing or incomplete. */
export type PartialFeedback = {
  overallScore?: number;
  strengths?: string[];
  improvements?: string[];
  hookAnalysis?: string;
  pacing?: string;
  suggestions?: string[];
  shotList?: { scene?: number; description?: string; type?: string }[];
};

export class ScriptFeedbackError extends Error {}

const strings = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : undefined);

function toPartialFeedback(value: unknown): PartialFeedback {
  if (!value || typeof value !== 'object') return {};
  const v = value as Record<string, unknown>;
  return {
    overallScore: typeof v.overallScore === 'number' ? v.overallScore : undefined,
    strengths: strings(v.strengths),
    improvements: strings(v.improvements),
    hookAnalysis: typeof v.hookAnalysis === 'string' ? v.hookAnalysis : undefined,
    pacing: typeof v.pacing === 'string' ? v.pacing : undefined,
    suggestions: strings(v.suggestions),
    shotList: Array.isArray(v.shotList)
      ? v.shotList
          .filter((s): s is Record<string, unknown> => !!s && typeof s === 'object')
          .map((s) => ({
            scene: typeof s.scene === 'number' ? s.scene : undefined,
            description: typeof s.description === 'string' ? s.description : undefined,
            type: typeof s.type === 'string' ? s.type : undefined,
          }))
      : undefined,
  };
}

async function readErrorMessage(res: Response): Promise<string> {
  const text = (await res.text().catch(() => '')).trim();
  if (res.status === 401) return 'You need to be signed in to get feedback.';
  if (res.status === 404 && /profile/i.test(text)) return 'Complete your creator profile to unlock AI feedback.';
  return text && text.length < 200 ? text : `Feedback request failed (HTTP ${res.status}).`;
}

/**
 * Stream feedback for `scriptBody`. Calls `onPartial` after every chunk and resolves
 * with the final, validated feedback once the stream completes.
 */
export async function streamScriptFeedback(
  scriptBody: string,
  { signal, onPartial }: { signal?: AbortSignal; onPartial: (feedback: PartialFeedback) => void }
): Promise<ScriptFeedback> {
  const res = await fetch('/api/ai/script-feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scriptBody }),
    signal,
  });

  if (!res.ok) throw new ScriptFeedbackError(await readErrorMessage(res));
  if (!res.body) throw new ScriptFeedbackError('The feedback stream was empty.');

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let text = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    text += decoder.decode(value, { stream: true });
    const { value: partial } = await parsePartialJson(text);
    onPartial(toPartialFeedback(partial));
  }
  text += decoder.decode();

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new ScriptFeedbackError(
      text.trim()
        ? 'The AI response was cut off before it finished. Please try again.'
        : 'Feedback failed before any response arrived. Please try again.'
    );
  }

  const result = ScriptFeedbackSchema.safeParse(parsed);
  if (!result.success) throw new ScriptFeedbackError('The AI returned feedback in an unexpected format. Please try again.');
  return result.data;
}
