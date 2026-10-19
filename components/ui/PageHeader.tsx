'use client';

import Link from 'next/link';
import { Flex, Space, Typography } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';

/** Consistent page heading: optional back link, title, subtitle, and right-aligned extras. */
export function PageHeader({
  title,
  subtitle,
  back,
  extra,
  tag,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  back?: { href: string; label: string };
  extra?: React.ReactNode;
  tag?: React.ReactNode;
}) {
  return (
    <Flex vertical gap={4} style={{ marginBottom: 24 }}>
      {back && (
        <Link href={back.href} style={{ width: 'fit-content' }}>
          <Typography.Text type="secondary">
            <ArrowLeftOutlined style={{ marginInlineEnd: 6 }} />
            {back.label}
          </Typography.Text>
        </Link>
      )}
      <Flex justify="space-between" align="flex-start" gap={12} wrap>
        <Space align="center" size={12} wrap>
          <Typography.Title level={2} style={{ margin: 0 }}>
            {title}
          </Typography.Title>
          {tag}
        </Space>
        {extra}
      </Flex>
      {subtitle && <Typography.Text type="secondary">{subtitle}</Typography.Text>}
    </Flex>
  );
}
