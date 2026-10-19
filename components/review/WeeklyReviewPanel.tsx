'use client';

import { useState } from 'react';
import type { WeeklyReview } from '@prisma/client';
import { Button, Card, Col, Flex, Row, Typography } from 'antd';
import { ReloadOutlined, StarOutlined } from '@ant-design/icons';
import { formatDate } from '@/lib/utils';

// In SQLite dev mode, array fields are JSON strings; in production they're real arrays.
function toArray(val: unknown): string[] {
  if (Array.isArray(val)) return val as string[];
  if (typeof val === 'string') { try { return JSON.parse(val); } catch { return []; } }
  return [];
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul style={{ margin: 0, paddingInlineStart: 18, lineHeight: 1.7 }}>
      {items.map((a, i) => (
        <li key={i}>
          <Typography.Text type="secondary">{a}</Typography.Text>
        </li>
      ))}
    </ul>
  );
}

export function WeeklyReviewPanel({ review, userId }: { review: WeeklyReview | null; userId: string }) {
  const [generating, setGenerating] = useState(false);

  async function handleGenerate() {
    setGenerating(true);
    await fetch('/api/ai/weekly-review', { method: 'POST' });
    setGenerating(false);
    window.location.reload();
  }

  if (!review) {
    return (
      <Card>
        <Flex vertical align="center" gap={12} style={{ padding: 16, textAlign: 'center' }}>
          <Typography.Text type="secondary">No weekly review yet.</Typography.Text>
          <Button type="primary" icon={<StarOutlined />} onClick={handleGenerate} loading={generating}>
            {generating ? 'Generating...' : 'Generate Review'}
          </Button>
        </Flex>
      </Card>
    );
  }

  const achievements = toArray(review.achievements);
  const improvements = toArray(review.improvements);
  const priorities = toArray(review.priorities);

  return (
    <Flex vertical gap={16}>
      <Card>
        <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
          Week of {formatDate(review.weekStart)}
        </Typography.Text>
        <Typography.Paragraph style={{ marginBottom: 0 }}>{review.summary}</Typography.Paragraph>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card title="Achievements" size="small" style={{ height: '100%' }}>
            <BulletList items={achievements} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card title="Improvements" size="small" style={{ height: '100%' }}>
            <BulletList items={improvements} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card title="Priorities for Next Week" size="small" style={{ height: '100%' }}>
            <BulletList items={priorities} />
          </Card>
        </Col>
      </Row>

      <div>
        <Button icon={<ReloadOutlined />} onClick={handleGenerate} loading={generating}>
          {generating ? 'Regenerating...' : 'Regenerate'}
        </Button>
      </div>
    </Flex>
  );
}
