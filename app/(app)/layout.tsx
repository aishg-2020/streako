import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { AppShell } from '@/components/layout/AppShell';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    include: { profile: true },
  });

  if (!user) redirect('/sign-in');

  const showSidebar = !!user.profile?.onboardingDone;

  return <AppShell showSidebar={showSidebar}>{children}</AppShell>;
}
