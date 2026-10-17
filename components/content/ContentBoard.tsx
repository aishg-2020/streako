'use client';

import Link from 'next/link';
import type { ContentItem, Idea } from '@prisma/client';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDate } from '@/lib/utils';

type ContentItemWithIdea = ContentItem & { idea: Idea | null };

export function ContentBoard({ items }: { items: ContentItemWithIdea[] }) {
  if (items.length === 0) {
    return (
      <EmptyState
        title="No content items yet"
        description="Convert an idea to a content item to get started."
      />
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <Link
          key={item.id}
          href={`/content/${item.id}`}
          className="flex items-center justify-between rounded-lg border bg-card px-4 py-3 hover:shadow-sm transition-shadow"
        >
          <div>
            <p className="font-medium text-sm">{item.title}</p>
            <p className="text-xs text-muted-foreground">
              {item.platform} · {item.format}
              {item.targetDate && ` · Due ${formatDate(item.targetDate)}`}
            </p>
          </div>
          <StatusBadge status={item.status} />
        </Link>
      ))}
    </div>
  );
}
