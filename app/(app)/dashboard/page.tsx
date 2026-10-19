import Link from 'next/link';
import { auth } from '@/lib/auth-server';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { Card, Col, Row, Tag } from 'antd';
import { db } from '@/lib/db';
import { formatDate } from '@/lib/utils';
import { platformLabel } from '@/lib/ideas/schema';
import { formatCount } from '@/lib/posts/schema';
import { getPerformanceStats } from '@/lib/posts/stats';
import { PageHeader } from '@/components/ui/PageHeader';
import { Text } from '@/components/ui/typography';
import { StatCard } from '@/components/ui/StatCard';

export default async function DashboardPage() {
  await connection(); // per-user data: render at request time
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    include: {
      profile: true,
      streaks: true,
    },
  });

  if (!user?.profile?.onboardingDone) {
    redirect('/onboarding');
  }

  // Views = sum of each post's NEWEST snapshot (snapshots are cumulative). See lib/posts/stats.ts.
  const { totalPosts, totalViews, postsWithMetrics, latestPost } = await getPerformanceStats(db, user.id);

  return (
    <div>
      <PageHeader title="Dashboard" subtitle={`Welcome back, ${user.profile?.displayName}`} />

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} xl={6}>
          <StatCard icon="fire" title="Current Streak" value={user.streaks[0]?.current ?? 0} suffix="days" />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard icon="send" title="Total Posts" value={totalPosts} suffix="published" />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            icon="eye"
            title="Total Views"
            value={formatCount(totalViews)}
            suffix={
              totalPosts === 0
                ? 'no posts yet'
                : postsWithMetrics === totalPosts
                  ? 'latest snapshot per post'
                  : `${postsWithMetrics} of ${totalPosts} posts have metrics`
            }
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card aria-label="Latest Post" style={{ height: '100%' }}>
            <Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>
              Latest Post
            </Text>
            {latestPost ? (
              <>
                <Link href={`/posts/${latestPost.id}`} style={{ fontSize: 18, fontWeight: 600, lineHeight: 1.3, display: 'block' }}>
                  {latestPost.title ?? 'Untitled post'}
                </Link>
                <div style={{ marginTop: 8 }}>
                  <Tag style={{ marginInlineEnd: 6 }}>{platformLabel(latestPost.platform)}</Tag>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {formatDate(latestPost.publishedAt)}
                  </Text>
                </div>
              </>
            ) : (
              <Text type="secondary" style={{ fontSize: 16 }}>
                Nothing published yet
              </Text>
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} md={12}>
          <Card title="Pipeline Status">
            <Text type="secondary">No content items yet. Start by adding an idea.</Text>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="Weekly Review">
            <Text type="secondary">Your weekly review will appear here every Monday.</Text>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
