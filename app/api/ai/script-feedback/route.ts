import { auth } from '@/lib/auth-server';
import { streamObject } from 'ai';
import { model } from '@/lib/ai';
import { db } from '@/lib/db';
import { buildScriptFeedbackPrompt } from '@/lib/prompts/scriptFeedback';
import { ScriptFeedbackRequestSchema, ScriptFeedbackSchema } from '@/lib/scripts/schema';
import { buildMockFeedback, mockFeedbackStreamResponse } from '@/lib/scripts/mock';

/**
 * Streams structured AI feedback for a script as JSON text, token by token.
 *
 * Body: { scriptBody: string }
 * Response: text/plain stream whose concatenated chunks form a ScriptFeedback object.
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
  const parsed = ScriptFeedbackRequestSchema.safeParse(body ?? {});
  if (!parsed.success) return new Response(parsed.error.issues[0]?.message ?? 'Invalid request body', { status: 400 });
  const { scriptBody } = parsed.data;

  if (process.env.MOCK_AI === 'true') {
    return mockFeedbackStreamResponse(buildMockFeedback(scriptBody), req.signal);
  }

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    include: { profile: true },
  });
  if (!user?.profile) return new Response('Profile not found', { status: 404 });

  const { system, prompt } = buildScriptFeedbackPrompt(user.profile as never, scriptBody);

  const result = streamObject({
    model,
    schema: ScriptFeedbackSchema,
    system,
    prompt,
    abortSignal: req.signal,
  });

  return result.toTextStreamResponse();
}
