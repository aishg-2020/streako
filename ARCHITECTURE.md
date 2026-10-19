# Creator OS — Architecture & Project Status

## What Is This?

Creator OS is a full-stack AI-powered creator operating system. It helps content creators plan, create, publish, and review their content through five core modules: **Plan**, **Create**, **Publish**, **Learn**, and **Consistency**. An AI layer (Claude) generates content ideas, gives script feedback, and produces a weekly performance review.

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 16 (App Router) | Full-stack in one repo; Server Components; file-based routing |
| Language | TypeScript (strict) | Catches schema/API mismatches early |
| Styling | Tailwind CSS | Utility-first; easy dark mode |
| Auth | Clerk | Handles email, OAuth, sessions, webhooks |
| Database | PostgreSQL via Supabase | Managed hosting; row-level security |
| ORM | Prisma v5 | Type-safe queries; migrations |
| AI | Vercel AI SDK v7 + Anthropic Claude | Streaming; provider-agnostic; structured output via `generateObject` |
| State | Zustand + TanStack Query | Zustand for UI state; TanStack Query for server-state cache |
| Background jobs | pg-boss | Postgres-backed job queue; no extra infra |
| Email | Resend | Simple API; React Email templates |
| File storage | Supabase Storage | Same provider as DB; signed URLs |
| Deployment | Vercel | Zero-config for Next.js; preview deployments per PR |
| Analytics | PostHog | Event tracking; funnels; session replay |

---

## Project Structure

```
streako/
├── app/
│   ├── (auth)/                        # Sign-in, sign-up (Clerk)
│   ├── (app)/                         # Authenticated shell
│   │   ├── layout.tsx                 # AppShell + auth guard
│   │   ├── dashboard/page.tsx
│   │   ├── onboarding/page.tsx
│   │   ├── ideas/ [page + [id]]
│   │   ├── content/ [page + [id]]
│   │   ├── scripts/[id]/page.tsx
│   │   ├── posts/ [page + [id]]
│   │   ├── goals/page.tsx
│   │   └── review/page.tsx
│   └── api/
│       ├── webhooks/clerk/route.ts    # Clerk → DB user sync
│       ├── ai/ideate/route.ts         # Stream AI content ideas
│       ├── ai/script-feedback/route.ts
│       ├── ai/weekly-review/route.ts  # Enqueue pg-boss job
│       └── jobs/route.ts              # Internal job worker endpoint
├── components/
│   ├── ui/                            # StatusBadge, EmptyState, StreamingText
│   ├── layout/                        # AppShell (sidebar + nav)
│   ├── onboarding/                    # OnboardingForm (5-step wizard)
│   ├── ideas/                         # IdeaGrid, IdeaCard, AIIdeatePanel
│   ├── content/                       # ContentBoard
│   ├── scripts/                       # ScriptEditor + AI feedback panel
│   ├── posts/                         # PostList, MetricsForm
│   ├── goals/                         # GoalSetter, StreakTracker, ChallengeList
│   └── review/                        # WeeklyReviewPanel
├── lib/
│   ├── db.ts                          # Prisma client singleton
│   ├── ai.ts                          # Vercel AI SDK + Anthropic client
│   ├── auth-server.ts                 # Auth wrapper (real Clerk or mock)
│   ├── jobs.ts                        # pg-boss setup
│   ├── posthog.ts                     # PostHog client
│   ├── utils.ts                       # cn(), formatDate(), getWeekStart()
│   └── prompts/                       # One file per AI operation
│       ├── ideate.ts
│       ├── scriptFeedback.ts
│       └── weeklyReview.ts
├── server/
│   └── actions/                       # Next.js Server Actions (all mutations)
│       ├── profile.ts
│       ├── ideas.ts
│       ├── content.ts
│       ├── scripts.ts
│       ├── posts.ts
│       └── goals.ts
├── prisma/
│   ├── schema.prisma                  # Production schema (PostgreSQL)
│   └── schema.dev.prisma              # Dev schema (SQLite, arrays as JSON strings)
├── scripts/
│   └── dev-setup.mjs                  # One-command local dev bootstrap
├── types/
│   └── schema.ts                      # Enum types (works with both PG + SQLite clients)
├── .env.local.example                 # Template for production keys
└── .env.local.dev                     # Template for mock/dev mode (no real keys)
```

