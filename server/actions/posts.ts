'use server';

import { auth } from '@/lib/auth-server';
import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { db } from '@/lib/db';
import { MetricSnapshotSchema, type MetricSnapshotInput } from '@/lib/posts/schema';
import { PLATFORMS } from '@/lib/ideas/schema';
import type { Platform } from '@/types/schema';

// Actions return a result object instead of throwing so that the UI can show the
// real error message (thrown errors are redacted in production builds).
export type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string };

class ActionError extends Error {}

async function requireUser() {
  const { userId } = await auth();
  if (!userId) throw new ActionError('You need to be signed in.');

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) throw new ActionError('User not found.');
  return user;
}

async function run<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (error) {
    if (error instanceof ActionError) return { ok: false, error: error.message };
    console.error('[posts action]', error);
    return { ok: false, error: 'Something went wrong. Please try again.' };
  }
}

function revalidatePosts(postId?: string, contentItemId?: string) {
  revalidatePath('/posts');
  revalidatePath('/dashboard');
  if (postId) revalidatePath(`/posts/${postId}`);
  if (contentItemId) revalidatePath(`/content/${contentItemId}`);
}

/**
 * "Mark as published": create the Post linked to a content item, with the published date
 * set to now. Idempotent — if the item already has a post, that post's id is returned.
 */
export async function createPostFromContent(contentItemId: string): Promise<ActionResult<{ postId: string; created: boolean }>> {
  return run(async () => {
    const user = await requireUser();

    const item = await db.contentItem.findFirst({
      where: { id: contentItemId, userId: user.id },
      select: { id: true, platform: true, status: true, post: { select: { id: true } } },
    });
    if (!item) throw new ActionError('Content item not found.');
    if (item.post) return { postId: item.post.id, created: false };
    if (item.status !== 'PUBLISHED') throw new ActionError('Move the item to Published first.');

    try {
      const post = await db.post.create({
        data: { userId: user.id, contentItemId: item.id, platform: item.platform, publishedAt: new Date() },
        select: { id: true },
      });
      revalidatePosts(post.id, item.id);
      return { postId: post.id, created: true };
    } catch (error) {
      // Double click: the unique contentItemId constraint rejects the second insert.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const existing = await db.post.findUnique({ where: { contentItemId: item.id }, select: { id: true } });
        if (existing) return { postId: existing.id, created: false };
      }
      throw error;
    }
  });
}

const CreatePostSchema = z.object({
  platform: z.enum(PLATFORMS, 'Choose a platform'),
  url: z.string().trim().url('Enter a valid URL').max(2000).optional(),
  publishedAt: z.date(),
  contentItemId: z.string().optional(),
});

/** Manually record a post (for content created outside the app). */
export async function createPost(data: {
  platform: Platform;
  url?: string;
  publishedAt: Date;
  contentItemId?: string;
}): Promise<ActionResult<{ postId: string }>> {
  return run(async () => {
    const parsed = CreatePostSchema.safeParse(data);
    if (!parsed.success) throw new ActionError(parsed.error.issues[0]?.message ?? 'Invalid post.');

    const user = await requireUser();
    const { contentItemId, ...rest } = parsed.data;

    if (contentItemId) {
      const item = await db.contentItem.findFirst({ where: { id: contentItemId, userId: user.id }, select: { id: true } });
      if (!item) throw new ActionError('Content item not found.');
    }

    const post = await db.post.create({ data: { ...rest, contentItemId, userId: user.id }, select: { id: true } });
    if (contentItemId) {
      await db.contentItem.update({ where: { id: contentItemId }, data: { status: 'PUBLISHED' } });
      revalidatePath('/content');
    }

    revalidatePosts(post.id, contentItemId);
    return { postId: post.id };
  });
}

/** Log a metrics snapshot. Always inserts a new PostMetric row; earlier rows are never changed. */
export async function addMetricSnapshot(postId: string, metrics: MetricSnapshotInput): Promise<ActionResult<{ metricId: string }>> {
  return run(async () => {
    const parsed = MetricSnapshotSchema.safeParse(metrics);
    if (!parsed.success) throw new ActionError(parsed.error.issues[0]?.message ?? 'Invalid metrics.');

    const user = await requireUser();
    const post = await db.post.findFirst({ where: { id: postId, userId: user.id }, select: { id: true, contentItemId: true } });
    if (!post) throw new ActionError('Post not found.');

    const metric = await db.postMetric.create({ data: { postId: post.id, ...parsed.data }, select: { id: true } });
    revalidatePosts(post.id, post.contentItemId ?? undefined);
    return { metricId: metric.id };
  });
}

export async function linkPostToContent(postId: string, contentItemId: string): Promise<ActionResult> {
  return run(async () => {
    const user = await requireUser();
    const item = await db.contentItem.findFirst({ where: { id: contentItemId, userId: user.id }, select: { id: true } });
    if (!item) throw new ActionError('Content item not found.');

    const { count } = await db.post.updateMany({ where: { id: postId, userId: user.id }, data: { contentItemId } });
    if (count === 0) throw new ActionError('Post not found.');

    revalidatePosts(postId, contentItemId);
    return undefined;
  });
}
