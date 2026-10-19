import { auth } from '@/lib/auth-server';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { db } from '@/lib/db';
import { ContentBoard } from '@/components/content/ContentBoard';
import { PageHeader } from '@/components/ui/PageHeader';

export default async function ContentPage() {
  // Per-user data: always render at request time (mock auth doesn't read request data,
  // which would otherwise let Next try to prerender this page at build time).
  await connection();
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) redirect('/sign-in');

  const contentItems = await db.contentItem.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: 'desc' },
    include: { _count: { select: { scripts: true } } },
  });

  return (
    <div>
      <PageHeader title="Content Pipeline" subtitle="Track content from idea to published" />
      <ContentBoard items={contentItems} />
    </div>
  );
}
