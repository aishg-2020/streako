'use server';

import { auth } from '@/lib/auth-server';
import { redirect } from 'next/navigation';
import type { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import type { ExperienceLevel, Platform } from '@/types/schema';

export type ProfileFormData = {
  displayName: string;
  niche: string;
  contentCategories: string[];
  platforms: Platform[];
  postingFrequency: number;
  availableHours: number;
  experienceLevel: ExperienceLevel;
  primaryGoal: string;
  tone: string;
  targetAudience: string;
};

function serializeArrays(data: Partial<ProfileFormData>) {
  return {
    ...data,
    platforms: JSON.stringify(data.platforms ?? []),
    contentCategories: JSON.stringify(data.contentCategories ?? []),
  };
}

export async function saveProfile(data: ProfileFormData) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) throw new Error('User not found');

  const serialized = serializeArrays(data);

  await db.creatorProfile.upsert({
    where: { userId: user.id },
    create: { ...serialized, userId: user.id, onboardingDone: true } as unknown as Prisma.CreatorProfileUncheckedCreateInput,
    update: { ...serialized, onboardingDone: true } as unknown as Prisma.CreatorProfileUncheckedUpdateInput,
  });

  redirect('/dashboard');
}

export async function updateProfile(data: Partial<ProfileFormData>) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) throw new Error('User not found');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await db.creatorProfile.update({ where: { userId: user.id }, data: serializeArrays(data) as any });
}
