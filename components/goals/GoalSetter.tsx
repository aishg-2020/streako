'use client';

import { useState } from 'react';
import type { Goal } from '@prisma/client';
import { setGoal } from '@/server/actions/goals';

export function GoalSetter({ goals, userId }: { goals: Goal[]; userId: string }) {
  const weeklyGoal = goals.find((g) => g.period === 'WEEKLY');
  const [posts, setPosts] = useState(weeklyGoal?.targetPosts ?? 3);
  const [scripts, setScripts] = useState(weeklyGoal?.targetScripts ?? 2);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await setGoal({ period: 'WEEKLY', targetPosts: posts, targetScripts: scripts });
    setSaving(false);
  }

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <h2 className="font-semibold text-sm">Weekly Goals</h2>
      <div className="flex gap-4">
        <div>
          <label className="text-xs text-muted-foreground">Posts target</label>
          <input
            type="number"
            min={0}
            value={posts}
            onChange={(e) => setPosts(Number(e.target.value))}
            className="mt-1 w-20 rounded-md border px-2 py-1 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Scripts target</label>
          <input
            type="number"
            min={0}
            value={scripts}
            onChange={(e) => setScripts(Number(e.target.value))}
            className="mt-1 w-20 rounded-md border px-2 py-1 text-sm"
          />
        </div>
      </div>
      <button
        onClick={handleSave}
        disabled={saving}
        className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-60"
      >
        {saving ? 'Saving...' : 'Save goal'}
      </button>
    </div>
  );
}
