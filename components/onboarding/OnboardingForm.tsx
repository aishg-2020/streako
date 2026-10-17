'use client';

import { useState } from 'react';
import { saveProfile, type ProfileFormData } from '@/server/actions/profile';

const PLATFORMS = ['INSTAGRAM', 'YOUTUBE', 'TIKTOK', 'LINKEDIN', 'TWITTER', 'OTHER'] as const;
const EXPERIENCE_LEVELS = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as const;

const STEPS = ['About You', 'Your Niche', 'Platforms', 'Schedule', 'Goals'];

export function OnboardingForm({ userId }: { userId: string }) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<ProfileFormData>>({
    platforms: [],
    contentCategories: [],
    postingFrequency: 3,
    availableHours: 10,
    experienceLevel: 'BEGINNER',
  });

  function update(key: keyof ProfileFormData, value: unknown) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit() {
    setSaving(true);
    await saveProfile(form as ProfileFormData);
  }

  return (
    <div className="rounded-lg border bg-card p-6 space-y-6">
      <div className="flex gap-2">
        {STEPS.map((s, i) => (
          <div
            key={s}
            className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-primary' : 'bg-muted'}`}
          />
        ))}
      </div>

      <p className="text-sm font-medium text-muted-foreground">Step {step + 1} of {STEPS.length}: {STEPS[step]}</p>

      {step === 0 && (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Display Name</label>
            <input
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              value={form.displayName ?? ''}
              onChange={(e) => update('displayName', e.target.value)}
              placeholder="Your creator name"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Experience Level</label>
            <select
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              value={form.experienceLevel}
              onChange={(e) => update('experienceLevel', e.target.value)}
            >
              {EXPERIENCE_LEVELS.map((l) => <option key={l}>{l}</option>)}
            </select>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Niche</label>
            <input
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              value={form.niche ?? ''}
              onChange={(e) => update('niche', e.target.value)}
              placeholder="e.g. Personal Finance, Fitness, Tech"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Target Audience</label>
            <input
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              value={form.targetAudience ?? ''}
              onChange={(e) => update('targetAudience', e.target.value)}
              placeholder="e.g. Young professionals aged 25-35"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Tone</label>
            <input
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              value={form.tone ?? ''}
              onChange={(e) => update('tone', e.target.value)}
              placeholder="e.g. Educational, Entertaining, Motivational"
            />
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Platforms (select all that apply)</label>
          <div className="flex flex-wrap gap-2 mt-2">
            {PLATFORMS.map((p) => {
              const selected = form.platforms?.includes(p as never);
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    const current = form.platforms ?? [];
                    update('platforms', selected ? current.filter((x) => x !== p) : [...current, p]);
                  }}
                  className={`rounded-full px-4 py-1.5 text-sm border transition-colors ${
                    selected ? 'bg-primary text-primary-foreground border-primary' : 'border-muted'
                  }`}
                >
                  {p}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Target posts per week</label>
            <input
              type="number"
              min={1}
              max={30}
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              value={form.postingFrequency ?? 3}
              onChange={(e) => update('postingFrequency', Number(e.target.value))}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Hours available per week for creation</label>
            <input
              type="number"
              min={1}
              max={80}
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              value={form.availableHours ?? 10}
              onChange={(e) => update('availableHours', Number(e.target.value))}
            />
          </div>
        </div>
      )}

      {step === 4 && (
        <div>
          <label className="text-sm font-medium">Primary Goal</label>
          <textarea
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm h-24 resize-none"
            value={form.primaryGoal ?? ''}
            onChange={(e) => update('primaryGoal', e.target.value)}
            placeholder="e.g. Grow to 10k followers in 6 months and monetise through brand deals"
          />
        </div>
      )}

      <div className="flex justify-between pt-2">
        <button
          type="button"
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 0}
          className="text-sm text-muted-foreground disabled:opacity-0"
        >
          Back
        </button>
        {step < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={() => setStep((s) => s + 1)}
            className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
          >
            Next
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Get started'}
          </button>
        )}
      </div>
    </div>
  );
}
