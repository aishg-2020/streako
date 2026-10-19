'use server';

import { auth } from '@/lib/auth-server';
import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { IdeaInputSchema, IdeaUpdateSchema, parseHooks, type IdeaInput, type IdeaUpdate } from '@/lib/ideas/schema';
import type { IdeaStatus } from '@/types/schema';

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
    console.error('[ideas action]', error);
    return { ok: false, error: 'Something went wrong. Please try again.' };
  }
}

function revalidateIdea(id?: string) {
  revalidatePath('/ideas');
  if (id) revalidatePath(`/ideas/${id}`);
}

// `hooks` is `String[]` on Postgres but a JSON-encoded string on the SQLite dev schema.
// Prisma's runtime datamodel tells us which client is generated; when that metadata is
// unavailable we fall back to the JSON-string form used throughout the dev setup.
const HOOKS_IS_LIST =
  Prisma.dmmf?.datamodel.models.find((m) => m.name === 'Idea')?.fields.find((f) => f.name === 'hooks')?.isList === true;

function serializeHooks(hooks: string[]) {
  return (HOOKS_IS_LIST ? hooks : JSON.stringify(hooks)) as Prisma.IdeaUncheckedCreateInput['hooks'];
}

/** Create an idea (manual form, or saving an AI-generated idea). Returns the new idea's id. */
export async function createIdea(input: IdeaInput): Promise<ActionResult<{ id: string }>> {
  return run(async () => {
    const parsed = IdeaInputSchema.safeParse(input);
    if (!parsed.success) throw new ActionError(parsed.error.issues[0]?.message ?? 'Invalid idea.');

    const user = await requireUser();
    const { hooks, ...data } = parsed.data;

    const idea = await db.idea.create({
      data: { ...data, hooks: serializeHooks(hooks), userId: user.id },
      select: { id: true },
    });

    revalidateIdea();
    return { id: idea.id };
  });
}

/** Edit an idea's fields. Status changes go through `setIdeaStatus` / `convertIdeaToContent`. */
export async function updateIdea(id: string, input: IdeaUpdate): Promise<ActionResult> {
  return run(async () => {
    const parsed = IdeaUpdateSchema.safeParse(input);
    if (!parsed.success) throw new ActionError(parsed.error.issues[0]?.message ?? 'Invalid idea.');

    const user = await requireUser();
    const { hooks, ...data } = parsed.data;
    const { count } = await db.idea.updateMany({
      where: { id, userId: user.id },
      data: { ...data, ...(hooks !== undefined && { hooks: serializeHooks(hooks) }) },
    });
    if (count === 0) throw new ActionError('Idea not found.');

    revalidateIdea(id);
    return undefined;
  });
}

/** Move an idea between SAVED and REJECTED. Converted ideas are locked to their content item. */
export async function setIdeaStatus(id: string, status: Extract<IdeaStatus, 'SAVED' | 'REJECTED'>): Promise<ActionResult> {
  return run(async () => {
    if (status !== 'SAVED' && status !== 'REJECTED') throw new ActionError('Invalid status.');

    const user = await requireUser();
    const idea = await db.idea.findFirst({ where: { id, userId: user.id }, select: { status: true } });
    if (!idea) throw new ActionError('Idea not found.');
    if (idea.status === 'CONVERTED') throw new ActionError('This idea has already been converted to content.');

    await db.idea.update({ where: { id }, data: { status } });
    revalidateIdea(id);
    return undefined;
  });
}

export async function deleteIdea(id: string): Promise<ActionResult> {
  return run(async () => {
    const user = await requireUser();
    const { count } = await db.idea.deleteMany({ where: { id, userId: user.id } });
    if (count === 0) throw new ActionError('Idea not found.');

    // A linked content item (if any) keeps existing; its ideaId is set to null.
    revalidateIdea(id);
    revalidatePath('/content');
    return undefined;
  });
}

function buildContentNotes(description: string, hooks: string[]) {
  const parts = [description.trim()];
  if (hooks.length) parts.push(['Hooks:', ...hooks.map((h) => `- ${h}`)].join('\n'));
  return parts.filter(Boolean).join('\n\n');
}

/**
 * Create the ContentItem linked to a saved idea and mark the idea CONVERTED.
 * Idempotent: if the idea already has a content item, its id is returned.
 */
export async function convertIdeaToContent(ideaId: string): Promise<ActionResult<{ contentItemId: string }>> {
  return run(async () => {
    const user = await requireUser();

    const convert = () =>
      db.$transaction(async (tx) => {
        const idea = await tx.idea.findFirst({
          where: { id: ideaId, userId: user.id },
          include: { contentItem: { select: { id: true } } },
        });
        if (!idea) throw new ActionError('Idea not found.');
        if (idea.contentItem) return idea.contentItem.id;
        if (idea.status === 'REJECTED') throw new ActionError('Restore this idea before converting it to content.');

        const contentItem = await tx.contentItem.create({
          data: {
            userId: user.id,
            ideaId: idea.id,
            title: idea.title,
            platform: idea.platform,
            format: idea.format,
            notes: buildContentNotes(idea.description, parseHooks(idea.hooks)),
          },
          select: { id: true },
        });
        await tx.idea.update({ where: { id: idea.id }, data: { status: 'CONVERTED' } });
        return contentItem.id;
      });

    let contentItemId: string;
    try {
      contentItemId = await convert();
    } catch (error) {
      // Two concurrent clicks: the unique ideaId constraint rejects the second insert,
      // at which point the first one has committed and we can return its content item.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        contentItemId = await convert();
      } else {
        throw error;
      }
    }

    revalidateIdea(ideaId);
    revalidatePath('/content');
    return { contentItemId };
  });
}
