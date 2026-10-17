import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { getBoss, JOB_NAMES } from '@/lib/jobs';

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return new Response('Unauthorized', { status: 401 });

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) return new Response('User not found', { status: 404 });

  const boss = getBoss();
  await boss.start();
  await boss.send(JOB_NAMES.WEEKLY_REVIEW, { userId: user.id });

  return Response.json({ queued: true });
}
