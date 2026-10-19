// Mock AI script feedback used when MOCK_AI=true.
// Streams JSON text in small chunks — the same wire format as the real route
// (`streamObject(...).toTextStreamResponse()`), so the UI's token-by-token rendering
// is exercised in mock mode too.

import type { ScriptFeedback } from './schema';

export function buildMockFeedback(scriptBody: string): ScriptFeedback {
  const words = scriptBody.trim().split(/\s+/).filter(Boolean).length;
  const seconds = Math.max(5, Math.round(words / 2.5)); // ~150 wpm spoken
  return {
    overallScore: 7,
    strengths: [
      'Strong opening hook that creates curiosity',
      'Clear and simple language accessible to beginners',
      'Good use of personal story to build trust',
    ],
    improvements: [
      'The middle section loses momentum — tighten the explanation at the 45-second mark',
      'Missing a clear call-to-action at the end',
      'Could use a pattern interrupt around the 30-second mark to re-engage viewers',
    ],
    hookAnalysis:
      'Your hook is effective — it leads with a relatable problem and promises a specific outcome. Consider making the stakes clearer in the first 3 seconds.',
    pacing: `At roughly ${words} words this runs about ${seconds} seconds when spoken. Good overall pace but it slows noticeably in the middle section. Consider cutting the background context and getting to the solution faster.`,
    suggestions: [
      'Add a "here\'s what we\'ll cover" roadmap at the 10-second mark',
      'End with a question to boost comments: "What\'s your biggest money mistake?"',
      'Add on-screen text for the key stat to reinforce retention',
    ],
    shotList: [
      { scene: 1, description: 'Talking head — hook statement to camera', type: 'Medium shot' },
      { scene: 2, description: 'Screen recording of the concept being demonstrated', type: 'Screen capture' },
      { scene: 3, description: 'Back to camera for the main takeaway', type: 'Close-up' },
      { scene: 4, description: 'Text overlay with the key stat', type: 'Graphic insert' },
      { scene: 5, description: 'CTA to camera', type: 'Medium shot' },
    ],
  };
}

const FIRST_TOKEN_DELAY_MS = 350;
const CHUNK_DELAY_MS = 12;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Stream `feedback` as JSON text in small, irregular chunks to simulate LLM token output. */
export function mockFeedbackStreamResponse(feedback: ScriptFeedback, signal?: AbortSignal): Response {
  // Split by code point so a chunk boundary never lands inside a surrogate pair.
  const chars = Array.from(JSON.stringify(feedback));
  const encoder = new TextEncoder();
  let offset = 0;
  let started = false;

  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      if (signal?.aborted) {
        controller.close();
        return;
      }
      await sleep(started ? CHUNK_DELAY_MS : FIRST_TOKEN_DELAY_MS);
      started = true;
      if (offset >= chars.length) {
        controller.close();
        return;
      }
      const size = 2 + Math.floor(Math.random() * 7); // 2–8 chars ≈ one LLM token
      controller.enqueue(encoder.encode(chars.slice(offset, offset + size).join('')));
      offset += size;
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
    },
  });
}
