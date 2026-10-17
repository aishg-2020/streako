import { auth } from '@/lib/auth-server';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { WeeklyReviewPanel } from '@/components/review/WeeklyReviewPanel';

export default async function ReviewPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) redirect('/sign-in');

  const latestReview = await db.weeklyReview.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Weekly Review</h1>
        <p className="text-muted-foreground">AI-powered insights on your content week</p>
      </div>
      <WeeklyReviewPanel review={latestReview} userId={user.id} />
    </div>
  );
}

