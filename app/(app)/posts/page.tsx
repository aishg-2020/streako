import { auth } from '@/lib/auth-server';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { PostList } from '@/components/posts/PostList';

export default async function PostsPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) redirect('/sign-in');

  const posts = await db.post.findMany({
    where: { userId: user.id },
    orderBy: { publishedAt: 'desc' },
    include: { contentItem: true, metrics: { orderBy: { recordedAt: 'desc' }, take: 1 } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Published Posts</h1>
        <p className="text-muted-foreground">Track performance across all platforms</p>
      </div>
      <PostList posts={posts} />
    </div>
  );
}

