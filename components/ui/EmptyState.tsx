'use client';

import { Card, Empty } from 'antd';
import { Text } from '@/components/ui/typography';

export function EmptyState({ title, description, action }: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <Card variant="borderless" style={{ background: 'transparent', border: '1px dashed var(--ant-color-border)' }}>
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        styles={{ image: { height: 56 } }}
        description={
          <span>
            <Text strong style={{ display: 'block' }}>{title}</Text>
            {description && <Text type="secondary">{description}</Text>}
          </span>
        }
      >
        {action}
      </Empty>
    </Card>
  );
}
