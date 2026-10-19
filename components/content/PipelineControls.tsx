'use client';

import { useState, useTransition } from 'react';
import { Button, Flex, Steps, Typography } from 'antd';
import { ArrowLeftOutlined, ArrowRightOutlined, CheckOutlined } from '@ant-design/icons';
import { updateStatus } from '@/server/actions/content';
import { CONTENT_PIPELINE, CONTENT_STATUS_LABELS, nextStatus, prevStatus, statusIndex } from '@/lib/content/pipeline';

/** Stepper showing the item's position in the pipeline, with buttons to move one stage either way. */
export function PipelineControls({ itemId, status }: { itemId: string; status: string }) {
  const [error, setError] = useState<string | null>(null);
  const [direction, setDirection] = useState<'back' | 'forward' | null>(null);
  // `isPending` stays true until the revalidated page has rendered the new status.
  const [isPending, startTransition] = useTransition();

  const current = statusIndex(status);
  const back = prevStatus(status);
  const forward = nextStatus(status);

  function move(to: string | null, dir: 'back' | 'forward') {
    if (!to) return;
    setError(null);
    setDirection(dir);
    startTransition(async () => {
      const result = await updateStatus(itemId, to as (typeof CONTENT_PIPELINE)[number]);
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <Flex vertical gap={20}>
      <Steps
        size="small"
        current={current}
        responsive={false}
        items={CONTENT_PIPELINE.map((stage, i) => ({
          title: (
            <span aria-current={i === current ? 'step' : undefined}>{CONTENT_STATUS_LABELS[stage]}</span>
          ),
        }))}
        aria-label="Pipeline stages"
      />

      <Flex gap={8} wrap align="center">
        <Button icon={<ArrowLeftOutlined />} disabled={!back || isPending} loading={isPending && direction === 'back'} onClick={() => move(back, 'back')}>
          {isPending && direction === 'back' ? 'Moving…' : back ? `Back to ${CONTENT_STATUS_LABELS[back]}` : 'Start of pipeline'}
        </Button>
        <Button
          type="primary"
          icon={forward ? <ArrowRightOutlined /> : <CheckOutlined />}
          iconPlacement="end"
          disabled={!forward || isPending}
          loading={isPending && direction === 'forward'}
          onClick={() => move(forward, 'forward')}
        >
          {isPending && direction === 'forward' ? 'Moving…' : forward ? `Move to ${CONTENT_STATUS_LABELS[forward]}` : 'Published'}
        </Button>
      </Flex>

      {error && (
        <Typography.Text type="danger" role="alert" style={{ fontSize: 12 }}>
          {error}
        </Typography.Text>
      )}
    </Flex>
  );
}
