'use client';

import { useEffect, useRef } from 'react';

export function StreamingText({ text }: { text: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight;
    }
  }, [text]);

  return (
    <div ref={ref} className="whitespace-pre-wrap text-sm leading-relaxed">
      {text}
      {text && <span className="inline-block w-1 h-4 ml-0.5 bg-current animate-pulse" />}
    </div>
  );
}
