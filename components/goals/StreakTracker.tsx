import type { Streak } from '@prisma/client';
import { Card, Statistic } from 'antd';
import { Text } from '@/components/ui/typography';

export function StreakTracker({ streak }: { streak: Streak | null }) {
  return (
    <Card title="Streak" size="small" style={{ textAlign: 'center' }}>
      <Statistic
        value={streak?.current ?? 0}
        suffix={<Text type="secondary" style={{ fontSize: 14 }}>day streak</Text>}
        styles={{ content: { fontSize: 48, fontWeight: 700 } }}
      />
      <Text type="secondary" style={{ fontSize: 12 }}>
        Longest: {streak?.longest ?? 0} days
      </Text>
    </Card>
  );
}
