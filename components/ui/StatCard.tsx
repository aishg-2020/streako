'use client';

import { Card, Flex, Statistic, Typography } from 'antd';
import { EyeOutlined, FireOutlined, SendOutlined } from '@ant-design/icons';
import { brand } from '@/lib/theme';

const ICONS = {
  fire: <FireOutlined />,
  send: <SendOutlined />,
  eye: <EyeOutlined />,
} as const;

/** Dashboard metric card: tinted icon, label, big number, and a one-line qualifier. */
export function StatCard({
  icon,
  title,
  value,
  suffix,
}: {
  icon: keyof typeof ICONS;
  title: string;
  value: number | string;
  suffix?: string;
}) {
  return (
    <Card aria-label={title} style={{ height: '100%' }}>
      <Flex gap={14} align="flex-start">
        <span
          aria-hidden
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 40,
            height: 40,
            borderRadius: 12,
            background: brand.primarySoft,
            color: brand.primaryDark,
            fontSize: 18,
            flexShrink: 0,
          }}
        >
          {ICONS[icon]}
        </span>
        <div style={{ minWidth: 0 }}>
          <Statistic title={title} value={value} />
          {suffix && (
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {suffix}
            </Typography.Text>
          )}
        </div>
      </Flex>
    </Card>
  );
}
