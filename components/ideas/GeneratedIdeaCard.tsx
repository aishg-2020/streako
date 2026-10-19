'use client';

import Link from 'next/link';
import { Button, Card, Flex, Skeleton, Space, Tag, Typography } from 'antd';
import { CheckCircleFilled, ReloadOutlined } from '@ant-design/icons';
import { formatLabel, platformLabel } from '@/lib/ideas/schema';
import type { PartialIdea } from '@/lib/ideas/stream';
import { Caret } from '@/components/ui/Caret';

export type SlotStatus = 'streaming' | 'ready' | 'saving' | 'saved' | 'regenerating';

/** Which field is currently receiving tokens, so the caret can follow the stream. */
function activeField(idea: PartialIdea): keyof PartialIdea {
  if (idea.hooks !== undefined) return 'hooks';
  if (idea.platform !== undefined || idea.format !== undefined) return 'platform';
  if (idea.description !== undefined) return 'description';
  return 'title';
}

export function GeneratedIdeaCard({
  idea,
  status,
  savedId,
  error,
  onSave,
  onReject,
  onRegenerate,
}: {
  idea: PartialIdea;
  status: SlotStatus;
  savedId?: string;
  error?: string;
  onSave: () => void;
  onReject: () => void;
  onRegenerate: () => void;
}) {
  const streaming = status === 'streaming' || status === 'regenerating';
  const active = streaming ? activeField(idea) : null;
  const hasContent = !!idea.title;
  const busy = status !== 'ready';

  return (
    <li style={{ listStyle: 'none' }} aria-busy={streaming}>
      <Card
        size="small"
        style={{ borderColor: status === 'saved' ? 'var(--ant-color-success-border)' : undefined }}
        styles={{ body: { display: 'flex', flexDirection: 'column', gap: 8 } }}
      >
        {!hasContent ? (
          <Skeleton active paragraph={{ rows: 2 }} title={{ width: '70%' }} />
        ) : (
          <>
            <Typography.Text strong>
              {idea.title}
              {active === 'title' && <Caret />}
            </Typography.Text>
            {idea.description !== undefined && (
              <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                {idea.description}
                {active === 'description' && <Caret />}
              </Typography.Text>
            )}
            {(idea.platform || idea.format) && (
              <Space size={4} wrap>
                {idea.platform && <Tag style={{ marginInlineEnd: 0 }}>{platformLabel(idea.platform)}</Tag>}
                {idea.format && <Tag style={{ marginInlineEnd: 0 }}>{formatLabel(idea.format)}</Tag>}
                {active === 'platform' && <Caret />}
              </Space>
            )}
            {idea.hooks && idea.hooks.length > 0 && (
              <ul style={{ margin: 0, paddingInlineStart: 10, borderInlineStart: '2px solid var(--ant-color-border)', listStyle: 'none' }}>
                {idea.hooks.map((hook, i) => (
                  <li key={i}>
                    <Typography.Text italic style={{ fontSize: 12 }}>
                      “{hook}”
                      {active === 'hooks' && i === idea.hooks!.length - 1 && <Caret />}
                    </Typography.Text>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        {error && (
          <Typography.Text type="danger" role="alert" style={{ fontSize: 12 }}>
            {error}
          </Typography.Text>
        )}

        {status === 'saved' ? (
          <Flex justify="space-between" align="center" style={{ paddingTop: 4 }}>
            <Typography.Text type="success" style={{ fontSize: 12 }}>
              <CheckCircleFilled style={{ marginInlineEnd: 6 }} />
              Saved to your idea bank
            </Typography.Text>
            {savedId && (
              <Link href={`/ideas/${savedId}`} style={{ fontSize: 12, fontWeight: 500, textDecoration: 'underline' }}>
                View idea
              </Link>
            )}
          </Flex>
        ) : (
          <Flex gap={8} wrap align="center" style={{ paddingTop: 4 }}>
            <Button type="primary" size="small" onClick={onSave} disabled={busy} loading={status === 'saving'}>
              {status === 'saving' ? 'Saving…' : 'Save'}
            </Button>
            <Button size="small" icon={<ReloadOutlined />} onClick={onRegenerate} disabled={busy} loading={status === 'regenerating'}>
              {status === 'regenerating' ? 'Regenerating…' : 'Regenerate'}
            </Button>
            <Button size="small" danger type="text" onClick={onReject} disabled={busy} style={{ marginInlineStart: 'auto' }}>
              Reject
            </Button>
          </Flex>
        )}
      </Card>
    </li>
  );
}