---

## Database Schema

Twelve models across six domains:

```
User ──────────────── CreatorProfile      (1:1)
User ──────────────── Idea[]              (1:N)
Idea ──────────────── ContentItem         (1:1, optional)
ContentItem ────────── Script[]           (1:N, versioned)
ContentItem ────────── Post               (1:1, optional)
Post ───────────────── PostMetric[]       (1:N, time-series snapshots)
User ──────────────── Goal[]              (1:N)
User ──────────────── Streak              (1:1)
User ──────────────── ChallengeLog[]      (1:N)
User ──────────────── WeeklyReview[]      (1:N)
```

Key enums: `Platform`, `ContentFormat`, `ContentStatus`, `IdeaStatus`, `ExperienceLevel`, `GoalPeriod`

---

## AI Layer

All AI calls go through `lib/ai.ts` (Vercel AI SDK + Anthropic). Three operations:

| Operation | SDK fn | Output | Trigger |
|---|---|---|---|
| `generateIdeas` | `streamObject` | `Idea[]` (Zod schema) | POST `/api/ai/ideate` |
| `generateScriptFeedback` | `streamObject` | `ScriptFeedback` (Zod schema) | POST `/api/ai/script-feedback` |
| `generateWeeklyReview` | `generateObject` | `WeeklyReview` (Zod schema) | pg-boss job via `/api/ai/weekly-review` |

Every prompt receives a `creatorContext` block assembled from `CreatorProfile` (niche, tone, goal, platforms). Prompts live in `lib/prompts/` so they can be iterated independently.

---

## Auth Flow

```
User signs up via Clerk
  → Clerk fires webhook to /api/webhooks/clerk
  → User row created in DB
  → User completes onboarding (/onboarding)
  → CreatorProfile row created
  → Redirected to /dashboard
```

In **mock mode** (`MOCK_AUTH=true`), `lib/auth-server.ts` returns a hardcoded `clerkId: mock_clerk_id`. The seeded demo user bypasses all of this.

---

## Mock / Local Dev Mode

Run the entire app without any paid/external accounts.

| Flag | Effect |
|---|---|
| `MOCK_AUTH=true` | Clerk is never loaded. All requests are treated as `demo@creator-os.dev`. |
| `MOCK_AI=true` | AI routes return static realistic data instantly (no Anthropic call). |
| `DEV_DATABASE_URL` | Points to a local SQLite file (`prisma/dev.db`). |

**Setup (one-time):**
```bash
cp .env.local.dev .env.local
npm run dev:setup   # generates SQLite client, pushes schema, seeds demo user
npm run dev
```

The dev schema (`prisma/schema.dev.prisma`) uses SQLite with array fields stored as JSON strings. The `types/schema.ts` file defines enum types that work with both the PostgreSQL and SQLite generated clients.

---

## What Is Built (Phase 1 — Foundation ✅)

- [x] Next.js 16 App Router project with TypeScript strict mode
- [x] Full directory structure for all 5 modules
- [x] Prisma v5 schema — all 12 models + enums
- [x] Clerk middleware protecting all `(app)` routes
- [x] Sign-in / sign-up pages
- [x] Clerk webhook → User DB sync
- [x] `lib/auth-server.ts` — real Clerk or mock, behind one import
- [x] `AppShell` — sidebar navigation with mock badge
- [x] All 8 app pages scaffolded (dashboard, onboarding, ideas, content, scripts, posts, goals, review)
- [x] All 6 server action files (profile, ideas, content, scripts, posts, goals)
- [x] 3 AI API routes (ideate, script-feedback, weekly-review) with mock responses
- [x] Internal jobs route for pg-boss worker
- [x] Prompt builders in `lib/prompts/`
- [x] Component stubs wired to real server actions for every page
- [x] `scripts/dev-setup.mjs` — one-command SQLite bootstrap
- [x] TypeScript passes clean (`tsc --noEmit`)

---

