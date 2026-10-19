'use client';

import { useId, useState, useTransition } from 'react';
import { addMetricSnapshot } from '@/server/actions/posts';
import { METRIC_FIELDS, METRIC_LABELS, MetricSnapshotSchema, type MetricField } from '@/lib/posts/schema';
import { Button, Card, Col, Flex, Form, InputNumber, Row, Typography } from 'antd';

type FormValues = Record<MetricField, string>;
const EMPTY: FormValues = { views: '', likes: '', comments: '', shares: '', saves: '' };

function toInput(values: FormValues) {
  return Object.fromEntries(
    METRIC_FIELDS.map((f) => [f, values[f].trim() === '' ? undefined : Number(values[f])])
  ) as Partial<Record<MetricField, number>>;
}

/** Logs a new metrics snapshot for a post. Each submission adds a row; nothing is overwritten. */
export function MetricsForm({ postId }: { postId: string }) {
  const id = useId();
  const [values, setValues] = useState<FormValues>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<MetricField | 'form', string>>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    const parsed = MetricSnapshotSchema.safeParse(toInput(values));
    if (!parsed.success) {
      const next: typeof errors = {};
      for (const issue of parsed.error.issues) {
        const key = (issue.path[0] as MetricField | undefined) ?? 'form';
        next[key] ??= issue.message;
      }
      setErrors(next);
      return;
    }

    setErrors({});
    startTransition(async () => {
      const result = await addMetricSnapshot(postId, parsed.data);
      if (!result.ok) {
        setErrors({ form: result.error });
        return;
      }
      setValues(EMPTY);
      setMessage('Snapshot logged.');
    });
  }

  return (
    <Card
      aria-labelledby={`${id}-heading`}
      title={<span id={`${id}-heading`}>Log metrics</span>}
      extra={
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          Each entry is kept as a new snapshot.
        </Typography.Text>
      }
    >
      <form onSubmit={submit} noValidate>
        <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 16, fontSize: 13 }}>
          Enter the current totals from the platform.
        </Typography.Text>
        <Form layout="vertical" component="div">
          <Row gutter={[12, 0]}>
            {METRIC_FIELDS.map((f) => (
              <Col key={f} xs={12} sm={8} lg={4}>
                <Form.Item
                  label={<label htmlFor={`${id}-${f}`}>{METRIC_LABELS[f]}</label>}
                  validateStatus={errors[f] ? 'error' : undefined}
                  help={errors[f]}
                >
                  <InputNumber
                    id={`${id}-${f}`}
                    step={1}
                    controls={false}
                    style={{ width: '100%' }}
                    value={values[f] === '' ? null : Number(values[f])}
                    onChange={(value) => {
                      setValues((v) => ({ ...v, [f]: value === null || value === undefined ? '' : String(value) }));
                      setErrors((er) => ({ ...er, [f]: undefined, form: undefined }));
                    }}
                    aria-invalid={!!errors[f]}
                    placeholder="0"
                  />
                </Form.Item>
              </Col>
            ))}
          </Row>
        </Form>
        <Flex align="center" gap={12} wrap>
          <Button type="primary" htmlType="submit" loading={isPending}>
            {isPending ? 'Saving…' : 'Save snapshot'}
          </Button>
          <Typography.Text role="status" aria-live="polite" type={errors.form ? 'danger' : 'success'} style={{ fontSize: 12 }}>
            {errors.form ?? message ?? ''}
          </Typography.Text>
        </Flex>
      </form>
    </Card>
  );
}
