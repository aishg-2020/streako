'use client';

import { useEffect, useRef, useState } from 'react';
import type { CreatorProfile } from '@prisma/client';
import { createIdea } from '@/server/actions/ideas';
import { GeneratedIdeaSchema, IDEATE_MAX_COUNT } from '@/lib/ideas/schema';
import { streamIdeas, type PartialIdea } from '@/lib/ideas/stream';
import { Alert, Button, Card, Flex, Input, Skeleton, Space, Typography } from 'antd';
import { StopOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { GeneratedIdeaCard, type SlotStatus } from './GeneratedIdeaCard';

type Slot = {
  key: string;
  idea: PartialIdea;
  status: SlotStatus;
  /** Set once the user acts on a slot, so later batch-stream updates never overwrite it. */
  locked: boolean;
  savedId?: string;
  error?: string;
};

type BatchState = 'idle' | 'streaming' | 'done';

function isComplete(idea: PartialIdea) {
  return GeneratedIdeaSchema.safeParse(idea).success;
}

function isAbort(error: unknown) {
  return error instanceof DOMException && error.name === 'AbortError';
}

function errorMessage(error: unknown) {
  return error instanceof Error && error.message ? error.message : 'Something went wrong. Please try again.';
}

export function AIIdeatePanel({ profile }: { profile: CreatorProfile | null }) {
  const [topic, setTopic] = useState('');
  const [slots, setSlots] = useState<Slot[]>([]);
  const [batch, setBatch] = useState<BatchState>('idle');
  const [batchError, setBatchError] = useState<string | null>(null);
  const [streamedCount, setStreamedCount] = useState(0);

  const batchId = useRef(0);
  const batchTopic = useRef('');
  const batchController = useRef<AbortController | null>(null);
  const slotControllers = useRef(new Map<string, AbortController>());
  const dismissed = useRef(new Set<string>());
  /** Every title shown this session — sent as `exclude` so regenerations are always new. */
  const seenTitles = useRef(new Set<string>());

  useEffect(() => {
    const controllers = slotControllers.current;
    return () => {
      batchController.current?.abort();
      controllers.forEach((c) => c.abort());
    };
  }, []);

  const disabled = !profile;
  const streamingCount = slots.filter((s) => s.status === 'streaming').length;

  function patchSlot(key: string, patch: Partial<Slot>) {
    setSlots((prev) => prev.map((s) => (s.key === key ? { ...s, ...patch } : s)));
  }

  /** Merge the latest streamed batch into the slot list without clobbering slots the user acted on. */
  function applyBatch(id: number, ideas: PartialIdea[], final: boolean) {
    if (batchId.current !== id) return;
    setSlots((prev) => {
      const existing = new Map(prev.map((s) => [s.key, s]));
      const next: Slot[] = [];
      ideas.forEach((idea, i) => {
        const key = `${id}:${i}`;
        if (dismissed.current.has(key)) return;
        const current = existing.get(key);
        if (current?.locked) {
          next.push(current);
          return;
        }
        // An idea is finished once the stream has moved on to the next one (or ended).
        const finished = final || i < ideas.length - 1;
        if (final && !isComplete(idea)) return; // drop an idea cut off by Stop / an error
        next.push({ key, idea, status: finished && isComplete(idea) ? 'ready' : 'streaming', locked: false });
      });
      return next;
    });
  }

  async function generate(e?: React.FormEvent) {
    e?.preventDefault();
    if (disabled) return;

    batchController.current?.abort();
    slotControllers.current.forEach((c) => c.abort());
    slotControllers.current.clear();
    dismissed.current.clear();

    const id = ++batchId.current;
    const controller = new AbortController();
    batchController.current = controller;
    batchTopic.current = topic.trim();
    let latest: PartialIdea[] = [];

    setSlots([]);
    setStreamedCount(0);
    setBatchError(null);
    setBatch('streaming');

    try {
      const ideas = await streamIdeas(
        { topic: batchTopic.current || undefined, count: IDEATE_MAX_COUNT, exclude: [...seenTitles.current] },
        {
          signal: controller.signal,
          onPartial: (partial) => {
            latest = partial;
            if (batchId.current === id) setStreamedCount(partial.length);
            applyBatch(id, partial, false);
          },
        }
      );
      ideas.forEach((idea) => seenTitles.current.add(idea.title));
      applyBatch(id, ideas, true);
    } catch (error) {
      if (batchId.current !== id) return; // superseded by a newer batch
      // Keep whatever finished before the stop/error; drop the partial one.
      latest.forEach((idea) => isComplete(idea) && idea.title && seenTitles.current.add(idea.title));
      applyBatch(id, latest, true);
      if (!isAbort(error)) setBatchError(errorMessage(error));
    } finally {
      if (batchId.current === id) {
        setBatch('done');
        batchController.current = null;
      }
    }
  }

  function stop(e: React.MouseEvent) {
    // Aborting re-renders this slot as the submit button; without preventDefault the
    // browser's default click action could then submit the form and start a new batch.
    e.preventDefault();
    batchController.current?.abort();
  }

  async function save(slot: Slot) {
    const parsed = GeneratedIdeaSchema.safeParse(slot.idea);
    if (!parsed.success) return;

    patchSlot(slot.key, { status: 'saving', locked: true, error: undefined });
    const result = await createIdea(parsed.data);
    patchSlot(slot.key, result.ok ? { status: 'saved', savedId: result.data.id } : { status: 'ready', error: result.error });
  }

  function reject(slot: Slot) {
    dismissed.current.add(slot.key);
    slotControllers.current.get(slot.key)?.abort();
    setSlots((prev) => prev.filter((s) => s.key !== slot.key));
  }

  async function regenerate(slot: Slot) {
    const previous = slot.idea;
    const controller = new AbortController();
    slotControllers.current.get(slot.key)?.abort();
    slotControllers.current.set(slot.key, controller);

    patchSlot(slot.key, { status: 'regenerating', locked: true, idea: {}, error: undefined });

    try {
      const exclude = [...seenTitles.current, ...slots.map((s) => s.idea.title ?? '').filter(Boolean)];
      const [idea] = await streamIdeas(
        { topic: batchTopic.current || undefined, count: 1, exclude: Array.from(new Set(exclude)) },
        {
          signal: controller.signal,
          onPartial: (partial) => patchSlot(slot.key, { idea: partial[0] ?? {} }),
        }
      );
      if (!idea) throw new Error('The AI returned no idea. Please try again.');
      seenTitles.current.add(idea.title);
      patchSlot(slot.key, { idea, status: 'ready' });
    } catch (error) {
      if (isAbort(error)) return;
      patchSlot(slot.key, { idea: previous, status: 'ready', error: `Couldn’t regenerate: ${errorMessage(error)}` });
    } finally {
      if (slotControllers.current.get(slot.key) === controller) slotControllers.current.delete(slot.key);
    }
  }

  const streaming = batch === 'streaming';
  const waitingForFirstToken = streaming && streamedCount === 0;

  return (
    <Card
      aria-labelledby="ai-ideate-heading"
      title={
        <Space size={8}>
          <ThunderboltOutlined style={{ color: 'var(--ant-color-primary)' }} />
          <span id="ai-ideate-heading">AI Idea Generator</span>
        </Space>
      }
      styles={{ body: { display: 'flex', flexDirection: 'column', gap: 16 } }}
    >
      {profile ? (
        <Typography.Text type="secondary" style={{ fontSize: 13 }}>
          Tailored to your {profile.niche} niche. Save the ones you like, reject or regenerate the rest.
        </Typography.Text>
      ) : (
        <Typography.Text type="secondary" style={{ fontSize: 13 }}>Complete your profile to unlock AI ideas.</Typography.Text>
      )}

      <form onSubmit={generate}>
        <Flex gap={8} wrap>
          <label htmlFor="ai-ideate-topic" className="sr-only">
            Topic (optional)
          </label>
          <div style={{ flexGrow: 1, flexBasis: 160 }}>
            <Input
              id="ai-ideate-topic"
              placeholder="Optional topic…"
              value={topic}
              maxLength={200}
              onChange={(e) => setTopic(e.target.value)}
              disabled={disabled}
            />
          </div>
          {streaming ? (
            <Button key="stop" icon={<StopOutlined />} onClick={stop}>
              Stop
            </Button>
          ) : (
            <Button key="generate" type="primary" htmlType="submit" disabled={disabled}>
              {slots.length > 0 ? 'Generate new' : 'Generate'}
            </Button>
          )}
        </Flex>
      </form>

      <p className="sr-only" role="status" aria-live="polite">
        {streaming ? 'Generating ideas…' : batch === 'done' ? `${slots.length} ideas ready` : ''}
      </p>

      {streaming && (
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          <span
            aria-hidden
            style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 999, background: 'var(--ant-color-primary)', marginInlineEnd: 8 }}
            className="streaming-dot"
          />
          {waitingForFirstToken ? 'Thinking…' : `Writing idea ${streamedCount} of ${IDEATE_MAX_COUNT}…`}
        </Typography.Text>
      )}

      {batchError && <Alert type="error" showIcon role="alert" title={batchError} />}

      {(slots.length > 0 || waitingForFirstToken) && (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 12 }} aria-busy={streaming || streamingCount > 0}>
          {slots.map((slot) => (
            <GeneratedIdeaCard
              key={slot.key}
              idea={slot.idea}
              status={slot.status}
              savedId={slot.savedId}
              error={slot.error}
              onSave={() => save(slot)}
              onReject={() => reject(slot)}
              onRegenerate={() => regenerate(slot)}
            />
          ))}
          {waitingForFirstToken && (
            <li style={{ listStyle: 'none' }}>
              <Card size="small">
                <Skeleton active paragraph={{ rows: 2 }} title={{ width: '70%' }} />
              </Card>
            </li>
          )}
        </ul>
      )}

      {batch === 'done' && slots.length === 0 && !batchError && (
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>No ideas left here. Generate a new batch for more.</Typography.Text>
      )}
    </Card>
  );
}
