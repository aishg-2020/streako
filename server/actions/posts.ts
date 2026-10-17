'use server';

import { auth } from '@/lib/auth-server';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import type { Platform } from '@/types/schema';

export async function createPost(data: {
  platform: Platform;
  url?: string;
  publishedAt: Date;
  contentItemId?: string;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) throw new Error('User not found');

  const post = await db.post.create({ data: { ...data, userId: user.id } });

  if (data.contentItemId) {
    await db.contentItem.updateMany({
      where: { id: data.contentItemId, userId: user.id },
      data: { status: 'PUBLISHED' },
    });
  }

  revalidatePath('/posts');
  return post.id;
}

export async function addMetricSnapshot(
  postId: string,
  metrics: { views?: number; likes?: number; comments?: number; shares?: number; saves?: number }
) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) throw new Error('User not found');

  const post = await db.post.findFirst({ where: { id: postId, userId: user.id } });
  if (!post) throw new Error('Post not found');

  await db.postMetric.create({ data: { postId, ...metrics } });
  revalidatePath(`/posts/${postId}`);
}

export async function linkPostToContent(postId: string, contentItemId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) throw new Error('User not found');

  await db.post.updateMany({ where: { id: postId, userId: user.id }, data: { contentItemId } });
  revalidatePath('/posts');
}
