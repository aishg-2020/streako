import type { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { generateObject } from 'ai';
import { z } from 'zod';
import { model } from '@/lib/ai';
import { buildWeeklyReviewPrompt } from '@/lib/prompts/weeklyReview';
import { getWeekStart } from '@/lib/utils';

// Internal endpoint called by pg-boss worker
export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.JOBS_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const body = await req.json();
  const { jobName, data } = body;

  if (jobName === 'weekly-review') {
    const { userId } = data;
    await generateWeeklyReviewJob(userId);
  }

  return Response.json({ ok: true });
}

const WeeklyReviewSchema = z.object({
  summary: z.string(),
  achievements: z.array(z.string()),
  improvements: z.array(z.string()),
  priorities: z.array(z.string()),
  suggestedPlan: z.string().optional(),
});

async function generateWeeklyReviewJob(userId: string) {
  const weekStart = getWeekStart();
  const weekAgo = new Date(weekStart.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [user, posts, scripts] = await Promise.all([
    db.user.findUnique({ where: { id: userId }, include: { profile: true } }),
    db.post.findMany({
      where: { userId, publishedAt: { gte: weekAgo } },
      include: { metrics: true },
    }),
    db.script.findMany({
      where: { contentItem: { userId }, createdAt: { gte: weekAgo } },
    }),
  ]);

  if (!user?.profile) return;

  const { system, prompt } = buildWeeklyReviewPrompt(user.profile, posts, scripts);

  const { object } = await generateObject({
    model,
    schema: WeeklyReviewSchema,
    system,
    prompt,
  });

  await db.weeklyReview.create({
    data: {
      userId,
      weekStart,
      summary: object.summary,
      achievements: JSON.stringify(object.achievements) as unknown as Prisma.WeeklyReviewUncheckedCreateInput['achievements'],
      improvements: JSON.stringify(object.improvements) as unknown as Prisma.WeeklyReviewUncheckedCreateInput['improvements'],
      priorities: JSON.stringify(object.priorities) as unknown as Prisma.WeeklyReviewUncheckedCreateInput['priorities'],
      suggestedPlan: object.suggestedPlan ?? undefined,
    },
  });
}
