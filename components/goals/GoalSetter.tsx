'use client';

import { useState } from 'react';
import type { Goal } from '@prisma/client';
import { Button, Card, Flex, Form, InputNumber } from 'antd';
import { setGoal } from '@/server/actions/goals';

export function GoalSetter({ goals, userId }: { goals: Goal[]; userId: string }) {
  const weeklyGoal = goals.find((g) => g.period === 'WEEKLY');
  const [posts, setPosts] = useState(weeklyGoal?.targetPosts ?? 3);
  const [scripts, setScripts] = useState(weeklyGoal?.targetScripts ?? 2);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await setGoal({ period: 'WEEKLY', targetPosts: posts, targetScripts: scripts });
    setSaving(false);
  }

  return (
    <Card title="Weekly Goals" size="small">
      <Form layout="vertical" component="div">
        <Flex gap={16} wrap>
          <Form.Item label="Posts target" style={{ marginBottom: 12 }}>
            <InputNumber min={0} value={posts} onChange={(value) => setPosts(Number(value))} style={{ width: 96 }} />
          </Form.Item>
          <Form.Item label="Scripts target" style={{ marginBottom: 12 }}>
            <InputNumber min={0} value={scripts} onChange={(value) => setScripts(Number(value))} style={{ width: 96 }} />
          </Form.Item>
        </Flex>
      </Form>
      <Button type="primary" onClick={handleSave} loading={saving}>
        {saving ? 'Saving...' : 'Save goal'}
      </Button>
    </Card>
  );
}
