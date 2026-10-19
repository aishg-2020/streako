import { auth } from '@/lib/auth-server';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { Col, Flex, Row } from 'antd';
import { db } from '@/lib/db';
import { GoalSetter } from '@/components/goals/GoalSetter';
import { StreakTracker } from '@/components/goals/StreakTracker';
import { ChallengeList } from '@/components/goals/ChallengeList';
import { PageHeader } from '@/components/ui/PageHeader';

export default async function GoalsPage() {
  await connection(); // per-user data: render at request time
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) redirect('/sign-in');

  const [goals, streak, challenges] = await Promise.all([
    db.goal.findMany({ where: { userId: user.id, active: true } }),
    db.streak.findUnique({ where: { userId: user.id } }),
    db.challengeLog.findMany({
      where: { userId: user.id },
      orderBy: { completedAt: 'desc' },
      take: 20,
    }),
  ]);

  return (
    <div>
      <PageHeader title="Goals & Consistency" subtitle="Stay on track with your creator habits" />

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Flex vertical gap={24}>
            <GoalSetter goals={goals} userId={user.id} />
            <ChallengeList challenges={challenges} userId={user.id} />
          </Flex>
        </Col>
        <Col xs={24} lg={8}>
          <StreakTracker streak={streak} />
        </Col>
      </Row>
    </div>
  );
}
