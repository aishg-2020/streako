import { auth } from '@/lib/auth-server';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { db } from '@/lib/db';
import { PostList } from '@/components/posts/PostList';
import { PageHeader } from '@/components/ui/PageHeader';

export default async function PostsPage() {
  await connection(); // per-user data: render at request time
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) redirect('/sign-in');

  const posts = await db.post.findMany({
    where: { userId: user.id },
    orderBy: { publishedAt: 'desc' },
    include: {
      contentItem: { select: { id: true, title: true } },
      metrics: { orderBy: { recordedAt: 'desc' }, take: 1 },
    },
  });

  return (
    <div>
      <PageHeader title="Published Posts" subtitle="Track performance across all platforms" />
      <PostList posts={posts} />
    </div>
  );
}
