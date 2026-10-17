'use client';

import { useState } from 'react';
import type { WeeklyReview } from '@prisma/client';
import { formatDate } from '@/lib/utils';

// In SQLite dev mode, array fields are JSON strings; in production they're real arrays.
function toArray(val: unknown): string[] {
  if (Array.isArray(val)) return val as string[];
  if (typeof val === 'string') { try { return JSON.parse(val); } catch { return []; } }
  return [];
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
      <div className="rounded-lg border bg-card p-6 text-center space-y-3">
        <p className="text-sm text-muted-foreground">No weekly review yet.</p>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-60"
        >
          {generating ? 'Generating...' : 'Generate Review'}
        </button>
      </div>
    );
  }

  const achievements = toArray(review.achievements);
  const improvements = toArray(review.improvements);
  const priorities = toArray(review.priorities);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card p-4">
        <p className="text-xs text-muted-foreground mb-1">Week of {formatDate(review.weekStart)}</p>
        <p className="text-sm">{review.summary}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-card p-4">
          <h3 className="font-semibold text-sm mb-2">Achievements</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            {achievements.map((a, i) => <li key={i}>{a}</li>)}
          </ul>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <h3 className="font-semibold text-sm mb-2">Improvements</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            {improvements.map((a, i) => <li key={i}>{a}</li>)}
          </ul>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <h3 className="font-semibold text-sm mb-2">Priorities for Next Week</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            {priorities.map((a, i) => <li key={i}>{a}</li>)}
          </ul>
        </div>
      </div>

      <button
        onClick={handleGenerate}
        disabled={generating}
        className="rounded-md border px-4 py-2 text-sm disabled:opacity-60"
      >
        {generating ? 'Regenerating...' : 'Regenerate'}
      </button>
    </div>
  );
}
