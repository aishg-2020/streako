'use server';

import { auth } from '@/lib/auth-server';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import type { ContentFormat, IdeaStatus, Platform } from '@/types/schema';

export async function createIdea(data: {
  title: string;
  description: string;
  format: ContentFormat;
  platform: Platform;
  hooks?: string[];
}) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) throw new Error('User not found');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await db.idea.create({ data: { ...data, hooks: JSON.stringify(data.hooks ?? []), userId: user.id } as any });

  revalidatePath('/ideas');
}

export async function updateIdea(
  id: string,
  data: Partial<{ title: string; description: string; status: IdeaStatus }>
) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) throw new Error('User not found');

  await db.idea.updateMany({ where: { id, userId: user.id }, data });
  revalidatePath('/ideas');
}

export async function deleteIdea(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) throw new Error('User not found');

  await db.idea.deleteMany({ where: { id, userId: user.id } });
  revalidatePath('/ideas');
}

export async function convertIdeaToContent(ideaId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) throw new Error('User not found');

  const idea = await db.idea.findFirst({ where: { id: ideaId, userId: user.id } });
  if (!idea) throw new Error('Idea not found');

  const contentItem = await db.contentItem.create({
    data: {
      userId: user.id,
      ideaId: idea.id,
      title: idea.title,
      platform: idea.platform,
      format: idea.format,
    },
  });

  await db.idea.update({ where: { id: ideaId }, data: { status: 'CONVERTED' } });

  revalidatePath('/ideas');
  revalidatePath('/content');

  return contentItem.id;
}
