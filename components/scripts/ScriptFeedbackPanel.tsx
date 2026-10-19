'use client';

import { useEffect, useRef, useState } from 'react';
import { saveScriptFeedback } from '@/server/actions/scripts';
import type { ScriptFeedback } from '@/lib/scripts/schema';
import { streamScriptFeedback, type PartialFeedback } from '@/lib/scripts/stream';
import { Alert, Button, Card, Flex, Skeleton, Space, Statistic, Typography } from 'antd';
import { RowList } from '@/components/ui/RowList';
import { RobotOutlined, StopOutlined } from '@ant-design/icons';
import { Caret } from '@/components/ui/Caret';

type Status = 'idle' | 'streaming' | 'done' | 'error';

function isAbort(error: unknown) {
  return error instanceof DOMException && error.name === 'AbortError';
}

/** Inline AI feedback: streams the review next to the editor, section by section. */
export function ScriptFeedbackPanel({
  scriptId,
  body,
  savedBody,
  initialFeedback,
}: {
  scriptId: string;
  /** Text currently in the editor (what a new review is generated for). */
  body: string;
  /** The saved body of this version — the best reference for feedback loaded from the DB. */
  savedBody: string;
  initialFeedback: ScriptFeedback | null;
}) {
  const [feedback, setFeedback] = useState<PartialFeedback | null>(initialFeedback);
  const [status, setStatus] = useState<Status>(initialFeedback ? 'done' : 'idle');
  const [error, setError] = useState<string | null>(null);
  /** The script text the current feedback was generated for. */
  const [reviewedBody, setReviewedBody] = useState<string | null>(initialFeedback ? savedBody : null);
  const controller = useRef<AbortController | null>(null);

  useEffect(() => () => controller.current?.abort(), []);

  async function run() {
    controller.current?.abort();
    const ctrl = new AbortController();
    controller.current = ctrl;
    const text = body;

    setFeedback({});
    setError(null);
    setStatus('streaming');
    setReviewedBody(text);

    try {
      const result = await streamScriptFeedback(text, { signal: ctrl.signal, onPartial: setFeedback });
      setFeedback(result);
      setStatus('done');
      // Persist so the review is still there on the next visit. Not fatal if it fails.
      const saved = await saveScriptFeedback(scriptId, result);
      if (!saved.ok) setError(`Feedback shown but not saved: ${saved.error}`);
    } catch (err) {
      if (isAbort(err)) return;
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setStatus('error');
    } finally {
      if (controller.current === ctrl) controller.current = null;
    }
  }

  function stop(e: React.MouseEvent) {
    e.preventDefault();
    controller.current?.abort();
    setStatus(feedback?.overallScore !== undefined ? 'done' : 'idle');
  }

  const streaming = status === 'streaming';
  const empty = !body.trim();
  const stale = status === 'done' && reviewedBody !== null && reviewedBody !== body;
  const hasAny = feedback && Object.values(feedback).some((v) => v !== undefined);

  return (
    <Card
      aria-labelledby="ai-feedback-heading"
      aria-busy={streaming}
      title={
        <Space size={8}>
          <RobotOutlined style={{ color: 'var(--ant-color-primary)' }} />
          <span id="ai-feedback-heading">AI feedback</span>
        </Space>
      }
      extra={
        streaming ? (
          <Button key="stop" size="small" icon={<StopOutlined />} onClick={stop}>
            Stop
          </Button>
        ) : (
          <Button key="run" type="primary" size="small" onClick={run} disabled={empty}>
            {status === 'idle' ? 'Get AI feedback' : 'Get new feedback'}
          </Button>
        )
      }
      styles={{ body: { display: 'flex', flexDirection: 'column', gap: 12 } }}
    >
      <p className="sr-only" role="status" aria-live="polite">
        {streaming ? 'Generating feedback…' : status === 'done' ? 'Feedback ready' : ''}
      </p>

      {empty && status === 'idle' && (
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          Write something in the editor first.
        </Typography.Text>
      )}
      {!empty && status === 'idle' && (
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          Reviews the text currently in the editor — saved or not — and streams the result here.
        </Typography.Text>
      )}

      {streaming && !hasAny && <Skeleton active paragraph={{ rows: 3 }} title={{ width: '30%' }} />}

      {error && <Alert type="error" showIcon role="alert" title={error} />}

      {stale && <Alert type="warning" showIcon title="The script has changed since this feedback was generated." />}

      {feedback && hasAny && (
        <Flex vertical gap={16}>
          {feedback.overallScore !== undefined && (
            <Statistic value={feedback.overallScore} suffix={<Typography.Text type="secondary">/ 10 overall</Typography.Text>} />
          )}

          <FeedbackText label="Hook" text={feedback.hookAnalysis} streaming={streaming && feedback.pacing === undefined} />
          <FeedbackList label="Strengths" items={feedback.strengths} streaming={streaming && feedback.improvements === undefined} />
          <FeedbackList label="Improvements" items={feedback.improvements} streaming={streaming && feedback.hookAnalysis === undefined} />
          <FeedbackText label="Pacing" text={feedback.pacing} streaming={streaming && feedback.suggestions === undefined} />
          <FeedbackList label="Suggestions" items={feedback.suggestions} streaming={streaming && feedback.shotList === undefined} />

          {feedback.shotList && feedback.shotList.length > 0 && (
            <div>
              <SectionLabel>Shot list</SectionLabel>
              <RowList
                size="small"
                items={feedback.shotList}
                rowKey={(_, i) => i}
                renderItem={(shot, i) => (
                  <Space align="start" size={10}>
                      <Typography.Text code>{shot.scene !== undefined ? `#${shot.scene}` : '—'}</Typography.Text>
                      <Typography.Text style={{ fontSize: 13 }}>
                        {shot.description}
                        {shot.type && <Typography.Text type="secondary"> — {shot.type}</Typography.Text>}
                        {streaming && i === feedback.shotList!.length - 1 && <Caret />}
                      </Typography.Text>
                  </Space>
                )}
              />
            </div>
          )}
        </Flex>
      )}
    </Card>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Typography.Text strong style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.4, display: 'block', marginBottom: 4 }}>
      {children}
    </Typography.Text>
  );
}

function FeedbackText({ label, text, streaming }: { label: string; text?: string; streaming: boolean }) {
  if (text === undefined) return null;
  return (
    <div>
      <SectionLabel>{label}</SectionLabel>
      <Typography.Text type="secondary" style={{ fontSize: 13 }}>
        {text}
        {streaming && <Caret />}
      </Typography.Text>
    </div>
  );
}

function FeedbackList({ label, items, streaming }: { label: string; items?: string[]; streaming: boolean }) {
  if (!items) return null;
  return (
    <div>
      <SectionLabel>{label}</SectionLabel>
      <ul style={{ margin: 0, paddingInlineStart: 18, fontSize: 13, lineHeight: 1.6 }}>
        {items.map((item, i) => (
          <li key={i}>
            {item}
            {streaming && i === items.length - 1 && <Caret />}
          </li>
        ))}
      </ul>
    </div>
  );
}
