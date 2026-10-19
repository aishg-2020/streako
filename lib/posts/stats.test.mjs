// Regression tests for the dashboard performance numbers.
//
// Run with:  node --test --experimental-strip-types lib/posts/stats.test.mjs
// (Node ≥ 22.6; no test framework or build step needed.)

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { latestSnapshot, summarizePerformance, getPerformanceStats } from './stats.ts';

const at = (minutesAgo) => new Date(Date.UTC(2026, 0, 1, 12, 0) - minutesAgo * 60_000);

function post(id, views, { publishedMinutesAgo = 0, title = id } = {}) {
  // Oldest reading first, newest last — the order a naive "sum everything" would also see.
  const metrics = views.map((v, i) => ({ views: v, recordedAt: at((views.length - i) * 10) }));
  return { id, platform: 'YOUTUBE', publishedAt: at(publishedMinutesAgo), contentItem: { title }, metrics };
}

test('snapshots are cumulative: 1000 → 1200 → 1500 counts as 1500, not 3700', () => {
  const stats = summarizePerformance([post('p1', [1000, 1200, 1500])]);
  assert.equal(stats.totalViews, 1500);
});

test('total views sums only the newest snapshot of each post', () => {
  const stats = summarizePerformance([post('p1', [1000, 1200, 1500]), post('p2', [50, 80]), post('p3', [])]);
  assert.equal(stats.totalViews, 1580); // 1500 + 80; a sum of every row would be 3830
  assert.equal(stats.totalPosts, 3);
  assert.equal(stats.postsWithMetrics, 2);
});

test('the newest snapshot wins even when rows arrive out of order', () => {
  const p = post('p1', [1000, 1200, 1500]);
  p.metrics.reverse(); // newest first
  assert.equal(summarizePerformance([p]).totalViews, 1500);
  p.metrics = [p.metrics[1], p.metrics[0], p.metrics[2]]; // shuffled
  assert.equal(summarizePerformance([p]).totalViews, 1500);
});

test('a snapshot with no views recorded counts as 0, and a post with no snapshots is skipped', () => {
  const p = post('p1', [900]);
  p.metrics.push({ views: null, recordedAt: at(0) }); // newest reading logged likes only
  const stats = summarizePerformance([p, post('p2', [])]);
  assert.equal(stats.totalViews, 0);
  assert.equal(stats.postsWithMetrics, 1);
});

test('latestSnapshot picks the most recent reading', () => {
  const rows = [{ views: 1, recordedAt: at(30) }, { views: 3, recordedAt: at(0) }, { views: 2, recordedAt: at(10) }];
  assert.equal(latestSnapshot(rows)?.views, 3);
  assert.equal(latestSnapshot([]), null);
});

test('latest post is the most recently published one', () => {
  const stats = summarizePerformance([post('old', [], { publishedMinutesAgo: 60 }), post('new', [], { publishedMinutesAgo: 5, title: 'Newest' })]);
  assert.deepEqual(stats.latestPost && { id: stats.latestPost.id, title: stats.latestPost.title }, { id: 'new', title: 'Newest' });
  assert.equal(summarizePerformance([]).latestPost, null);
});

test('getPerformanceStats asks the database for only the newest snapshot per post', async () => {
  let args;
  const fakeDb = {
    post: {
      async findMany(a) {
        args = a;
        return [post('p1', [1500]), post('p2', [80])];
      },
    },
  };
  const stats = await getPerformanceStats(fakeDb, 'user-1');
  assert.equal(stats.totalViews, 1580);
  assert.deepEqual(args.where, { userId: 'user-1' });
  assert.deepEqual(args.select.metrics.orderBy, { recordedAt: 'desc' });
  assert.equal(args.select.metrics.take, 1);
});