## What Remains (Phases 2–8)

### Phase 2 — Onboarding & Profile
- [ ] Validate and polish the 5-step onboarding form
- [ ] Show profile settings page (edit niche, tone, platforms)
- [ ] Redirect to `/dashboard` after completion; skip if profile exists
- [ ] **Mock-compatible: YES**

### Phase 3 — Ideas Module
- [ ] Manual idea creation form
- [ ] Streaming ideation UI (loading skeleton, token-by-token rendering)
- [ ] Save / reject / regenerate actions
- [ ] Convert idea → content item button
- [ ] **Mock-compatible: YES** (mock returns 5 static ideas instantly)

### Phase 4 — Content Pipeline
- [ ] Calendar view toggle (currently list only)
- [ ] Status stepper UI (Idea → Published, 6 steps)
- [ ] Content detail: notes editor, status change buttons
- [ ] Script editor: rich text, version history list
- [ ] AI feedback panel alongside the editor (streaming)
- [ ] **Mock-compatible: YES** (mock returns static script feedback)

### Phase 5 — Posts & Metrics
- [ ] "Mark as Published" flow → creates `Post` row from a `ContentItem`
- [ ] Add post form (manual, for content created outside the app)
- [ ] Metric history chart (views/likes over time)
- [ ] Dashboard performance snapshot widget
- [ ] **Mock-compatible: YES**

### Phase 6 — Goals & Consistency
- [ ] `updateStreak` called after each publish or script save
- [ ] Activity heatmap (GitHub-style, last 52 weeks)
- [ ] Daily challenge suggestions (AI-generated or curated list)
- [ ] Goal progress bars on the dashboard
- [ ] **Mock-compatible: YES**

### Phase 7 — Weekly AI Review
- [ ] pg-boss worker process setup (`lib/jobs.ts` + worker file)
- [ ] Vercel Cron trigger every Monday morning
- [ ] "Accept recommendation" → creates content item(s) from `suggestedPlan`
- [ ] Review history (list of past reviews)
- [ ] **Mock-compatible: YES** (mock writes a static review to SQLite on button click)

### Phase 8 — Dashboard & Polish
- [ ] Populate all 6 dashboard sections with live DB data
- [ ] PostHog event tracking (idea saved, content published, review generated)
- [ ] Error boundaries on every AI route
- [ ] Loading skeletons on all async pages
- [ ] Mobile-responsive layout audit
- [ ] Seed script for demo data (for pilot onboarding)
- [ ] **Mock-compatible: MOSTLY** — PostHog needs a real key to record events

---

## What Needs Real Keys

| Capability | Key Needed | Phase |
|---|---|---|
| Real user login (email, Google OAuth) | `CLERK_*` | 1 |
| Production PostgreSQL | `DATABASE_URL` (Supabase) | 1 |
| Live AI responses (actual Claude output) | `ANTHROPIC_API_KEY` | 3–7 |
| Email notifications | `RESEND_API_KEY` | 8 |
| Product analytics | `NEXT_PUBLIC_POSTHOG_KEY` | 8 |

Everything else — all UI, all data flows, all AI feature surfaces — can be built and tested end-to-end using mock mode alone.

---

## Environment Variables

Copy `.env.local.dev` for local development (no real keys). Copy `.env.local.example` for production and fill in all values.

| Variable | Required for prod | Required for mock |
|---|---|---|
| `DATABASE_URL` | ✅ | ❌ |
| `DIRECT_URL` | ✅ | ❌ |
| `DEV_DATABASE_URL` | ❌ | ✅ |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | ✅ | placeholder |
| `CLERK_SECRET_KEY` | ✅ | placeholder |
| `CLERK_WEBHOOK_SECRET` | ✅ | ❌ |
| `ANTHROPIC_API_KEY` | ✅ | placeholder |
| `MOCK_AUTH` | ❌ | `true` |
| `MOCK_AI` | ❌ | `true` |
| `NEXT_PUBLIC_POSTHOG_KEY` | ✅ | ❌ |
| `RESEND_API_KEY` | ✅ | ❌ |
| `JOBS_SECRET` | ✅ | ❌ |
