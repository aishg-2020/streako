import { auth } from '@/lib/auth-server';
import { db } from '@/lib/db';
import { getBoss, JOB_NAMES } from '@/lib/jobs';
import { getWeekStart } from '@/lib/utils';

const MOCK_REVIEW = {
  weekStart: new Date().toISOString(),
  summary: 'Strong week overall. You published 2 pieces of content and wrote 3 scripts — above your target of 2 posts. Your YouTube video on budgeting is performing well in the first 48 hours.',
  achievements: [
    'Hit your weekly posting goal (2/2)',
    'Wrote 3 scripts — one ahead of schedule',
    'New personal best engagement rate on the budgeting carousel',
  ],
  improvements: [
    'LinkedIn posts are getting fewer impressions — consider posting earlier in the week',
    'Two ideas in your bank are 3 weeks old without conversion — review or reject them',
  ],
  priorities: [
    'Film and edit the index funds explainer you scripted this week',
    'Engage with comments on your top-performing video for 15 minutes',
    'Batch-film 2 short-form videos while you have the filming setup out',
  ],
};

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return new Response('Unauthorized', { status: 401 });

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) return new Response('User not found', { status: 404 });

  if (process.env.MOCK_AI === 'true') {
    // Write mock review directly to DB
    await db.weeklyReview.create({
      data: {
        userId: user.id,
        weekStart: getWeekStart(),
        summary: MOCK_REVIEW.summary,
        achievements: MOCK_REVIEW.achievements as never,
        improvements: MOCK_REVIEW.improvements as never,
        priorities: MOCK_REVIEW.priorities as never,
      },
    });
    return Response.json({ queued: false, mock: true });
  }

  const boss = getBoss();
  await boss.start();
  await boss.send(JOB_NAMES.WEEKLY_REVIEW, { userId: user.id });

  return Response.json({ queued: true });
}
