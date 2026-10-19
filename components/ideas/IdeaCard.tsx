'use client';

import Link from 'next/link';
import type { Idea } from '@prisma/client';
import { Card, Flex, Space, Typography } from 'antd';
import { CheckCircleFilled } from '@ant-design/icons';
import { formatDate } from '@/lib/utils';
import { formatLabel, parseHooks, platformLabel } from '@/lib/ideas/schema';
import { IdeaActions } from './IdeaActions';
import { IdeaStatusBadge } from './IdeaStatusBadge';

export type IdeaWithContent = Idea & { contentItem: { id: string; status: string } | null };

export function IdeaCard({ idea }: { idea: IdeaWithContent }) {
  const hookCount = parseHooks(idea.hooks).length;
  const rejected = idea.status === 'REJECTED';

  return (
    <Card
      hoverable
      role="article"
      size="small"
      style={{ height: '100%', opacity: rejected ? 0.7 : 1 }}
      styles={{ body: { display: 'flex', flexDirection: 'column', gap: 8, height: '100%' } }}
    >
      <Flex justify="space-between" align="flex-start" gap={8}>
        <Typography.Text strong>
          <Link href={`/ideas/${idea.id}`}>{idea.title}</Link>
        </Typography.Text>
        <IdeaStatusBadge status={idea.status} />
      </Flex>

      <Typography.Paragraph type="secondary" ellipsis={{ rows: 2 }} style={{ marginBottom: 0, fontSize: 13 }}>
        {idea.description}
      </Typography.Paragraph>

      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        {platformLabel(idea.platform)} · {formatLabel(idea.format)}
        {hookCount > 0 && ` · ${hookCount} hook${hookCount === 1 ? '' : 's'}`}
        {' · '}
        {/* Server and browser timezones may differ around midnight. */}
        <time dateTime={new Date(idea.createdAt).toISOString()} suppressHydrationWarning>
          {formatDate(idea.createdAt)}
        </time>
      </Typography.Text>

      <div style={{ marginTop: 'auto', paddingTop: 4 }}>
        {idea.contentItem ? (
          <Space size={6}>
            <CheckCircleFilled style={{ color: 'var(--ant-color-success)' }} />
            <Typography.Text type="success" style={{ fontSize: 12 }}>
              Content item created ·{' '}
              <Link href={`/ideas/${idea.id}`} style={{ textDecoration: 'underline' }}>
                View details
              </Link>
            </Typography.Text>
          </Space>
        ) : (
          <IdeaActions ideaId={idea.id} status={idea.status} />
        )}
      </div>
    </Card>
  );
}
