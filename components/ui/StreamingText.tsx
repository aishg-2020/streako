'use client';

import { useEffect, useRef } from 'react';
import { Typography } from 'antd';

export function StreamingText({ text }: { text: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight;
    }
  }, [text]);

  return (
    <Typography.Paragraph ref={ref} style={{ whiteSpace: 'pre-wrap', marginBottom: 0 }}>
      {text}
      {text && <span aria-hidden className="streaming-caret" />}
    </Typography.Paragraph>
  );
}
