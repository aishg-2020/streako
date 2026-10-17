import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { OnboardingForm } from '@/components/onboarding/OnboardingForm';

export default async function OnboardingPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    include: { profile: true },
  });

  if (!user) redirect('/sign-in');
  if (user.profile?.onboardingDone) redirect('/dashboard');

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">Welcome to Creator OS</h1>
          <p className="mt-2 text-muted-foreground">
            Let&apos;s set up your creator profile to personalise your experience.
          </p>
        </div>
        <OnboardingForm userId={user.id} />
      </div>
    </div>
  );
}
