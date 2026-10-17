import { auth } from '@clerk/nextjs/server';
import { notFound, redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { MetricsForm } from '@/components/posts/MetricsForm';

export default async function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) redirect('/sign-in');

  const post = await db.post.findFirst({
    where: { id, userId: user.id },
    include: { metrics: { orderBy: { recordedAt: 'desc' } }, contentItem: true },
  });
  if (!post) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {post.contentItem?.title ?? 'Post'}
        </h1>
        <p className="text-muted-foreground">{post.platform} · Published {post.publishedAt.toLocaleDateString()}</p>
      </div>
      <MetricsForm postId={post.id} history={post.metrics} />
    </div>
  );
}
