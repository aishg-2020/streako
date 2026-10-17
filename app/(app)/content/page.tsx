import { auth } from '@/lib/auth-server';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { ContentBoard } from '@/components/content/ContentBoard';

export default async function ContentPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) redirect('/sign-in');

  const contentItems = await db.contentItem.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: 'desc' },
    include: { idea: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Content Pipeline</h1>
        <p className="text-muted-foreground">Track content from idea to published</p>
      </div>
      <ContentBoard items={contentItems} />
    </div>
  );
}

