'use server';

import { auth } from '@/lib/auth-server';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';

export async function saveScript(contentItemId: string, body: string) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) throw new Error('User not found');

  const item = await db.contentItem.findFirst({ where: { id: contentItemId, userId: user.id } });
  if (!item) throw new Error('Content item not found');

  const activeScript = await db.script.findFirst({
    where: { contentItemId, isActive: true },
  });

  if (activeScript) {
    await db.script.update({ where: { id: activeScript.id }, data: { body } });
    revalidatePath(`/scripts/${activeScript.id}`);
    return activeScript.id;
  }

  const script = await db.script.create({
    data: { contentItemId, body, version: 1, isActive: true },
  });

  revalidatePath(`/content/${contentItemId}`);
  return script.id;
}

export async function createScriptVersion(contentItemId: string, body: string) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) throw new Error('User not found');

  const item = await db.contentItem.findFirst({ where: { id: contentItemId, userId: user.id } });
  if (!item) throw new Error('Content item not found');

  const lastVersion = await db.script.findFirst({
    where: { contentItemId },
    orderBy: { version: 'desc' },
  });

  // Deactivate previous active
  await db.script.updateMany({ where: { contentItemId, isActive: true }, data: { isActive: false } });

  const script = await db.script.create({
    data: {
      contentItemId,
      body,
      version: (lastVersion?.version ?? 0) + 1,
      isActive: true,
    },
  });

  revalidatePath(`/content/${contentItemId}`);
  return script.id;
}

