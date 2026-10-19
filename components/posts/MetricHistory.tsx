'use client';

import type { PostMetric } from '@prisma/client';
import { Card, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { METRIC_FIELDS, METRIC_LABELS, formatCount } from '@/lib/posts/schema';

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(date);
}

/** Every snapshot ever logged for a post, newest first. */
export function MetricHistory({ metrics }: { metrics: PostMetric[] }) {
  const columns: ColumnsType<PostMetric> = [
    {
      title: 'Recorded',
      dataIndex: 'recordedAt',
      key: 'recordedAt',
      render: (value: Date, _row, index) => (
        <span style={{ whiteSpace: 'nowrap', fontWeight: index === 0 ? 500 : undefined }}>
          {formatDateTime(value)}
          {index === 0 && (
            <Tag color="success" style={{ marginInlineStart: 8, marginInlineEnd: 0 }}>
              latest
            </Tag>
          )}
        </span>
      ),
    },
    ...METRIC_FIELDS.map((f) => ({
      title: METRIC_LABELS[f],
      dataIndex: f,
      key: f,
      align: 'right' as const,
      render: (value: number | null, _row: PostMetric, index: number) => (
        <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: index === 0 ? 500 : undefined }}>{formatCount(value)}</span>
      ),
    })),
  ];

  return (
    <Card aria-labelledby="metric-history-heading" title={<span id="metric-history-heading">Snapshots ({metrics.length})</span>}>
      {metrics.length === 0 ? (
        <Typography.Text type="secondary">No metrics logged yet. Use the form above to add the first snapshot.</Typography.Text>
      ) : (
        <Table<PostMetric>
          size="small"
          rowKey="id"
          columns={columns}
          dataSource={metrics}
          pagination={metrics.length > 20 ? { pageSize: 20 } : false}
          scroll={{ x: true }}
        />
      )}
    </Card>
  );
}
