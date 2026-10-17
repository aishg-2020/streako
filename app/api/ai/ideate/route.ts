import { auth } from '@/lib/auth-server';
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

const MOCK_IDEAS = {
  ideas: [
    {
      title: '5 Money Mistakes I Made in My 20s (And How to Avoid Them)',
      description: 'Personal story-driven video covering common personal finance pitfalls with actionable alternatives.',
      format: 'SHORT_VIDEO' as const,
      platform: 'YOUTUBE' as const,
      hooks: ['I lost $10k making this mistake...', 'Nobody talks about this financial trap'],
    },
    {
      title: 'The 50/30/20 Budget Rule — Does It Actually Work?',
      description: 'Data-backed breakdown of the popular budgeting rule with real examples for different income levels.',
      format: 'CAROUSEL' as const,
      platform: 'INSTAGRAM' as const,
      hooks: ['Swipe to see if this rule works for YOUR income', 'This changed how I think about budgeting'],
    },
    {
      title: 'Index Funds vs ETFs: What No One Tells Beginners',
      description: 'Clear explainer cutting through jargon, ideal for first-time investors aged 22–35.',
      format: 'SHORT_VIDEO' as const,
      platform: 'TIKTOK' as const,
      hooks: ['Your financial advisor doesn\'t want you to know this', 'I wish someone told me this at 22'],
    },
    {
      title: 'How I Saved $20k on a $50k Salary in 12 Months',
      description: 'Month-by-month breakdown of a real savings journey with spreadsheet template.',
      format: 'LONG_VIDEO' as const,
      platform: 'YOUTUBE' as const,
      hooks: ['Month 1 was the hardest...', 'The exact system I used (free template below)'],
    },
    {
      title: 'Emergency Fund Myths That Are Keeping You Broke',
      description: 'Challenges conventional wisdom about emergency fund size and placement with evidence-based advice.',
      format: 'STATIC_POST' as const,
      platform: 'LINKEDIN' as const,
      hooks: ['3 months? Wrong. Here\'s the real number', 'Stop keeping your emergency fund here'],
    },
  ],
};

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return new Response('Unauthorized', { status: 401 });

  if (process.env.MOCK_AI === 'true') {
    return Response.json(MOCK_IDEAS);
  }

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    include: { profile: true },
  });
  if (!user?.profile) return new Response('Profile not found', { status: 404 });

  const body = await req.json();
  const { topic } = body;

  const { system, prompt } = buildIdeatePrompt(user.profile as never, topic);

  const result = streamObject({
    model,
    schema: IdeaSchema,
    system,
    prompt,
  });

  return result.toTextStreamResponse();
}
