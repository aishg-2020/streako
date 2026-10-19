'use client';

import { App, ConfigProvider } from 'antd';
import { brandTheme } from '@/lib/theme';

/** Applies the Creator OS theme and antd's App context (message/notification hooks). */
export function AntdProvider({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider theme={brandTheme}>
      <App>{children}</App>
    </ConfigProvider>
  );
}
