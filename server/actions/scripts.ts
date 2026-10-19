'use server';

import { auth } from '@/lib/auth-server';
import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { SCRIPT_LIMITS, ScriptFeedbackSchema, type ScriptFeedback } from '@/lib/scripts/schema';

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
    console.error('[scripts action]', error);
    return { ok: false, error: 'Something went wrong. Please try again.' };
  }
}

async function requireOwnedContentItem(contentItemId: string, userId: string) {
  const item = await db.contentItem.findFirst({ where: { id: contentItemId, userId }, select: { id: true } });
  if (!item) throw new ActionError('Content item not found.');
  return item;
}

function revalidateScript(contentItemId: string, scriptId?: string) {
  revalidatePath('/content');
  revalidatePath(`/content/${contentItemId}`);
  if (scriptId) revalidatePath(`/scripts/${scriptId}`);
}

// `aiFeedback` / `shotList` are `Json?` on Postgres but JSON strings on the SQLite dev
// schema. Prisma's runtime datamodel tells us which client is generated; when that
// metadata is unavailable we fall back to the JSON-string form used by the dev setup.
const FEEDBACK_IS_JSON =
  Prisma.dmmf?.datamodel.models.find((m) => m.name === 'Script')?.fields.find((f) => f.name === 'aiFeedback')?.type === 'Json';

function serializeJson(value: unknown) {
  return (FEEDBACK_IS_JSON ? value : JSON.stringify(value)) as Prisma.ScriptUncheckedUpdateInput['aiFeedback'];
}

/**
 * Open the script editor for a content item: returns the current (active) script,
 * creating an empty version 1 if the item has no script yet.
 */
export async function createScriptDraft(contentItemId: string): Promise<ActionResult<{ scriptId: string }>> {
  return run(async () => {
    const user = await requireUser();
    await requireOwnedContentItem(contentItemId, user.id);

    const active = await db.script.findFirst({
      where: { contentItemId, isActive: true },
      orderBy: { version: 'desc' },
      select: { id: true },
    });
    if (active) return { scriptId: active.id };

    const script = await db.script.create({
      data: { contentItemId, body: '', version: 1, isActive: true },
      select: { id: true },
    });
    revalidateScript(contentItemId, script.id);
    return { scriptId: script.id };
  });
}

/**
 * Save the script as a new version. Every save is kept, so the version list doubles as
 * the change history. Saving a body identical to the latest version is a no-op that
 * returns the latest version (except for an empty v1 draft, which is filled in place).
 */
export async function saveScriptVersion(
  contentItemId: string,
  body: string
): Promise<ActionResult<{ scriptId: string; version: number; unchanged: boolean }>> {
  return run(async () => {
    if (typeof body !== 'string') throw new ActionError('Invalid script.');
    if (body.length > SCRIPT_LIMITS.body) throw new ActionError(`Scripts are limited to ${SCRIPT_LIMITS.body} characters.`);

    const user = await requireUser();
    await requireOwnedContentItem(contentItemId, user.id);

    const result = await db.$transaction(async (tx) => {
      const latest = await tx.script.findFirst({
        where: { contentItemId },
        orderBy: { version: 'desc' },
        select: { id: true, version: true, body: true },
      });

      if (latest && latest.body === body) return { scriptId: latest.id, version: latest.version, unchanged: true };

      // An untouched empty draft isn't worth a history entry: fill it in instead.
      if (latest && latest.version === 1 && latest.body === '') {
        await tx.script.update({ where: { id: latest.id }, data: { body, isActive: true } });
        return { scriptId: latest.id, version: 1, unchanged: false };
      }

      await tx.script.updateMany({ where: { contentItemId, isActive: true }, data: { isActive: false } });
      const script = await tx.script.create({
        data: { contentItemId, body, version: (latest?.version ?? 0) + 1, isActive: true },
        select: { id: true, version: true },
      });
      return { scriptId: script.id, version: script.version, unchanged: false };
    });

    revalidateScript(contentItemId, result.scriptId);
    return result;
  });
}

/** Persist AI feedback (and its shot list) on a script so it is shown on the next visit. */
export async function saveScriptFeedback(scriptId: string, feedback: ScriptFeedback): Promise<ActionResult> {
  return run(async () => {
    const parsed = ScriptFeedbackSchema.safeParse(feedback);
    if (!parsed.success) throw new ActionError('Invalid feedback.');

    const user = await requireUser();
    const script = await db.script.findFirst({
      where: { id: scriptId, contentItem: { userId: user.id } },
      select: { id: true, contentItemId: true },
    });
    if (!script) throw new ActionError('Script not found.');

    await db.script.update({
      where: { id: script.id },
      data: { aiFeedback: serializeJson(parsed.data), shotList: serializeJson(parsed.data.shotList) },
    });

    revalidateScript(script.contentItemId, script.id);
    return undefined;
  });
}
