import { auth } from '@/lib/auth-server';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { Flex } from 'antd';
import { db } from '@/lib/db';
import { OnboardingForm } from '@/components/onboarding/OnboardingForm';
import { Title, Text } from '@/components/ui/typography';

export default async function OnboardingPage() {
  await connection(); // per-user data: render at request time
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    include: { profile: true },
  });

  if (!user) redirect('/sign-in');
  if (user.profile?.onboardingDone) redirect('/dashboard');

  return (
    <Flex align="center" justify="center" style={{ minHeight: '100vh', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 560 }}>
        <Flex vertical align="center" style={{ marginBottom: 28, textAlign: 'center' }}>
          <Title level={1}>Welcome to Creator OS</Title>
          <Text type="secondary">Let&apos;s set up your creator profile to personalise your experience.</Text>
        </Flex>
        <OnboardingForm userId={user.id} />
      </div>
    </Flex>
  );
}
