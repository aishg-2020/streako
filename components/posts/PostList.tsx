'use client';

import Link from 'next/link';
import type { Post, PostMetric } from '@prisma/client';
import { Button, Card, Flex, Space, Statistic, Tag, Typography } from 'antd';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDate } from '@/lib/utils';
import { platformLabel } from '@/lib/ideas/schema';
import { METRIC_FIELDS, METRIC_LABELS, formatCount } from '@/lib/posts/schema';

export type PostListItem = Post & { contentItem: { id: string; title: string } | null; metrics: PostMetric[] };

/** All posts, newest first, each with its latest metrics snapshot when one exists. */
export function PostList({ posts }: { posts: PostListItem[] }) {
  if (posts.length === 0) {
    return (
      <EmptyState
        title="No posts yet"
        description="Move a content item to Published, then mark it as published to start tracking performance."
        action={
          <Link href="/content">
            <Button type="primary">Go to the content pipeline</Button>
          </Link>
        }
      />
    );
  }

  return (
    <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
      {posts.map((post) => {
        const latest = post.metrics[0];
        return (
          <li key={post.id}>
            <Link href={`/posts/${post.id}`} style={{ display: 'block', width: '100%' }}>
              <Card hoverable size="small" styles={{ body: { padding: '14px 18px' } }}>
                <Flex justify="space-between" align="center" gap={16} wrap>
                  <div style={{ minWidth: 0 }}>
                    <Typography.Text strong ellipsis style={{ display: 'block', fontSize: 15 }}>
                      {post.contentItem?.title ?? 'Untitled post'}
                    </Typography.Text>
                    <Space size={6} style={{ marginTop: 4 }}>
                      <Tag style={{ marginInlineEnd: 0 }}>{platformLabel(post.platform)}</Tag>
                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                        Published {formatDate(post.publishedAt)}
                      </Typography.Text>
                    </Space>
                  </div>
                  {latest ? (
                    <Flex gap={24} wrap aria-label="Latest metrics">
                      {METRIC_FIELDS.map((f) => (
                        <Statistic
                          key={f}
                          title={METRIC_LABELS[f]}
                          value={formatCount(latest[f])}
                          styles={{ content: { fontSize: 16, fontWeight: 600 }, title: { fontSize: 11, marginBottom: 0 } }}
                        />
                      ))}
                      <Statistic
                        title="Snapshot"
                        value={formatDate(latest.recordedAt)}
                        styles={{ content: { fontSize: 13, fontWeight: 400 }, title: { fontSize: 11, marginBottom: 0 } }}
                      />
                    </Flex>
                  ) : (
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      No metrics logged yet
                    </Typography.Text>
                  )}
                </Flex>
              </Card>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
