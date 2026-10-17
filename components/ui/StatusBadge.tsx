import { cn } from '@/lib/utils';
import type { ContentStatus } from '@/types/schema';

const STATUS_STYLES: Record<ContentStatus, string> = {
  IDEA: 'bg-slate-100 text-slate-700',
  PLANNED: 'bg-blue-100 text-blue-700',
  SCRIPT_READY: 'bg-yellow-100 text-yellow-700',
  IN_PRODUCTION: 'bg-orange-100 text-orange-700',
  READY_TO_PUBLISH: 'bg-purple-100 text-purple-700',
  PUBLISHED: 'bg-green-100 text-green-700',
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
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', STATUS_STYLES[s])}>
      {STATUS_LABELS[s] ?? s}
    </span>
  );
}
