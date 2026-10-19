// Client-side reader for POST /api/ai/ideate.
//
// The route streams raw JSON text (`{"ideas":[...]}`) token by token — both the real
// `streamObject` response and the mock. We accumulate the text, repair/parse the
// partial JSON after every chunk and hand the partial ideas to the caller so the UI
// can render each field as it fills in.

import { parsePartialJson } from 'ai';
import { GeneratedIdeasSchema, type GeneratedIdea, type IdeateRequest } from './schema';

/** An idea that may still be streaming in: any field can be missing or incomplete. */
export type PartialIdea = {
  title?: string;
  description?: string;
  format?: string;
  platform?: string;
  hooks?: string[];
};

export class IdeateError extends Error {}

function toPartialIdeas(value: unknown): PartialIdea[] {
  if (!value || typeof value !== 'object') return [];
  const ideas = (value as { ideas?: unknown }).ideas;
  if (!Array.isArray(ideas)) return [];
  return ideas
    .filter((idea): idea is Record<string, unknown> => !!idea && typeof idea === 'object')
    .map((idea) => ({
      title: typeof idea.title === 'string' ? idea.title : undefined,
      description: typeof idea.description === 'string' ? idea.description : undefined,
      format: typeof idea.format === 'string' ? idea.format : undefined,
      platform: typeof idea.platform === 'string' ? idea.platform : undefined,
      hooks: Array.isArray(idea.hooks) ? idea.hooks.filter((h): h is string => typeof h === 'string') : undefined,
    }));
}

async function readErrorMessage(res: Response): Promise<string> {
  const text = (await res.text().catch(() => '')).trim();
  if (res.status === 401) return 'You need to be signed in to generate ideas.';
  if (res.status === 404 && /profile/i.test(text)) return 'Complete your creator profile to unlock AI ideas.';
  return text && text.length < 200 ? text : `Idea generation failed (HTTP ${res.status}).`;
}

/**
 * Stream ideas from the ideate endpoint.
 * Calls `onPartial` with the ideas parsed so far after every chunk, and resolves with
 * the final, validated ideas once the stream completes.
 */
export async function streamIdeas(
  request: IdeateRequest,
  { signal, onPartial }: { signal?: AbortSignal; onPartial: (ideas: PartialIdea[]) => void }
): Promise<GeneratedIdea[]> {
  const res = await fetch('/api/ai/ideate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
    signal,
  });

  if (!res.ok) throw new IdeateError(await readErrorMessage(res));
  if (!res.body) throw new IdeateError('The idea stream was empty.');

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let text = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    text += decoder.decode(value, { stream: true });
    const { value: partial } = await parsePartialJson(text);
    onPartial(toPartialIdeas(partial));
  }
  text += decoder.decode();

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new IdeateError(
      text.trim()
        ? 'The AI response was cut off before it finished. Please try again.'
        : 'Idea generation failed before any ideas arrived. Please try again.'
    );
  }

  const result = GeneratedIdeasSchema.safeParse(parsed);
  if (!result.success) throw new IdeateError('The AI returned ideas in an unexpected format. Please try again.');
  return result.data.ideas;
}
