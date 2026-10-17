'use server';

import { auth } from '@/lib/auth-server';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import type { GoalPeriod } from '@/types/schema';

export async function setGoal(data: { period: GoalPeriod; targetPosts: number; targetScripts: number }) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) throw new Error('User not found');

  await db.goal.updateMany({ where: { userId: user.id, period: data.period }, data: { active: false } });
  await db.goal.create({ data: { ...data, userId: user.id } });
  revalidatePath('/goals');
}

export async function completeChallenge(description: string) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) throw new Error('User not found');

  await db.challengeLog.create({ data: { userId: user.id, description } });
  revalidatePath('/goals');
}

export async function updateStreak() {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) throw new Error('User not found');

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const streak = await db.streak.findUnique({ where: { userId: user.id } });

  if (!streak) {
    await db.streak.create({ data: { userId: user.id, current: 1, longest: 1, lastActiveAt: now } });
    return;
  }

  const lastActive = streak.lastActiveAt ? new Date(streak.lastActiveAt) : null;
  const lastDay = lastActive
    ? new Date(lastActive.getFullYear(), lastActive.getMonth(), lastActive.getDate())
    : null;

  const diffDays = lastDay ? Math.floor((today.getTime() - lastDay.getTime()) / 86400000) : null;

  let newCurrent = streak.current;
  if (diffDays === 0) return;
  if (diffDays === 1) newCurrent = streak.current + 1;
  else newCurrent = 1;

  await db.streak.update({
    where: { userId: user.id },
    data: {
      current: newCurrent,
      longest: Math.max(newCurrent, streak.longest),
      lastActiveAt: now,
    },
  });

  revalidatePath('/goals');
}
