import { auth } from '@/lib/auth-server';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { Col, Flex, Row } from 'antd';
import { db } from '@/lib/db';
import { IdeaGrid } from '@/components/ideas/IdeaGrid';
import { IdeaForm } from '@/components/ideas/IdeaForm';
import { AIIdeatePanel } from '@/components/ideas/AIIdeatePanel';
import { PageHeader } from '@/components/ui/PageHeader';
import { PLATFORMS, parseStringArray } from '@/lib/ideas/schema';
import type { Platform } from '@/types/schema';

export default async function IdeasPage() {
  // Per-user data: always render at request time. (Clerk's auth() implies this by reading
  // headers, but the mock auth doesn't, which would let Next try to prerender the page.)
  await connection();
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    include: {
      ideas: {
        orderBy: { createdAt: 'desc' },
        include: { contentItem: { select: { id: true, status: true } } },
      },
      profile: true,
    },
  });

  if (!user) redirect('/sign-in');

  // Pre-select the creator's main platform in the manual form.
  const mainPlatform = parseStringArray(user.profile?.platforms)[0];
  const defaultPlatform = PLATFORMS.find((p) => p === mainPlatform) as Platform | undefined;

  return (
    <div>
      <PageHeader title="Idea Bank" subtitle="Capture and develop your content ideas" />

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Flex vertical gap={16}>
            <IdeaForm defaultPlatform={defaultPlatform} />
            <IdeaGrid ideas={user.ideas} />
          </Flex>
        </Col>
        <Col xs={24} lg={8}>
          <AIIdeatePanel profile={user.profile} />
        </Col>
      </Row>
    </div>
  );
}
