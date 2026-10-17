import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    include: {
      profile: true,
      streaks: true,
    },
  });

  if (!user?.profile?.onboardingDone) {
    redirect('/onboarding');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user.profile?.displayName}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card p-6">
          <p className="text-sm font-medium text-muted-foreground">Current Streak</p>
          <p className="text-3xl font-bold">{user.streaks[0]?.current ?? 0}</p>
          <p className="text-xs text-muted-foreground">days</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border bg-card p-6">
          <h2 className="font-semibold mb-2">Pipeline Status</h2>
          <p className="text-sm text-muted-foreground">No content items yet. Start by adding an idea.</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <h2 className="font-semibold mb-2">Weekly Review</h2>
          <p className="text-sm text-muted-foreground">Your weekly review will appear here every Monday.</p>
        </div>
      </div>
    </div>
  );
}
