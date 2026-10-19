'use client';

import { useState } from 'react';
import type { ChallengeLog } from '@prisma/client';
import { Button, Card, Flex, Input, Typography } from 'antd';
import { RowList } from '@/components/ui/RowList';
import { completeChallenge } from '@/server/actions/goals';
import { formatDate } from '@/lib/utils';
import { EmptyState } from '@/components/ui/EmptyState';

export function ChallengeList({ challenges, userId }: { challenges: ChallengeLog[]; userId: string }) {
  const [desc, setDesc] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleAdd() {
    if (!desc.trim()) return;
    setSaving(true);
    await completeChallenge(desc.trim());
    setDesc('');
    setSaving(false);
  }

  return (
    <Card title="Challenge Log" size="small">
      <Flex gap={8} style={{ marginBottom: 16 }}>
        <Input
          placeholder="Log a completed challenge..."
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <Button type="primary" onClick={handleAdd} disabled={saving || !desc.trim()} loading={saving}>
          Add
        </Button>
      </Flex>
      {challenges.length === 0 ? (
        <EmptyState title="No challenges logged yet" />
      ) : (
        <RowList
          size="small"
          items={challenges}
          rowKey={(c) => c.id}
          renderItem={(c) => (
            <Flex justify="space-between" style={{ width: '100%' }} gap={12}>
              <Typography.Text>{c.description}</Typography.Text>
              <Typography.Text type="secondary" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
                {formatDate(c.completedAt)}
              </Typography.Text>
            </Flex>
          )}
        />
      )}
    </Card>
  );
}
