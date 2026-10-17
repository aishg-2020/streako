import { auth } from '@clerk/nextjs/server';
import { notFound, redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { StatusBadge } from '@/components/ui/StatusBadge';

export default async function ContentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) redirect('/sign-in');

  const item = await db.contentItem.findFirst({
    where: { id, userId: user.id },
    include: { scripts: { orderBy: { version: 'desc' } }, idea: true },
  });
  if (!item) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{item.title}</h1>
          <p className="text-muted-foreground">{item.platform} · {item.format}</p>
        </div>
        <StatusBadge status={item.status} />
      </div>

      {item.notes && (
        <div className="rounded-lg border bg-card p-4">
          <h3 className="font-semibold text-sm mb-1">Notes</h3>
          <p className="text-sm text-muted-foreground">{item.notes}</p>
        </div>
      )}

      <div className="rounded-lg border bg-card p-4">
        <h3 className="font-semibold text-sm mb-2">Scripts ({item.scripts.length})</h3>
        {item.scripts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No scripts yet.</p>
        ) : (
          <ul className="space-y-2">
            {item.scripts.map((s) => (
              <li key={s.id} className="text-sm">
                <a href={`/scripts/${s.id}`} className="underline">Version {s.version}</a>
                {s.isActive && <span className="ml-2 text-xs text-green-600">active</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
