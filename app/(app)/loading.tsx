import { Skeleton } from 'antd';

/** Streaming placeholder for every page in the app shell (also gives pages a Suspense boundary). */
export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <Skeleton active title={{ width: 240 }} paragraph={{ rows: 1, width: 320 }} style={{ marginBottom: 24 }} />
      <Skeleton active paragraph={{ rows: 6 }} />
    </div>
  );
}
