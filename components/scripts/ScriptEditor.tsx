'use client';

import { useState } from 'react';
import type { Script } from '@prisma/client';
import { saveScript, createScriptVersion } from '@/server/actions/scripts';

type Feedback = {
  overallScore: number;
  strengths: string[];
  improvements: string[];
  hookAnalysis: string;
  suggestions: string[];
};

export function ScriptEditor({ script }: { script: Script & { contentItem: { id: string; title: string } } }) {
  const [body, setBody] = useState(script.body);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(
    script.aiFeedback as Feedback | null
  );
  const [loadingFeedback, setLoadingFeedback] = useState(false);

  async function handleSave() {
    setSaving(true);
    await saveScript(script.contentItemId, body);
    setSaving(false);
  }

  async function handleNewVersion() {
    setSaving(true);
    await createScriptVersion(script.contentItemId, body);
    setSaving(false);
  }

  async function handleGetFeedback() {
    setLoadingFeedback(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/ai/script-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scriptId: script.id, scriptBody: body }),
      });
      const text = await res.text();
      const lines = text.trim().split('\n').filter(Boolean);
      for (const line of lines.reverse()) {
        try {
          const parsed = JSON.parse(line);
          if (parsed.overallScore) { setFeedback(parsed); break; }
        } catch { /* continue */ }
      }
    } finally {
      setLoadingFeedback(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-3">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="w-full h-96 rounded-lg border bg-card p-4 text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Write your script here..."
        />
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={handleNewVersion}
            disabled={saving}
            className="rounded-md border px-4 py-2 text-sm disabled:opacity-60"
          >
            New Version
          </button>
          <button
            onClick={handleGetFeedback}
            disabled={loadingFeedback || !body.trim()}
            className="rounded-md border px-4 py-2 text-sm disabled:opacity-60"
          >
            {loadingFeedback ? 'Analysing...' : 'Get AI Feedback'}
          </button>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-4 space-y-4">
        <h2 className="font-semibold text-sm">AI Feedback</h2>
        {!feedback && !loadingFeedback && (
          <p className="text-sm text-muted-foreground">Click &quot;Get AI Feedback&quot; to analyse your script.</p>
        )}
        {loadingFeedback && <p className="text-sm text-muted-foreground animate-pulse">Analysing...</p>}
        {feedback && (
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-medium">Score:</span>
              <span className="text-2xl font-bold">{feedback.overallScore}/10</span>
            </div>
            <div>
              <p className="font-medium mb-1">Hook Analysis</p>
              <p className="text-muted-foreground">{feedback.hookAnalysis}</p>
            </div>
            <div>
              <p className="font-medium mb-1">Strengths</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                {feedback.strengths.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
            <div>
              <p className="font-medium mb-1">Improvements</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                {feedback.improvements.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
