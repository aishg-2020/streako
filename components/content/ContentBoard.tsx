import Link from 'next/link';
import type { ContentItem } from '@prisma/client';
import { Badge, Button, Card, Flex, Space, Tag } from 'antd';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Text } from '@/components/ui/typography';
import { formatDate } from '@/lib/utils';
import { CONTENT_PIPELINE, CONTENT_STATUS_LABELS } from '@/lib/content/pipeline';
import { formatLabel, platformLabel } from '@/lib/ideas/schema';
import { brand } from '@/lib/theme';

export type BoardItem = ContentItem & { _count: { scripts: number } };

const COLUMN_ACCENTS: Record<(typeof CONTENT_PIPELINE)[number], string> = {
  IDEA: '#9CA3AF',
  PLANNED: '#3B82F6',
  SCRIPT_READY: '#EAB308',
  IN_PRODUCTION: '#F97316',
  READY_TO_PUBLISH: '#A855F7',
  PUBLISHED: '#22C55E',
};

/** Kanban-style board: one column per pipeline stage, newest items first. */
export function ContentBoard({ items }: { items: BoardItem[] }) {
  if (items.length === 0) {
    return (
      <EmptyState
        title="No content items yet"
        description="Convert an idea to a content item to get started."
        action={
          <Link href="/ideas">
            <Button type="primary">Go to ideas</Button>
          </Link>
        }
      />
    );
  }

  const columns = CONTENT_PIPELINE.map((status) => ({
    status,
    items: items.filter((item) => item.status === status),
  }));

  return (
    <div style={{ overflowX: 'auto', margin: '0 -32px', padding: '0 32px 8px' }}>
      <div
        role="list"
        aria-label="Content pipeline board"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(172px, 1fr))', gap: 12, minWidth: 1092 }}
      >
        {columns.map(({ status, items: columnItems }) => (
          <section
            key={status}
            role="listitem"
            aria-labelledby={`column-${status}`}
            style={{
              display: 'flex',
              flexDirection: 'column',
              minHeight: 240,
              borderRadius: 14,
              background: '#ECEAF6',
              padding: 10,
            }}
          >
            <Flex
              align="center"
              justify="space-between"
              style={{ padding: '6px 8px 10px', borderBottom: `3px solid ${COLUMN_ACCENTS[status]}`, marginBottom: 10 }}
            >
              <Text id={`column-${status}`} strong style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.4 }}>
                {CONTENT_STATUS_LABELS[status]}
              </Text>
              <Badge count={columnItems.length} showZero color={columnItems.length ? COLUMN_ACCENTS[status] : '#C4C1D6'} />
            </Flex>
            <Flex vertical gap={10} component="ul" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {columnItems.map((item) => (
                <li key={item.id}>
                  <Link href={`/content/${item.id}`} style={{ display: 'block' }}>
                    <Card
                      hoverable
                      size="small"
                      styles={{ body: { display: 'flex', flexDirection: 'column', gap: 8 } }}
                      style={{ borderInlineStart: `3px solid ${COLUMN_ACCENTS[status]}` }}
                    >
                      <Text strong style={{ lineHeight: 1.35 }}>
                        {item.title}
                      </Text>
                      <Space size={4} wrap>
                        <Tag style={{ marginInlineEnd: 0 }}>{platformLabel(item.platform)}</Tag>
                        <Tag style={{ marginInlineEnd: 0 }}>{formatLabel(item.format)}</Tag>
                      </Space>
                      <Flex justify="space-between" align="center" gap={6} wrap>
                        <StatusBadge status={item.status} />
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          {item.targetDate
                            ? `Due ${formatDate(item.targetDate)}`
                            : item._count.scripts > 0
                              ? `${item._count.scripts} script v.`
                              : ''}
                        </Text>
                      </Flex>
                    </Card>
                  </Link>
                </li>
              ))}
            </Flex>
            {columnItems.length === 0 && (
              <Text type="secondary" style={{ textAlign: 'center', fontSize: 12, padding: '24px 0', color: brand.muted }}>
                Empty
              </Text>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
