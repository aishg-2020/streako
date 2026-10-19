'use client';

import { useState } from 'react';
import { Button, Card, Flex, Form, Input, InputNumber, Select, Steps, Tag, Typography } from 'antd';
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
    <Card>
      <Steps
        size="small"
        current={step}
        items={STEPS.map((s) => ({ title: s }))}
        responsive={false}
        style={{ marginBottom: 20 }}
      />
      <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
        Step {step + 1} of {STEPS.length}: {STEPS[step]}
      </Typography.Text>

      <Form layout="vertical" component="div">
        {step === 0 && (
          <>
            <Form.Item label="Display Name">
              <Input
                value={form.displayName ?? ''}
                onChange={(e) => update('displayName', e.target.value)}
                placeholder="Your creator name"
              />
            </Form.Item>
            <Form.Item label="Experience Level">
              <Select
                value={form.experienceLevel}
                onChange={(value) => update('experienceLevel', value)}
                options={EXPERIENCE_LEVELS.map((l) => ({ value: l, label: l }))}
              />
            </Form.Item>
          </>
        )}

        {step === 1 && (
          <>
            <Form.Item label="Niche">
              <Input
                value={form.niche ?? ''}
                onChange={(e) => update('niche', e.target.value)}
                placeholder="e.g. Personal Finance, Fitness, Tech"
              />
            </Form.Item>
            <Form.Item label="Target Audience">
              <Input
                value={form.targetAudience ?? ''}
                onChange={(e) => update('targetAudience', e.target.value)}
                placeholder="e.g. Young professionals aged 25-35"
              />
            </Form.Item>
            <Form.Item label="Tone">
              <Input
                value={form.tone ?? ''}
                onChange={(e) => update('tone', e.target.value)}
                placeholder="e.g. Educational, Entertaining, Motivational"
              />
            </Form.Item>
          </>
        )}

        {step === 2 && (
          <Form.Item label="Platforms (select all that apply)">
            <Flex wrap gap={8}>
              {PLATFORMS.map((p) => {
                const selected = form.platforms?.includes(p as never);
                return (
                  <Tag.CheckableTag
                    key={p}
                    checked={!!selected}
                    onChange={() => {
                      const current = form.platforms ?? [];
                      update('platforms', selected ? current.filter((x) => x !== p) : [...current, p]);
                    }}
                    style={{ padding: '4px 14px', fontSize: 14, borderRadius: 999, border: '1px solid var(--ant-color-border)' }}
                  >
                    {p}
                  </Tag.CheckableTag>
                );
              })}
            </Flex>
          </Form.Item>
        )}

        {step === 3 && (
          <>
            <Form.Item label="Target posts per week">
              <InputNumber
                min={1}
                max={30}
                style={{ width: '100%' }}
                value={form.postingFrequency ?? 3}
                onChange={(value) => update('postingFrequency', Number(value))}
              />
            </Form.Item>
            <Form.Item label="Hours available per week for creation">
              <InputNumber
                min={1}
                max={80}
                style={{ width: '100%' }}
                value={form.availableHours ?? 10}
                onChange={(value) => update('availableHours', Number(value))}
              />
            </Form.Item>
          </>
        )}

        {step === 4 && (
          <Form.Item label="Primary Goal">
            <Input.TextArea
              rows={4}
              value={form.primaryGoal ?? ''}
              onChange={(e) => update('primaryGoal', e.target.value)}
              placeholder="e.g. Grow to 10k followers in 6 months and monetise through brand deals"
            />
          </Form.Item>
        )}
      </Form>

      <Flex justify="space-between" style={{ marginTop: 8 }}>
        <Button type="text" onClick={() => setStep((s) => s - 1)} disabled={step === 0} style={{ visibility: step === 0 ? 'hidden' : 'visible' }}>
          Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button type="primary" onClick={() => setStep((s) => s + 1)}>
            Next
          </Button>
        ) : (
          <Button type="primary" onClick={handleSubmit} loading={saving}>
            {saving ? 'Saving...' : 'Get started'}
          </Button>
        )}
      </Flex>
    </Card>
  );
}
