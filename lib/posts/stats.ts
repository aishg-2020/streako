// Dashboard performance numbers, derived from posts and their metric snapshots.
//
// Metric snapshots are cumulative readings taken over time (e.g. 1000 → 1200 → 1500 views),
// not increments. A post's current total is therefore its NEWEST snapshot, and views across
// posts are the sum of each post's newest snapshot — never the sum of every snapshot row.

import type { PrismaClient } from '@prisma/client';

export type SnapshotViews = { views: number | null; recordedAt: Date };

export type PostForStats = {
  id: string;
  platform: string;
  publishedAt: Date;
  contentItem: { title: string } | null;
  /** Any number of snapshots, in any order. */
  metrics: SnapshotViews[];
};

export type PerformanceStats = {
  totalPosts: number;
  /** Sum of the newest snapshot's views for each post. */
  totalViews: number;
  /** How many posts have at least one snapshot. */
  postsWithMetrics: number;
  /** The most recently published post, or null. */
  latestPost: { id: string; platform: string; publishedAt: Date; title: string | null } | null;
};

/** The newest snapshot of a post, regardless of the order the rows arrive in. */
export function latestSnapshot<T extends { recordedAt: Date }>(metrics: T[]): T | null {
  let latest: T | null = null;
  for (const m of metrics) {
    if (!latest || m.recordedAt.getTime() >= latest.recordedAt.getTime()) latest = m;
  }
  return latest;
}

/** Pure aggregation over already-loaded posts. */
export function summarizePerformance(posts: PostForStats[]): PerformanceStats {
  let totalViews = 0;
  let postsWithMetrics = 0;
  for (const post of posts) {
    const latest = latestSnapshot(post.metrics);
    if (!latest) continue;
    postsWithMetrics += 1;
    totalViews += latest.views ?? 0;
  }

  const newest = posts.reduce<PostForStats | null>(
    (best, p) => (!best || p.publishedAt.getTime() > best.publishedAt.getTime() ? p : best),
    null
  );

  return {
    totalPosts: posts.length,
    totalViews,
    postsWithMetrics,
    latestPost: newest
      ? { id: newest.id, platform: newest.platform, publishedAt: newest.publishedAt, title: newest.contentItem?.title ?? null }
      : null,
  };
}

/** Loads a user's posts with only the newest snapshot each, and summarises them. */
export async function getPerformanceStats(db: PrismaClient, userId: string): Promise<PerformanceStats> {
  const posts = await db.post.findMany({
    where: { userId },
    orderBy: { publishedAt: 'desc' },
    select: {
      id: true,
      platform: true,
      publishedAt: true,
      contentItem: { select: { title: true } },
      metrics: { orderBy: { recordedAt: 'desc' }, take: 1, select: { views: true, recordedAt: true } },
    },
  });
  return summarizePerformance(posts);
}
