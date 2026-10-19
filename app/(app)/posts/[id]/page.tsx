import Link from 'next/link';
import { auth } from '@/lib/auth-server';
import { notFound, redirect } from 'next/navigation';
import { connection } from 'next/server';
import { Card, Col, Flex, Row, Statistic, Tag } from 'antd';
import { db } from '@/lib/db';
import { formatDate } from '@/lib/utils';
import { platformLabel } from '@/lib/ideas/schema';
import { METRIC_FIELDS, METRIC_LABELS, formatCount } from '@/lib/posts/schema';
import { MetricsForm } from '@/components/posts/MetricsForm';
import { MetricHistory } from '@/components/posts/MetricHistory';
import { PageHeader } from '@/components/ui/PageHeader';
import { Text } from '@/components/ui/typography';

export default async function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await connection(); // per-user data: render at request time
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) redirect('/sign-in');

  const post = await db.post.findFirst({
    where: { id, userId: user.id },
    include: {
      metrics: { orderBy: { recordedAt: 'desc' } },
      contentItem: { select: { id: true, title: true, format: true } },
    },
  });
  if (!post) notFound();

  const latest = post.metrics[0];

  return (
    <div>
      <PageHeader
        back={{ href: '/posts', label: 'All posts' }}
        title={post.contentItem?.title ?? 'Untitled post'}
        tag={<Tag style={{ marginInlineEnd: 0 }}>{platformLabel(post.platform)}</Tag>}
        subtitle={
          <>
            Published {formatDate(post.publishedAt)}
            {post.url && (
              <>
                {' · '}
                <a href={post.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline' }}>
                  Open post ↗
                </a>
              </>
            )}
            {post.contentItem && (
              <>
                {' · '}
                <Link href={`/content/${post.contentItem.id}`} style={{ textDecoration: 'underline' }}>
                  View content item
                </Link>
              </>
            )}
          </>
        }
      />

      <Flex vertical gap={24}>
        <div>
          <Row gutter={[12, 12]} role="group" aria-label="Latest metrics">
            {METRIC_FIELDS.map((f) => (
              <Col key={f} flex="1 1 150px">
                <Card size="small">
                  <Statistic title={METRIC_LABELS[f]} value={formatCount(latest?.[f])} />
                </Card>
              </Col>
            ))}
          </Row>
          {latest && (
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 8 }}>
              Latest snapshot recorded {formatDate(latest.recordedAt)}.
            </Text>
          )}
        </div>

        <MetricsForm postId={post.id} />
        <MetricHistory metrics={post.metrics} />
      </Flex>
    </div>
  );
}
