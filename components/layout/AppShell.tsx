'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { Avatar, Flex, Layout, Menu, Space, Tag, Typography } from 'antd';
import {
  AppstoreOutlined,
  BulbOutlined,
  CalendarOutlined,
  DashboardOutlined,
  RocketOutlined,
  SendOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { brand } from '@/lib/theme';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: <DashboardOutlined /> },
  { href: '/ideas', label: 'Ideas', icon: <BulbOutlined /> },
  { href: '/content', label: 'Content', icon: <AppstoreOutlined /> },
  { href: '/posts', label: 'Posts', icon: <SendOutlined /> },
  { href: '/goals', label: 'Goals', icon: <ThunderboltOutlined /> },
  { href: '/review', label: 'Weekly Review', icon: <CalendarOutlined /> },
];

// Lazy-load UserButton only when Clerk is active (the chunk is fetched on first render)
const UserButton = dynamic(() => import('@clerk/nextjs').then((m) => m.UserButton));

function UserAvatar({ isMock }: { isMock: boolean }) {
  if (isMock) {
    return (
      <Space size={10}>
        <Avatar size={32} style={{ background: brand.primarySoft, color: brand.primaryDark, fontWeight: 600 }}>
          D
        </Avatar>
        <Flex vertical>
          <Typography.Text strong style={{ lineHeight: 1.2 }}>
            Demo
          </Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 12, lineHeight: 1.2 }}>
            demo@creator-os.dev
          </Typography.Text>
        </Flex>
      </Space>
    );
  }
  return <UserButton />;
}

export function AppShell({
  children,
  showSidebar = true,
  isMock = false,
}: {
  children: React.ReactNode;
  showSidebar?: boolean;
  isMock?: boolean;
}) {
  const pathname = usePathname();

  if (!showSidebar) {
    return <Layout style={{ minHeight: '100vh' }}>{children}</Layout>;
  }

  const selected = NAV_ITEMS.find((item) => pathname.startsWith(item.href))?.href;

  return (
    <Layout style={{ minHeight: '100vh' }} hasSider>
      <Layout.Sider
        width={240}
        breakpoint="lg"
        collapsedWidth={64}
        style={{ borderInlineEnd: `1px solid ${brand.line}`, position: 'sticky', top: 0, height: '100vh' }}
      >
        <Flex vertical style={{ height: '100%' }}>
          <Link href="/dashboard" style={{ display: 'block', padding: '20px 20px 16px' }}>
            <Space size={10} align="center">
              <Avatar shape="square" size={32} style={{ background: brand.primary }} icon={<RocketOutlined />} />
              <Flex vertical>
                <Typography.Text strong style={{ fontSize: 16, lineHeight: 1.2, whiteSpace: 'nowrap' }}>
                  Creator OS
                </Typography.Text>
                {isMock && (
                  <Tag color="gold" style={{ width: 'fit-content', marginTop: 4, marginInlineEnd: 0, lineHeight: '18px' }}>
                    mock
                  </Tag>
                )}
              </Flex>
            </Space>
          </Link>

          <Menu
            mode="inline"
            selectedKeys={selected ? [selected] : []}
            style={{ borderInlineEnd: 0, flex: 1 }}
            items={NAV_ITEMS.map((item) => ({
              key: item.href,
              icon: item.icon,
              label: <Link href={item.href}>{item.label}</Link>,
            }))}
          />

          <div style={{ padding: 16, borderTop: `1px solid ${brand.line}` }}>
            <UserAvatar isMock={isMock} />
          </div>
        </Flex>
      </Layout.Sider>
      <Layout>
        <Layout.Content style={{ padding: '28px 32px', maxWidth: 1440, width: '100%' }}>{children}</Layout.Content>
      </Layout>
    </Layout>
  );
}
