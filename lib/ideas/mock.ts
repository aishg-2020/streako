// Mock AI ideation used when MOCK_AI=true.
//
// Emits the same wire format as the real route (`streamObject(...).toTextStreamResponse()`):
// a `text/plain` stream of raw JSON text deltas that together form `{ "ideas": [...] }`.
// The client parses it incrementally, so mock mode exercises the exact same
// token-by-token rendering path as production.

import type { GeneratedIdea } from './schema';

const MOCK_IDEA_POOL: GeneratedIdea[] = [
  {
    title: '5 Money Mistakes I Made in My 20s (And How to Avoid Them)',
    description: 'Personal story-driven video covering common personal finance pitfalls with actionable alternatives.',
    format: 'SHORT_VIDEO',
    platform: 'YOUTUBE',
    hooks: ['I lost $10k making this mistake...', 'Nobody talks about this financial trap'],
  },
  {
    title: 'The 50/30/20 Budget Rule — Does It Actually Work?',
    description: 'Data-backed breakdown of the popular budgeting rule with real examples for different income levels.',
    format: 'CAROUSEL',
    platform: 'INSTAGRAM',
    hooks: ['Swipe to see if this rule works for YOUR income', 'This changed how I think about budgeting'],
  },
  {
    title: 'Index Funds vs ETFs: What No One Tells Beginners',
    description: 'Clear explainer cutting through jargon, ideal for first-time investors aged 22–35.',
    format: 'SHORT_VIDEO',
    platform: 'TIKTOK',
    hooks: ["Your financial advisor doesn't want you to know this", 'I wish someone told me this at 22'],
  },
  {
    title: 'How I Saved $20k on a $50k Salary in 12 Months',
    description: 'Month-by-month breakdown of a real savings journey with spreadsheet template.',
    format: 'LONG_VIDEO',
    platform: 'YOUTUBE',
    hooks: ['Month 1 was the hardest...', 'The exact system I used (free template below)'],
  },
  {
    title: 'Emergency Fund Myths That Are Keeping You Broke',
    description: 'Challenges conventional wisdom about emergency fund size and placement with evidence-based advice.',
    format: 'STATIC_POST',
    platform: 'LINKEDIN',
    hooks: ["3 months? Wrong. Here's the real number", 'Stop keeping your emergency fund here'],
  },
  {
    title: 'I Tracked Every Dollar for 30 Days — Here’s What Shocked Me',
    description: 'A spending audit challenge revealing hidden leaks, with a simple tracking method viewers can copy.',
    format: 'SHORT_VIDEO',
    platform: 'INSTAGRAM',
    hooks: ['Day 4 is where it got ugly', 'I was spending $340/month on things I forgot about'],
  },
  {
    title: 'Roth vs Traditional: The 60-Second Decision Guide',
    description: 'A quick decision tree that helps young professionals pick the right retirement account for their tax bracket.',
    format: 'CAROUSEL',
    platform: 'LINKEDIN',
    hooks: ['Answer 3 questions and you’ll know which one to pick', 'Most people choose this one for the wrong reason'],
  },
  {
    title: 'Reacting to My Followers’ Budgets (Brutally Honest)',
    description: 'Review real, anonymised budgets submitted by the audience and suggest concrete fixes for each one.',
    format: 'LONG_VIDEO',
    platform: 'YOUTUBE',
    hooks: ['This budget made me pause the video', 'You sent me your budgets. Let’s talk.'],
  },
  {
    title: 'The Lifestyle Creep Checklist',
    description: 'A save-worthy checklist of the subtle upgrades that quietly eat raises, with a rule for each one.',
    format: 'STATIC_POST',
    platform: 'INSTAGRAM',
    hooks: ['Got a raise and still broke? Read this', 'Save this before your next pay bump'],
  },
  {
    title: 'What $1,000 Invested Monthly Looks Like After 10 Years',
    description: 'Visual compound-growth walkthrough comparing conservative, moderate and aggressive portfolios.',
    format: 'SHORT_VIDEO',
    platform: 'TIKTOK',
    hooks: ['The number at year 10 surprised even me', 'Time in the market, visualised'],
  },
  {
    title: 'Negotiating Your First Raise: Scripts That Worked',
    description: 'Word-for-word negotiation scripts from real conversations, plus the prep that made them land.',
    format: 'BLOG',
    platform: 'LINKEDIN',
    hooks: ['I asked for 8% and got 15%', 'Steal these exact words for your next review'],
  },
  {
    title: 'Money Date Night: How Couples Should Talk Finances',
    description: 'A conversation framework for partners to align on goals, debts and spending without fighting.',
    format: 'PODCAST',
    platform: 'YOUTUBE',
    hooks: ['The money talk most couples avoid', 'We do this every month and never fight about money'],
  },
];

function normalizeTitle(title: string) {
  return title.trim().toLowerCase();
}

/**
 * Pick `count` ideas from the pool, skipping excluded titles so that
 * "regenerate" always yields something different. Falls back to the full pool
 * once everything has been excluded, so the mock never returns an empty list.
 */
export function pickMockIdeas(count: number, exclude: string[] = []): GeneratedIdea[] {
  const excluded = new Set(exclude.map(normalizeTitle));
  const fresh = MOCK_IDEA_POOL.filter((idea) => !excluded.has(normalizeTitle(idea.title)));
  const source = fresh.length >= count ? fresh : [...fresh, ...MOCK_IDEA_POOL.filter((i) => !fresh.includes(i))];
  return source.slice(0, count);
}

const FIRST_TOKEN_DELAY_MS = 350;
const CHUNK_DELAY_MS = 12;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Stream `{ ideas }` as JSON text in small, irregular chunks to simulate LLM token output. */
export function mockIdeasStreamResponse(ideas: GeneratedIdea[], signal?: AbortSignal): Response {
  // Split by code point so a chunk boundary never lands inside a surrogate pair.
  const chars = Array.from(JSON.stringify({ ideas }));
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
