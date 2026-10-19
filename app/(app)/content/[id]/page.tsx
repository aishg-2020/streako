import Link from 'next/link';
import { auth } from '@/lib/auth-server';
import { notFound, redirect } from 'next/navigation';
import { connection } from 'next/server';
import { Card, Col, Descriptions, Divider, Flex, Row, Space } from 'antd';
import { db } from '@/lib/db';
import { formatDate } from '@/lib/utils';
import { formatLabel, platformLabel } from '@/lib/ideas/schema';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { PageHeader } from '@/components/ui/PageHeader';
import { Text } from '@/components/ui/typography';
import { PipelineControls } from '@/components/content/PipelineControls';
import { NotesEditor } from '@/components/content/NotesEditor';
import { ScriptDraftButton } from '@/components/content/ScriptDraftButton';
import { MarkPublishedButton } from '@/components/posts/MarkPublishedButton';

export default async function ContentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await connection(); // per-user data: render at request time (see content/page.tsx)
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) redirect('/sign-in');

  const item = await db.contentItem.findFirst({
    where: { id, userId: user.id },
    include: {
      scripts: { orderBy: { version: 'desc' }, select: { id: true, version: true, isActive: true, updatedAt: true, body: true } },
      idea: { select: { id: true, title: true } },
      post: { select: { id: true, publishedAt: true, url: true, metrics: { orderBy: { recordedAt: 'desc' }, take: 1 } } },
    },
  });
  if (!item) notFound();

  const activeScript = item.scripts.find((s) => s.isActive) ?? item.scripts[0];
  const wordCount = (body: string) => body.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div>
      <PageHeader
        back={{ href: '/content', label: 'Content pipeline' }}
        title={item.title}
        tag={<StatusBadge status={item.status} />}
        subtitle={
          <>
            {platformLabel(item.platform)} · {formatLabel(item.format)}
            {item.targetDate && ` · Due ${formatDate(item.targetDate)}`} · Created {formatDate(item.createdAt)}
            {formatDate(item.updatedAt) !== formatDate(item.createdAt) && ` · Updated ${formatDate(item.updatedAt)}`}
          </>
        }
      />

      <Card title={<span id="pipeline-heading">Pipeline</span>} aria-labelledby="pipeline-heading" style={{ marginBottom: 24 }}>
        <PipelineControls itemId={item.id} status={item.status} />
        {(item.status === 'PUBLISHED' || item.post) && (
          <>
            <Divider style={{ margin: '20px 0 16px' }} />
            {item.post ? (
              <Flex justify="space-between" align="center" gap={12} wrap>
                <Text>
                  <Text strong>Published {formatDate(item.post.publishedAt)}</Text>
                  <Text type="secondary">
                    {' · '}
                    {item.post.metrics[0]
                      ? `${(item.post.metrics[0].views ?? 0).toLocaleString('en-US')} views at last snapshot`
                      : 'No metrics logged yet'}
                  </Text>
                </Text>
                <Link href={`/posts/${item.post.id}`} style={{ fontWeight: 500, textDecoration: 'underline' }}>
                  View post &amp; log metrics →
                </Link>
              </Flex>
            ) : (
              <Flex align="center" gap={12} wrap>
                <MarkPublishedButton contentItemId={item.id} />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Creates a post dated today so you can start logging metrics.
                </Text>
              </Flex>
            )}
          </>
        )}
      </Card>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Card>
            <NotesEditor itemId={item.id} initialNotes={item.notes} />
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Flex vertical gap={24}>
            <Card title={<span id="script-heading">Script</span>} size="small" aria-labelledby="script-heading">
              {activeScript ? (
                <Flex vertical gap={12}>
                  <Text>
                    Version {activeScript.version}
                    <Text type="secondary">
                      {' '}
                      · {wordCount(activeScript.body)} words · saved {formatDate(activeScript.updatedAt)}
                    </Text>
                  </Text>
                  <ScriptDraftButton contentItemId={item.id} hasScript />
                  {item.scripts.length > 1 && (
                    <div>
                      <Text type="secondary" strong style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                        History ({item.scripts.length} versions)
                      </Text>
                      <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                        {item.scripts.map((s) => (
                          <li key={s.id} style={{ fontSize: 12 }}>
                            <Link href={`/scripts/${s.id}`} style={{ textDecoration: 'underline', fontWeight: 500 }}>
                              v{s.version}
                            </Link>{' '}
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              · {wordCount(s.body)} words · {formatDate(s.updatedAt)}
                              {s.isActive && ' · current'}
                            </Text>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </Flex>
              ) : (
                <Space orientation="vertical" size={12}>
                  <Text type="secondary">No script yet.</Text>
                  <ScriptDraftButton contentItemId={item.id} hasScript={false} />
                </Space>
              )}
            </Card>

            <Card title={<span id="details-heading">Details</span>} size="small" aria-labelledby="details-heading">
              <Descriptions
                size="small"
                column={1}
                colon={false}
                styles={{ label: { width: 100 } }}
                items={[
                  { key: 'platform', label: 'Platform', children: platformLabel(item.platform) },
                  { key: 'format', label: 'Format', children: formatLabel(item.format) },
                  { key: 'target', label: 'Target date', children: item.targetDate ? formatDate(item.targetDate) : 'Not scheduled' },
                  {
                    key: 'idea',
                    label: 'Source idea',
                    children: item.idea ? (
                      <Link href={`/ideas/${item.idea.id}`} style={{ textDecoration: 'underline' }}>
                        {item.idea.title}
                      </Link>
                    ) : (
                      'None'
                    ),
                  },
                ]}
              />
            </Card>
          </Flex>
        </Col>
      </Row>
    </div>
  );
}
