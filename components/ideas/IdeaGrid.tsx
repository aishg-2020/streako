'use client';

import { useState } from 'react';
import { Badge, Col, Row, Tabs } from 'antd';
import { EmptyState } from '@/components/ui/EmptyState';
import { IDEA_STATUSES, IDEA_STATUS_LABELS } from '@/lib/ideas/schema';
import type { IdeaStatus } from '@/types/schema';
import { IdeaCard, type IdeaWithContent } from './IdeaCard';

type Filter = 'ALL' | IdeaStatus;

export function IdeaGrid({ ideas }: { ideas: IdeaWithContent[] }) {
  const [filter, setFilter] = useState<Filter>('ALL');

  if (ideas.length === 0) {
    return (
      <EmptyState
        title="No ideas yet"
        description="Use the AI panel to generate ideas, or add one manually with “New idea”."
      />
    );
  }

  const counts = Object.fromEntries(
    IDEA_STATUSES.map((s) => [s, ideas.filter((i) => i.status === s).length])
  ) as Record<IdeaStatus, number>;
  const tabs: { value: Filter; label: string; count: number }[] = [
    { value: 'ALL', label: 'All', count: ideas.length },
    ...IDEA_STATUSES.map((s) => ({ value: s, label: IDEA_STATUS_LABELS[s], count: counts[s] })),
  ];
  const visible = filter === 'ALL' ? ideas : ideas.filter((i) => i.status === filter);

  return (
    <div>
      <Tabs
        activeKey={filter}
        onChange={(key) => setFilter(key as Filter)}
        items={tabs.map((tab) => ({
          key: tab.value,
          label: (
            <span>
              {tab.label} <Badge count={tab.count} showZero color={filter === tab.value ? undefined : 'var(--ant-color-fill-secondary)'} style={{ marginInlineStart: 4, color: filter === tab.value ? undefined : 'var(--ant-color-text-secondary)' }} />
            </span>
          ),
        }))}
      />

      {visible.length === 0 ? (
        <EmptyState title={`No ${IDEA_STATUS_LABELS[filter as IdeaStatus].toLowerCase()} ideas`} />
      ) : (
        <Row gutter={[16, 16]}>
          {visible.map((idea) => (
            <Col key={idea.id} xs={24} md={12}>
              <IdeaCard idea={idea} />
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
}
