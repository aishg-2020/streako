import Link from 'next/link';
import { Button } from 'antd';
import { EmptyState } from '@/components/ui/EmptyState';

export default function PostNotFound() {
  return (
    <EmptyState
      title="Post not found"
      description="It may have been deleted, or it belongs to another account."
      action={
        <Link href="/posts">
          <Button type="primary">Back to all posts</Button>
        </Link>
      }
    />
  );
}
