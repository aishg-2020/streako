'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createScriptDraft } from '@/server/actions/scripts';
import { Button, Space, Typography } from 'antd';
import { EditOutlined, FileTextOutlined } from '@ant-design/icons';

/** Opens the script editor, creating an empty version 1 when the item has no script yet. */
export function ScriptDraftButton({ contentItemId, hasScript }: { contentItemId: string; hasScript: boolean }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function open() {
    setError(null);
    startTransition(async () => {
      const result = await createScriptDraft(contentItemId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(`/scripts/${result.data.scriptId}`);
    });
  }

  return (
    <Space orientation="vertical" size={4}>
      <Button
        type={hasScript ? 'default' : 'primary'}
        icon={hasScript ? <EditOutlined /> : <FileTextOutlined />}
        loading={isPending}
        onClick={open}
      >
        {isPending ? 'Opening…' : hasScript ? 'Open script editor' : 'Create script draft'}
      </Button>
      {error && (
        <Typography.Text type="danger" role="alert" style={{ fontSize: 12 }}>
          {error}
        </Typography.Text>
      )}
    </Space>
  );
}
