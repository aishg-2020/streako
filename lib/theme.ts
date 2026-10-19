// Creator OS brand theme for Ant Design.
// A confident violet primary, soft lavender surfaces and rounded, airy components —
// tuned for a creator's daily workspace rather than a generic admin console.

import type { ThemeConfig } from 'antd';

export const brand = {
  primary: '#6C4CF1',
  primaryDark: '#5436D6',
  primarySoft: '#EEEBFE',
  ink: '#17142B',
  muted: '#6B6880',
  surface: '#FFFFFF',
  canvas: '#F5F4FB',
  line: '#E6E4F2',
} as const;

export const brandTheme: ThemeConfig = {
  token: {
    colorPrimary: brand.primary,
    colorInfo: brand.primary,
    colorLink: brand.primaryDark,
    colorSuccess: '#12B76A',
    colorWarning: '#F79009',
    colorError: '#E5484D',
    colorTextBase: brand.ink,
    colorTextSecondary: brand.muted,
    colorBgLayout: brand.canvas,
    colorBgContainer: brand.surface,
    colorBorder: brand.line,
    colorBorderSecondary: brand.line,
    borderRadius: 10,
    borderRadiusLG: 14,
    borderRadiusSM: 8,
    // The Geist variables come from next/font in app/layout.tsx; the inner fallback keeps the
    // declaration valid (and sans-serif) even if the variable is missing.
    fontFamily: "var(--font-geist-sans, 'Inter'), ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    fontFamilyCode: "var(--font-geist-mono, ui-monospace), SFMono-Regular, Menlo, Consolas, monospace",
    fontSize: 14,
    fontSizeHeading1: 30,
    fontSizeHeading2: 24,
    fontSizeHeading3: 20,
    fontSizeHeading4: 16,
    fontWeightStrong: 600,
    lineHeight: 1.55,
    controlHeight: 36,
    boxShadowTertiary: '0 1px 2px rgba(23, 20, 43, 0.04), 0 4px 16px -8px rgba(23, 20, 43, 0.12)',
  },
  components: {
    Layout: {
      siderBg: brand.surface,
      headerBg: brand.surface,
      bodyBg: brand.canvas,
      triggerBg: brand.surface,
    },
    Menu: {
      itemBorderRadius: 8,
      itemHeight: 40,
      itemMarginInline: 8,
      itemSelectedBg: brand.primarySoft,
      itemSelectedColor: brand.primaryDark,
      itemHoverBg: '#F3F1FE',
      iconSize: 16,
      collapsedIconSize: 18,
    },
    Card: {
      headerFontSize: 15,
      headerHeight: 52,
      paddingLG: 20,
    },
    Button: {
      fontWeight: 500,
      primaryShadow: '0 2px 0 rgba(84, 54, 214, 0.08)',
      defaultShadow: 'none',
    },
    Statistic: {
      contentFontSize: 28,
      titleFontSize: 13,
    },
    Table: {
      headerBg: '#FAF9FE',
      headerColor: brand.muted,
      rowHoverBg: '#FAF9FE',
      cellPaddingBlockSM: 10,
    },
    Tag: {
      borderRadiusSM: 999,
      fontSizeSM: 12,
    },
    Steps: {
      iconSize: 28,
    },
    Typography: {
      titleMarginBottom: '0.25em',
      titleMarginTop: 0,
    },
    Input: {
      activeShadow: '0 0 0 3px rgba(108, 76, 241, 0.15)',
    },
  },
};
