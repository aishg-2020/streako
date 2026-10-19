import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { auth } from '@/lib/auth-server';
import { db } from '@/lib/db';
import { AppShell } from '@/components/layout/AppShell';

async function AuthenticatedShell({ children }: { children: React.ReactNode }) {
  await connection(); // per-user data: render at request time
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    include: { profile: true },
  });

  if (!user) redirect('/sign-in');

  const showSidebar = !!user.profile?.onboardingDone;
  const isMock = process.env.MOCK_AUTH === 'true';

  return (
    <AppShell showSidebar={showSidebar} isMock={isMock}>
      {children}
    </AppShell>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  // The shell depends on request-time auth/user data; the Suspense boundary lets Next
  // stream it instead of trying to prerender it at build time.
  return (
    <Suspense fallback={null}>
      <AuthenticatedShell>{children}</AuthenticatedShell>
    </Suspense>
  );
}
