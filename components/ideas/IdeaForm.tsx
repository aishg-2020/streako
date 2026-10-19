'use client';

import Link from 'next/link';
import { useId, useState, useTransition } from 'react';
import { Button, Card, Flex, Form, Input, Row, Col, Select, Space, Typography } from 'antd';
import { CloseOutlined, PlusOutlined } from '@ant-design/icons';
import { createIdea } from '@/server/actions/ideas';
import {
  CONTENT_FORMATS,
  FORMAT_LABELS,
  IDEA_LIMITS,
  IdeaInputSchema,
  PLATFORMS,
  PLATFORM_LABELS,
} from '@/lib/ideas/schema';
import type { ContentFormat, Platform } from '@/types/schema';

type FieldErrors = Partial<Record<'title' | 'description' | 'platform' | 'format' | 'hooks', string>>;

type FormState = {
  title: string;
  description: string;
  platform: Platform | '';
  format: ContentFormat | '';
  hooks: string[];
};

function emptyForm(defaultPlatform?: Platform): FormState {
  return { title: '', description: '', platform: defaultPlatform ?? '', format: '', hooks: [''] };
}

/** Manual idea creation. Collapsed to a button until opened. */
export function IdeaForm({ defaultPlatform }: { defaultPlatform?: Platform }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(() => emptyForm(defaultPlatform));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ id: string; title: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const id = useId();

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function updateHook(index: number, value: string) {
    update('hooks', form.hooks.map((h, i) => (i === index ? value : h)));
  }

  function close() {
    setOpen(false);
    setForm(emptyForm(defaultPlatform));
    setErrors({});
    setFormError(null);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setCreated(null);

    const parsed = IdeaInputSchema.safeParse(form);
    if (!parsed.success) {
      const next: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof FieldErrors;
        next[key] ??= issue.message;
      }
      setErrors(next);
      return;
    }

    startTransition(async () => {
      const result = await createIdea(parsed.data);
      if (!result.ok) {
        setFormError(result.error);
        return;
      }
      setCreated({ id: result.data.id, title: parsed.data.title });
      setForm(emptyForm(defaultPlatform));
      setErrors({});
      setOpen(false);
    });
  }

  if (!open) {
    return (
      <Flex align="center" gap={12} wrap>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setOpen(true); setCreated(null); }}>
          New idea
        </Button>
        {created && (
          <Typography.Text type="success" role="status">
            Saved “{created.title}”.{' '}
            <Link href={`/ideas/${created.id}`} style={{ textDecoration: 'underline' }}>
              View idea
            </Link>
          </Typography.Text>
        )}
      </Flex>
    );
  }

  const hookCount = form.hooks.length;

  return (
    <Card
      title={<span id={`${id}-heading`}>New idea</span>}
      extra={
        <Button type="text" size="small" onClick={close}>
          Cancel
        </Button>
      }
    >
      <form onSubmit={submit} noValidate aria-labelledby={`${id}-heading`}>
        <Form layout="vertical" component="div">
          <Form.Item
            label={<label htmlFor={`${id}-title`}>Title</label>}
            validateStatus={errors.title ? 'error' : undefined}
            help={errors.title}
          >
            <Input
              id={`${id}-title`}
              value={form.title}
              maxLength={IDEA_LIMITS.title}
              onChange={(e) => update('title', e.target.value)}
              placeholder="e.g. 3 budgeting apps I actually use"
              aria-invalid={!!errors.title}
              autoFocus
            />
          </Form.Item>

          <Form.Item
            label={<label htmlFor={`${id}-description`}>Description</label>}
            validateStatus={errors.description ? 'error' : undefined}
            help={errors.description}
          >
            <Input.TextArea
              id={`${id}-description`}
              rows={4}
              value={form.description}
              maxLength={IDEA_LIMITS.description}
              onChange={(e) => update('description', e.target.value)}
              placeholder="What is the piece about, and why will your audience care?"
              aria-invalid={!!errors.description}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label={<label htmlFor={`${id}-platform`}>Platform</label>}
                validateStatus={errors.platform ? 'error' : undefined}
                help={errors.platform}
              >
                <Select
                  id={`${id}-platform`}
                  value={form.platform || undefined}
                  placeholder="Select a platform"
                  onChange={(value) => update('platform', value as Platform)}
                  options={PLATFORMS.map((p) => ({ value: p, label: PLATFORM_LABELS[p] }))}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label={<label htmlFor={`${id}-format`}>Format</label>}
                validateStatus={errors.format ? 'error' : undefined}
                help={errors.format}
              >
                <Select
                  id={`${id}-format`}
                  value={form.format || undefined}
                  placeholder="Select a format"
                  onChange={(value) => update('format', value as ContentFormat)}
                  options={CONTENT_FORMATS.map((f) => ({ value: f, label: FORMAT_LABELS[f] }))}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label={
              <span>
                Hooks <Typography.Text type="secondary">(optional)</Typography.Text>
              </span>
            }
            validateStatus={errors.hooks ? 'error' : undefined}
            help={errors.hooks}
          >
            <Space orientation="vertical" style={{ width: '100%' }} size={8}>
              {form.hooks.map((hook, i) => (
                <Flex key={i} gap={8}>
                  <Input
                    value={hook}
                    maxLength={IDEA_LIMITS.hook}
                    onChange={(e) => updateHook(i, e.target.value)}
                    placeholder={i === 0 ? 'An opening line that stops the scroll' : 'Another hook'}
                    aria-label={`Hook ${i + 1}`}
                  />
                  {hookCount > 1 && (
                    <Button
                      icon={<CloseOutlined />}
                      onClick={() => update('hooks', form.hooks.filter((_, j) => j !== i))}
                      aria-label={`Remove hook ${i + 1}`}
                    />
                  )}
                </Flex>
              ))}
              {hookCount < IDEA_LIMITS.hooks && (
                <Button type="link" size="small" icon={<PlusOutlined />} onClick={() => update('hooks', [...form.hooks, ''])} style={{ paddingInline: 0 }}>
                  Add hook
                </Button>
              )}
            </Space>
          </Form.Item>

          {formError && (
            <Typography.Paragraph type="danger" role="alert">
              {formError}
            </Typography.Paragraph>
          )}

          <Flex justify="flex-end" gap={8}>
            <Button onClick={close} disabled={pending}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" loading={pending}>
              {pending ? 'Saving…' : 'Save idea'}
            </Button>
          </Flex>
        </Form>
      </form>
    </Card>
  );
}
