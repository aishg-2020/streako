import { Tag } from 'antd';
import type { ContentStatus } from '@/types/schema';

const STATUS_COLORS: Record<ContentStatus, string> = {
  IDEA: 'default',
  PLANNED: 'blue',
  SCRIPT_READY: 'gold',
  IN_PRODUCTION: 'orange',
  READY_TO_PUBLISH: 'purple',
  PUBLISHED: 'green',
};

const STATUS_LABELS: Record<ContentStatus, string> = {
  IDEA: 'Idea',
  PLANNED: 'Planned',
  SCRIPT_READY: 'Script Ready',
  IN_PRODUCTION: 'In Production',
  READY_TO_PUBLISH: 'Ready to Publish',
  PUBLISHED: 'Published',
};

export function StatusBadge({ status }: { status: string }) {
  const s = status as ContentStatus;
  return (
    <Tag color={STATUS_COLORS[s] ?? 'default'} style={{ marginInlineEnd: 0 }}>
      {STATUS_LABELS[s] ?? s}
    </Tag>
  );
}
