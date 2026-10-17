import { auth } from '@clerk/nextjs/server';
import { streamObject } from 'ai';
import { z } from 'zod';
import { model } from '@/lib/ai';
import { db } from '@/lib/db';
import { buildScriptFeedbackPrompt } from '@/lib/prompts/scriptFeedback';

const FeedbackSchema = z.object({
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

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return new Response('Unauthorized', { status: 401 });

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    include: { profile: true },
  });
  if (!user?.profile) return new Response('Profile not found', { status: 404 });

  const body = await req.json();
  const { scriptId, scriptBody } = body;

  if (!scriptBody) return new Response('Missing script body', { status: 400 });

  const { system, prompt } = buildScriptFeedbackPrompt(user.profile, scriptBody);

  const result = streamObject({
    model,
    schema: FeedbackSchema,
    system,
    prompt,
  });

  return result.toTextStreamResponse();
}
