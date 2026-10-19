import Link from 'next/link';
import { Button } from 'antd';
import { EmptyState } from '@/components/ui/EmptyState';

export default function IdeaNotFound() {
  return (
    <EmptyState
      title="Idea not found"
      description="It may have been deleted, or it belongs to another account."
      action={
        <Link href="/ideas">
          <Button type="primary">Back to all ideas</Button>
        </Link>
      }
    />
  );
}
