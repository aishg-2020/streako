'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import type { ContentFormat, ContentStatus, Platform } from '@prisma/client';

export async function createContentItem(data: {
  title: string;
  platform: Platform;
  format: ContentFormat;
  targetDate?: Date;
  notes?: string;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) throw new Error('User not found');

  const item = await db.contentItem.create({ data: { ...data, userId: user.id } });
  revalidatePath('/content');
  return item.id;
}

export async function updateContentItem(
  id: string,
  data: Partial<{ title: string; notes: string; targetDate: Date }>
) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) throw new Error('User not found');

  await db.contentItem.updateMany({ where: { id, userId: user.id }, data });
  revalidatePath('/content');
}

export async function updateStatus(id: string, status: ContentStatus) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) throw new Error('User not found');

  await db.contentItem.updateMany({ where: { id, userId: user.id }, data: { status } });
  revalidatePath('/content');
}

export async function deleteContentItem(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) throw new Error('User not found');

  await db.contentItem.deleteMany({ where: { id, userId: user.id } });
  revalidatePath('/content');
}
