import Link from 'next/link';
import { auth } from '@/lib/auth-server';
import { notFound, redirect } from 'next/navigation';
import { connection } from 'next/server';
import { Card, Col, Descriptions, Flex, Row } from 'antd';
import { db } from '@/lib/db';
import { formatDate } from '@/lib/utils';
import { formatLabel, parseHooks, platformLabel } from '@/lib/ideas/schema';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { PageHeader } from '@/components/ui/PageHeader';
import { Paragraph, Text, Title } from '@/components/ui/typography';
import { IdeaStatusBadge } from '@/components/ideas/IdeaStatusBadge';
import { IdeaActions } from '@/components/ideas/IdeaActions';

export default async function IdeaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await connection(); // per-user data: render at request time (see ideas/page.tsx)
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) redirect('/sign-in');

  const idea = await db.idea.findFirst({
    where: { id, userId: user.id },
    include: {
      contentItem: { include: { _count: { select: { scripts: true } } } },
    },
  });
  if (!idea) notFound();

  const hooks = parseHooks(idea.hooks);
  const content = idea.contentItem;

  return (
    <div>
      <PageHeader
        back={{ href: '/ideas', label: 'All ideas' }}
        title={idea.title}
        tag={<IdeaStatusBadge status={idea.status} />}
        subtitle={
          <>
            {platformLabel(idea.platform)} · {formatLabel(idea.format)} · Added {formatDate(idea.createdAt)}
            {formatDate(idea.updatedAt) !== formatDate(idea.createdAt) && ` · Updated ${formatDate(idea.updatedAt)}`}
          </>
        }
      />

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Card>
            <Title level={5}>Description</Title>
            <Paragraph style={{ whiteSpace: 'pre-wrap' }}>{idea.description}</Paragraph>

            <Title level={5} style={{ marginTop: 24 }}>
              Hooks
            </Title>
            {hooks.length > 0 ? (
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {hooks.map((hook, i) => (
                  <li key={i} style={{ borderInlineStart: '2px solid var(--ant-color-border)', paddingInlineStart: 12 }}>
                    <Text italic>“{hook}”</Text>
                  </li>
                ))}
              </ul>
            ) : (
              <Text type="secondary">No hooks for this idea.</Text>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Flex vertical gap={24} data-testid="idea-sidebar">
            <Card title="Content item" size="small">
              {content ? (
                <Flex vertical gap={12}>
                  <Flex justify="space-between" align="flex-start" gap={8}>
                    <Text strong>{content.title}</Text>
                    <StatusBadge status={content.status} />
                  </Flex>
                  <Descriptions
                    size="small"
                    column={1}
                    colon={false}
                    styles={{ label: { width: 100 } }}
                    items={[
                      { key: 'platform', label: 'Platform', children: platformLabel(content.platform) },
                      { key: 'format', label: 'Format', children: formatLabel(content.format) },
                      { key: 'target', label: 'Target date', children: content.targetDate ? formatDate(content.targetDate) : 'Not scheduled' },
                      { key: 'scripts', label: 'Scripts', children: content._count.scripts },
                      { key: 'created', label: 'Created', children: formatDate(content.createdAt) },
                    ]}
                  />
                  <Link href="/content" style={{ fontWeight: 500, textDecoration: 'underline' }}>
                    Open content pipeline →
                  </Link>
                </Flex>
              ) : idea.status === 'REJECTED' ? (
                <Text type="secondary">This idea was rejected. Restore it to convert it into a content item.</Text>
              ) : (
                <Text type="secondary">
                  Not converted yet. Converting creates a content item in your pipeline with this idea&apos;s title, platform,
                  format, description and hooks.
                </Text>
              )}
            </Card>

            {!content && (
              <Card title="Actions" size="small">
                <IdeaActions ideaId={idea.id} status={idea.status} size="md" allowDelete />
              </Card>
            )}
          </Flex>
        </Col>
      </Row>
    </div>
  );
}
