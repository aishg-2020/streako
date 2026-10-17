'use client';

import { useState } from 'react';
import { createIdea } from '@/server/actions/ideas';
import type { CreatorProfile } from '@prisma/client';

type GeneratedIdea = {
  title: string;
  description: string;
  format: string;
  platform: string;
  hooks: string[];
};

export function AIIdeatePanel({ userId, profile }: { userId: string; profile: CreatorProfile | null }) {
  const [topic, setTopic] = useState('');
  const [ideas, setIdeas] = useState<GeneratedIdea[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setIdeas([]);
    try {
      const res = await fetch('/api/ai/ideate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic }),
      });
      const text = await res.text();
      // Parse streamed object — last complete JSON object
      const lines = text.trim().split('\n').filter(Boolean);
      for (const line of lines.reverse()) {
        try {
          const parsed = JSON.parse(line);
          if (parsed.ideas) { setIdeas(parsed.ideas); break; }
        } catch { /* continue */ }
      }
    } finally {
      setLoading(false);
    }
  }

  async function saveIdea(idea: GeneratedIdea) {
    setSaving(idea.title);
    await createIdea({
      title: idea.title,
      description: idea.description,
      format: idea.format as never,
      platform: idea.platform as never,
      hooks: idea.hooks,
    });
    setSaving(null);
  }

  return (
    <div className="rounded-lg border bg-card p-4 space-y-4">
      <h2 className="font-semibold text-sm">AI Idea Generator</h2>
      {!profile && (
        <p className="text-xs text-muted-foreground">Complete your profile to unlock AI ideas.</p>
      )}
      <div className="flex gap-2">
        <input
          className="flex-1 rounded-md border px-3 py-2 text-sm"
          placeholder="Optional topic..."
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          disabled={!profile}
        />
        <button
          onClick={generate}
          disabled={loading || !profile}
          className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-60"
        >
          {loading ? '...' : 'Generate'}
        </button>
      </div>

      {ideas.length > 0 && (
        <ul className="space-y-3">
          {ideas.map((idea, i) => (
            <li key={i} className="rounded-md border p-3 space-y-1">
              <p className="text-sm font-medium">{idea.title}</p>
              <p className="text-xs text-muted-foreground">{idea.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{idea.platform} · {idea.format}</span>
                <button
                  onClick={() => saveIdea(idea)}
                  disabled={saving === idea.title}
                  className="rounded-md bg-primary px-2 py-1 text-xs text-primary-foreground disabled:opacity-60"
                >
                  {saving === idea.title ? 'Saving...' : 'Save'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
