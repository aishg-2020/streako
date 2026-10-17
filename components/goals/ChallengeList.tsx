'use client';

import { useState } from 'react';
import type { ChallengeLog } from '@prisma/client';
import { completeChallenge } from '@/server/actions/goals';
import { formatDate } from '@/lib/utils';
import { EmptyState } from '@/components/ui/EmptyState';

export function ChallengeList({ challenges, userId }: { challenges: ChallengeLog[]; userId: string }) {
  const [desc, setDesc] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleAdd() {
    if (!desc.trim()) return;
    setSaving(true);
    await completeChallenge(desc.trim());
    setDesc('');
    setSaving(false);
  }

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <h2 className="font-semibold text-sm">Challenge Log</h2>
      <div className="flex gap-2">
        <input
          className="flex-1 rounded-md border px-3 py-2 text-sm"
          placeholder="Log a completed challenge..."
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <button
          onClick={handleAdd}
          disabled={saving || !desc.trim()}
          className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-60"
        >
          Add
        </button>
      </div>
      {challenges.length === 0 ? (
        <EmptyState title="No challenges logged yet" />
      ) : (
        <ul className="space-y-2">
          {challenges.map((c) => (
            <li key={c.id} className="flex justify-between text-sm">
              <span>{c.description}</span>
              <span className="text-xs text-muted-foreground">{formatDate(c.completedAt)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
