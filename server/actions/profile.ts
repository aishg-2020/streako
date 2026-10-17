'use server';

import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import type { ExperienceLevel, Platform } from '@prisma/client';

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

export async function saveProfile(data: ProfileFormData) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) throw new Error('User not found');

  await db.creatorProfile.upsert({
    where: { userId: user.id },
    create: { ...data, userId: user.id, onboardingDone: true },
    update: { ...data, onboardingDone: true },
  });

  redirect('/dashboard');
}

export async function updateProfile(data: Partial<ProfileFormData>) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) throw new Error('User not found');

  await db.creatorProfile.update({
    where: { userId: user.id },
    data,
  });
}
