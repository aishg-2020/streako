import { auth } from '@/lib/auth-server';
import { notFound, redirect } from 'next/navigation';
import { connection } from 'next/server';
import { db } from '@/lib/db';
import { parseScriptFeedback } from '@/lib/scripts/schema';
import { ScriptEditor } from '@/components/scripts/ScriptEditor';
import { PageHeader } from '@/components/ui/PageHeader';

export default async function ScriptPage({ params }: { params: Promise<{ id: string }> }) {
  await connection(); // per-user data: render at request time
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) redirect('/sign-in');

  const script = await db.script.findFirst({
    where: { id, contentItem: { userId: user.id } },
    include: {
      contentItem: {
        select: {
          id: true,
          title: true,
          scripts: {
            orderBy: { version: 'desc' },
            select: { id: true, version: true, isActive: true, updatedAt: true, body: true },
          },
        },
      },
    },
  });
  if (!script) notFound();

  const versions = script.contentItem.scripts.map((s) => ({
    id: s.id,
    version: s.version,
    isActive: s.isActive,
    updatedAt: s.updatedAt,
    wordCount: s.body.trim().split(/\s+/).filter(Boolean).length,
    isEmpty: s.body === '',
  }));

  return (
    <div>
      <PageHeader
        back={{ href: `/content/${script.contentItem.id}`, label: script.contentItem.title }}
        title={`Script — ${script.contentItem.title}`}
      />
      <ScriptEditor
        key={script.id}
        script={{ id: script.id, contentItemId: script.contentItemId, version: script.version, body: script.body, isActive: script.isActive }}
        versions={versions}
        initialFeedback={parseScriptFeedback(script.aiFeedback)}
      />
    </div>
  );
}
