'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createPostFromContent } from '@/server/actions/posts';
import { Button, Space, Typography } from 'antd';
import { SendOutlined } from '@ant-design/icons';

/** Creates the Post for a published content item and opens it. */
export function MarkPublishedButton({ contentItemId }: { contentItemId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function publish() {
    setError(null);
    startTransition(async () => {
      const result = await createPostFromContent(contentItemId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(`/posts/${result.data.postId}`);
    });
  }

  return (
    <Space orientation="vertical" size={4}>
      <Button type="primary" icon={<SendOutlined />} loading={isPending} onClick={publish}>
        {isPending ? 'Recording…' : 'Mark as published'}
      </Button>
      {error && (
        <Typography.Text type="danger" role="alert" style={{ fontSize: 12 }}>
          {error}
        </Typography.Text>
      )}
    </Space>
  );
}
