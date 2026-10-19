import Link from 'next/link';
import { Button } from 'antd';
import { EmptyState } from '@/components/ui/EmptyState';

export default function ScriptNotFound() {
  return (
    <EmptyState
      title="Script not found"
      description="It may have been deleted, or it belongs to another account."
      action={
        <Link href="/content">
          <Button type="primary">Back to the content pipeline</Button>
        </Link>
      }
    />
  );
}
