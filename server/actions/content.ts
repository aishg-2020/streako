'use server';

import { auth } from '@/lib/auth-server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/db';
import { CONTENT_LIMITS, isContentStatus } from '@/lib/content/pipeline';
import { CONTENT_FORMATS, PLATFORMS } from '@/lib/ideas/schema';
import type { ContentFormat, ContentStatus, Platform } from '@/types/schema';

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
    console.error('[content action]', error);
    return { ok: false, error: 'Something went wrong. Please try again.' };
  }
}

function revalidateContent(id?: string) {
  revalidatePath('/content');
  if (id) revalidatePath(`/content/${id}`);
}

const TitleSchema = z.string().trim().min(1, 'Title is required').max(CONTENT_LIMITS.title, `Title must be ${CONTENT_LIMITS.title} characters or fewer`);
const NotesSchema = z.string().max(CONTENT_LIMITS.notes, `Notes must be ${CONTENT_LIMITS.notes} characters or fewer`);

const CreateSchema = z.object({
  title: TitleSchema,
  platform: z.enum(PLATFORMS, 'Choose a platform'),
  format: z.enum(CONTENT_FORMATS, 'Choose a format'),
  targetDate: z.date().optional(),
  notes: NotesSchema.optional(),
});

const UpdateSchema = z.object({
  title: TitleSchema.optional(),
  notes: NotesSchema.nullable().optional(),
  targetDate: z.date().nullable().optional(),
});

export async function createContentItem(data: {
  title: string;
  platform: Platform;
  format: ContentFormat;
  targetDate?: Date;
  notes?: string;
}): Promise<ActionResult<{ id: string }>> {
  return run(async () => {
    const parsed = CreateSchema.safeParse(data);
    if (!parsed.success) throw new ActionError(parsed.error.issues[0]?.message ?? 'Invalid content item.');

    const user = await requireUser();
    const item = await db.contentItem.create({ data: { ...parsed.data, userId: user.id }, select: { id: true } });
    revalidateContent();
    return { id: item.id };
  });
}

/** Edit title / notes / target date. Used by the auto-saving notes editor. */
export async function updateContentItem(
  id: string,
  data: Partial<{ title: string; notes: string | null; targetDate: Date | null }>
): Promise<ActionResult> {
  return run(async () => {
    const parsed = UpdateSchema.safeParse(data);
    if (!parsed.success) throw new ActionError(parsed.error.issues[0]?.message ?? 'Invalid changes.');

    const user = await requireUser();
    const { count } = await db.contentItem.updateMany({ where: { id, userId: user.id }, data: parsed.data });
    if (count === 0) throw new ActionError('Content item not found.');

    revalidateContent(id);
    return undefined;
  });
}

/** Move an item to any stage of the pipeline (the UI only offers the adjacent stages). */
export async function updateStatus(id: string, status: ContentStatus): Promise<ActionResult> {
  return run(async () => {
    if (!isContentStatus(status)) throw new ActionError('Invalid status.');

    const user = await requireUser();
    const { count } = await db.contentItem.updateMany({ where: { id, userId: user.id }, data: { status } });
    if (count === 0) throw new ActionError('Content item not found.');

    revalidateContent(id);
    return undefined;
  });
}

export async function deleteContentItem(id: string): Promise<ActionResult> {
  return run(async () => {
    const user = await requireUser();
    const { count } = await db.contentItem.deleteMany({ where: { id, userId: user.id } });
    if (count === 0) throw new ActionError('Content item not found.');

    revalidateContent(id);
    revalidatePath('/ideas');
    return undefined;
  });
}
