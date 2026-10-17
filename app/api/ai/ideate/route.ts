import { auth } from '@clerk/nextjs/server';
import { streamObject } from 'ai';
import { z } from 'zod';
import { model } from '@/lib/ai';
import { db } from '@/lib/db';
import { buildIdeatePrompt } from '@/lib/prompts/ideate';

const IdeaSchema = z.object({
  ideas: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      format: z.enum(['SHORT_VIDEO', 'LONG_VIDEO', 'CAROUSEL', 'STATIC_POST', 'BLOG', 'PODCAST', 'OTHER']),
      platform: z.enum(['INSTAGRAM', 'YOUTUBE', 'TIKTOK', 'LINKEDIN', 'TWITTER', 'OTHER']),
      hooks: z.array(z.string()),
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
  const { topic } = body;

  const { system, prompt } = buildIdeatePrompt(user.profile, topic);

  const result = streamObject({
    model,
    schema: IdeaSchema,
    system,
    prompt,
  });

  return result.toTextStreamResponse();
}
