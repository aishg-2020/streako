'use client';

import { Flex } from 'antd';

/**
 * A plain vertical list with hairline separators. (Ant Design's `List` is deprecated in v6
 * and its replacement is a virtual-scroll primitive, so this covers the simple case.)
 */
export function RowList<T>({
  items,
  renderItem,
  rowKey,
  ariaLabel,
  size = 'middle',
}: {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  rowKey: (item: T, index: number) => React.Key;
  ariaLabel?: string;
  size?: 'small' | 'middle';
}) {
  return (
    <ul aria-label={ariaLabel} style={{ listStyle: 'none', margin: 0, padding: 0 }}>
      {items.map((item, index) => (
        <li
          key={rowKey(item, index)}
          style={{
            padding: size === 'small' ? '8px 0' : '12px 0',
            borderBottom: index < items.length - 1 ? '1px solid var(--ant-color-split)' : undefined,
          }}
        >
          <Flex align="center" gap={8} style={{ width: '100%' }}>
            {renderItem(item, index)}
          </Flex>
        </li>
      ))}
    </ul>
  );
}
