'use client';

import Link from 'next/link';
import type { Idea } from '@prisma/client';
import { deleteIdea, convertIdeaToContent } from '@/server/actions/ideas';
import { useRouter } from 'next/navigation';

export function IdeaCard({ idea }: { idea: Idea }) {
  const router = useRouter();

  async function handleConvert() {
    const contentId = await convertIdeaToContent(idea.id);
    router.push(`/content/${contentId}`);
  }

  return (
    <div className="rounded-lg border bg-card p-4 space-y-2 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <Link href={`/ideas/${idea.id}`} className="font-medium text-sm hover:underline">
          {idea.title}
        </Link>
        <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          {idea.status}
        </span>
      </div>
      <p className="text-xs text-muted-foreground line-clamp-2">{idea.description}</p>
      <div className="flex gap-1 text-xs text-muted-foreground">
        <span>{idea.platform}</span>
        <span>·</span>
        <span>{idea.format}</span>
      </div>
      {idea.status === 'SAVED' && (
        <div className="flex gap-2 pt-1">
          <button
            onClick={handleConvert}
            className="rounded-md bg-primary px-3 py-1 text-xs text-primary-foreground"
          >
            Convert to Content
          </button>
          <button
            onClick={() => deleteIdea(idea.id)}
            className="rounded-md border px-3 py-1 text-xs text-muted-foreground hover:text-destructive"
          >
            Reject
          </button>
        </div>
      )}
    </div>
  );
}
