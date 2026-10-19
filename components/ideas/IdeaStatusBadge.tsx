import { Tag } from 'antd';
import { IDEA_STATUS_LABELS } from '@/lib/ideas/schema';
import type { IdeaStatus } from '@/types/schema';

const STATUS_COLORS: Record<IdeaStatus, string> = {
  SAVED: 'blue',
  CONVERTED: 'green',
  REJECTED: 'default',
};

export function IdeaStatusBadge({ status, style }: { status: string; style?: React.CSSProperties }) {
  const s = status as IdeaStatus;
  return (
    <Tag color={STATUS_COLORS[s] ?? 'default'} style={{ marginInlineEnd: 0, ...style }}>
      {IDEA_STATUS_LABELS[s] ?? status}
    </Tag>
  );
}
