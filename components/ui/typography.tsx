'use client';

// Ant Design's `Typography.Title` / `.Text` / `.Paragraph` are sub-properties of a client
// module, which Server Components can't access. Re-exporting them from a client module
// turns each into a proper client reference that can be used anywhere.

import { Typography } from 'antd';

export const Title = Typography.Title;
export const Text = Typography.Text;
export const Paragraph = Typography.Paragraph;
export const TypographyLink = Typography.Link;
