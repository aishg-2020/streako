'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/ideas', label: 'Ideas' },
  { href: '/content', label: 'Content' },
  { href: '/posts', label: 'Posts' },
  { href: '/goals', label: 'Goals' },
  { href: '/review', label: 'Weekly Review' },
];

function UserAvatar({ isMock }: { isMock: boolean }) {
  if (isMock) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">D</div>
        <span>Demo</span>
      </div>
    );
  }
  // Lazy-load UserButton only when Clerk is active
  const { UserButton } = require('@clerk/nextjs');
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
    return <main className="min-h-screen bg-background">{children}</main>;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="w-56 shrink-0 border-r bg-card flex flex-col">
        <div className="p-4 border-b">
          <span className="font-bold text-lg">Creator OS</span>
          {isMock && (
            <span className="ml-2 rounded bg-yellow-100 px-1.5 py-0.5 text-xs text-yellow-700">mock</span>
          )}
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors',
                pathname.startsWith(item.href)
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t">
          <UserAvatar isMock={isMock} />
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  );
}
