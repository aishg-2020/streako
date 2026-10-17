'use client';

import { useState } from 'react';
import type { PostMetric } from '@prisma/client';
import { addMetricSnapshot } from '@/server/actions/posts';
import { formatDate } from '@/lib/utils';

export function MetricsForm({ postId, history }: { postId: string; history: PostMetric[] }) {
  const [form, setForm] = useState({ views: '', likes: '', comments: '', shares: '', saves: '' });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await addMetricSnapshot(postId, {
      views: form.views ? Number(form.views) : undefined,
      likes: form.likes ? Number(form.likes) : undefined,
      comments: form.comments ? Number(form.comments) : undefined,
      shares: form.shares ? Number(form.shares) : undefined,
      saves: form.saves ? Number(form.saves) : undefined,
    });
    setForm({ views: '', likes: '', comments: '', shares: '', saves: '' });
    setSaving(false);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card p-4">
        <h2 className="font-semibold text-sm mb-3">Add Metric Snapshot</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {(['views', 'likes', 'comments', 'shares', 'saves'] as const).map((field) => (
            <input
              key={field}
              type="number"
              min={0}
              placeholder={field}
              className="rounded-md border px-3 py-2 text-sm"
              value={form[field]}
              onChange={(e) => setForm((p) => ({ ...p, [field]: e.target.value }))}
            />
          ))}
          <button
            type="submit"
            disabled={saving}
            className="col-span-2 sm:col-span-5 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save snapshot'}
          </button>
        </form>
      </div>

      {history.length > 0 && (
        <div className="rounded-lg border bg-card p-4">
          <h2 className="font-semibold text-sm mb-3">History</h2>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-muted-foreground border-b">
                <th className="pb-2">Date</th>
                <th className="pb-2">Views</th>
                <th className="pb-2">Likes</th>
                <th className="pb-2">Comments</th>
                <th className="pb-2">Shares</th>
                <th className="pb-2">Saves</th>
              </tr>
            </thead>
            <tbody>
              {history.map((m) => (
                <tr key={m.id} className="border-b last:border-0">
                  <td className="py-2">{formatDate(m.recordedAt)}</td>
                  <td className="py-2">{m.views ?? '—'}</td>
                  <td className="py-2">{m.likes ?? '—'}</td>
                  <td className="py-2">{m.comments ?? '—'}</td>
                  <td className="py-2">{m.shares ?? '—'}</td>
                  <td className="py-2">{m.saves ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
