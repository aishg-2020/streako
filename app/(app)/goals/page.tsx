import { auth } from '@/lib/auth-server';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { GoalSetter } from '@/components/goals/GoalSetter';
import { StreakTracker } from '@/components/goals/StreakTracker';
import { ChallengeList } from '@/components/goals/ChallengeList';

export default async function GoalsPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) redirect('/sign-in');

  const [goals, streak, challenges] = await Promise.all([
    db.goal.findMany({ where: { userId: user.id, active: true } }),
    db.streak.findUnique({ where: { userId: user.id } }),
    db.challengeLog.findMany({
      where: { userId: user.id },
      orderBy: { completedAt: 'desc' },
      take: 20,
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Goals & Consistency</h1>
        <p className="text-muted-foreground">Stay on track with your creator habits</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <GoalSetter goals={goals} userId={user.id} />
          <ChallengeList challenges={challenges} userId={user.id} />
        </div>
        <div>
          <StreakTracker streak={streak} />
        </div>
      </div>
    </div>
  );
}

