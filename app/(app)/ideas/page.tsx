import { auth } from '@/lib/auth-server';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { IdeaGrid } from '@/components/ideas/IdeaGrid';
import { AIIdeatePanel } from '@/components/ideas/AIIdeatePanel';

export default async function IdeasPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    include: {
      ideas: { orderBy: { createdAt: 'desc' } },
      profile: true,
    },
  });

  if (!user) redirect('/sign-in');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Idea Bank</h1>
          <p className="text-muted-foreground">Capture and develop your content ideas</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <IdeaGrid ideas={user.ideas} />
        </div>
        <div>
          <AIIdeatePanel userId={user.id} profile={user.profile} />
        </div>
      </div>
    </div>
  );
}

