'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Popconfirm, Space, Typography } from 'antd';
import { convertIdeaToContent, deleteIdea, setIdeaStatus, type ActionResult } from '@/server/actions/ideas';

type Kind = 'convert' | 'reject' | 'restore' | 'delete';

/**
 * Status actions for a saved idea.
 * - SAVED     → Convert to content, Reject
 * - REJECTED  → Restore (and Delete on the detail page)
 * - CONVERTED → no actions (the idea is linked to its content item)
 */
export function IdeaActions({
  ideaId,
  status,
  size = 'sm',
  allowDelete = false,
}: {
  ideaId: string;
  status: string;
  size?: 'sm' | 'md';
  allowDelete?: boolean;
}) {
  const router = useRouter();
  const [kind, setKind] = useState<Kind | null>(null);
  const [error, setError] = useState<string | null>(null);
  // `isPending` stays true until the revalidated page has been rendered, so buttons
  // don't flash back to their idle state before the new status arrives.
  const [isPending, startTransition] = useTransition();

  function run(next: Kind, action: () => Promise<ActionResult<unknown>>, onSuccess?: () => void) {
    setError(null);
    setKind(next);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onSuccess?.();
    });
  }

  const pending = isPending ? kind : null;
  const btnSize = size === 'sm' ? 'small' : 'middle';
  const busy = isPending;

  if (status === 'CONVERTED') return null;

  return (
    <Space orientation="vertical" size={4}>
      <Space wrap>
        {status === 'SAVED' && (
          <>
            <Button
              type="primary"
              size={btnSize}
              disabled={busy}
              loading={pending === 'convert'}
              onClick={() => run('convert', () => convertIdeaToContent(ideaId))}
            >
              {pending === 'convert' ? 'Converting…' : 'Convert to content'}
            </Button>
            <Button size={btnSize} disabled={busy} loading={pending === 'reject'} onClick={() => run('reject', () => setIdeaStatus(ideaId, 'REJECTED'))}>
              {pending === 'reject' ? 'Rejecting…' : 'Reject'}
            </Button>
          </>
        )}
        {status === 'REJECTED' && (
          <Button size={btnSize} disabled={busy} loading={pending === 'restore'} onClick={() => run('restore', () => setIdeaStatus(ideaId, 'SAVED'))}>
            {pending === 'restore' ? 'Restoring…' : 'Restore'}
          </Button>
        )}
        {allowDelete && status === 'REJECTED' && (
          <Popconfirm
            title="Delete this idea permanently?"
            description="This cannot be undone."
            okText="Delete"
            okButtonProps={{ danger: true }}
            onConfirm={() => run('delete', () => deleteIdea(ideaId), () => router.push('/ideas'))}
          >
            <Button danger size={btnSize} disabled={busy} loading={pending === 'delete'}>
              {pending === 'delete' ? 'Deleting…' : 'Delete permanently'}
            </Button>
          </Popconfirm>
        )}
      </Space>
      {error && (
        <Typography.Text type="danger" role="alert" style={{ fontSize: 12 }}>
          {error}
        </Typography.Text>
      )}
    </Space>
  );
}
