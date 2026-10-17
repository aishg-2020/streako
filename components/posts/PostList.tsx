'use client';

import Link from 'next/link';
import type { Post, PostMetric, ContentItem } from '@prisma/client';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDate } from '@/lib/utils';

type PostWithDetails = Post & { contentItem: ContentItem | null; metrics: PostMetric[] };

export function PostList({ posts }: { posts: PostWithDetails[] }) {
  if (posts.length === 0) {
    return (
      <EmptyState
        title="No posts yet"
        description="Mark content as published to start tracking performance."
      />
    );
  }

  return (
    <div className="space-y-3">
      {posts.map((post) => {
        const latest = post.metrics[0];
        return (
          <Link
            key={post.id}
            href={`/posts/${post.id}`}
            className="flex items-center justify-between rounded-lg border bg-card px-4 py-3 hover:shadow-sm transition-shadow"
          >
            <div>
              <p className="font-medium text-sm">{post.contentItem?.title ?? 'Post'}</p>
              <p className="text-xs text-muted-foreground">
                {post.platform} · {formatDate(post.publishedAt)}
              </p>
            </div>
            {latest && (
              <div className="text-right text-xs text-muted-foreground">
                <p>{latest.views?.toLocaleString()} views</p>
                <p>{latest.likes?.toLocaleString()} likes</p>
              </div>
            )}
          </Link>
        );
      })}
    </div>
  );
}
