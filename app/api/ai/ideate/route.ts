import { auth } from '@/lib/auth-server';
import { streamObject } from 'ai';
import { model } from '@/lib/ai';
import { db } from '@/lib/db';
import { buildIdeatePrompt } from '@/lib/prompts/ideate';
import { GeneratedIdeasSchema, IdeateRequestSchema } from '@/lib/ideas/schema';
import { mockIdeasStreamResponse, pickMockIdeas } from '@/lib/ideas/mock';

/**
 * Streams AI-generated content ideas as JSON text, token by token.
 *
 * Body: { topic?: string; count?: 1–5 (default 5); exclude?: string[] }
 *   - `count: 1` + `exclude` is used by the UI to regenerate a single idea.
 * Response: text/plain stream whose concatenated chunks form `{ "ideas": [...] }`.
 */
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return new Response('Unauthorized', { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const parsed = IdeateRequestSchema.safeParse(body ?? {});
  if (!parsed.success) return new Response('Invalid request body', { status: 400 });
  const { topic, count, exclude } = parsed.data;

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    include: {
      profile: true,
      ideas: { select: { title: true }, orderBy: { createdAt: 'desc' }, take: 30 },
    },
  });

  // Avoid suggesting anything already on screen or already in the idea bank.
  const avoid = Array.from(new Set([...exclude, ...(user?.ideas.map((i) => i.title) ?? [])]));

  if (process.env.MOCK_AI === 'true') {
    return mockIdeasStreamResponse(pickMockIdeas(count, avoid), req.signal);
  }

  if (!user?.profile) return new Response('Profile not found', { status: 404 });

  const { system, prompt } = buildIdeatePrompt(user.profile as never, topic || undefined, { count, exclude: avoid });

  const result = streamObject({
    model,
    schema: GeneratedIdeasSchema,
    system,
    prompt,
    abortSignal: req.signal,
  });

  return result.toTextStreamResponse();
}
