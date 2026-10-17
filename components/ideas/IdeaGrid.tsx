'use client';

import type { Idea } from '@prisma/client';
import { EmptyState } from '@/components/ui/EmptyState';
import { IdeaCard } from './IdeaCard';

export function IdeaGrid({ ideas }: { ideas: Idea[] }) {
  if (ideas.length === 0) {
    return (
      <EmptyState
        title="No ideas yet"
        description="Use the AI panel to generate ideas, or add one manually."
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {ideas.map((idea) => (
        <IdeaCard key={idea.id} idea={idea} />
      ))}
    </div>
  );
}
