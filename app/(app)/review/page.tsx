import { auth } from '@/lib/auth-server';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { db } from '@/lib/db';
import { WeeklyReviewPanel } from '@/components/review/WeeklyReviewPanel';
import { PageHeader } from '@/components/ui/PageHeader';

export default async function ReviewPage() {
  await connection(); // per-user data: render at request time
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) redirect('/sign-in');

  const latestReview = await db.weeklyReview.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div>
      <PageHeader title="Weekly Review" subtitle="AI-powered insights on your content week" />
      <WeeklyReviewPanel review={latestReview} userId={user.id} />
    </div>
  );
}
