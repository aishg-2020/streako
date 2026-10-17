import { auth } from '@clerk/nextjs/server';
import { notFound, redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { ScriptEditor } from '@/components/scripts/ScriptEditor';

export default async function ScriptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) redirect('/sign-in');

  const script = await db.script.findFirst({
    where: { id },
    include: { contentItem: true },
  });

  if (!script || script.contentItem.userId !== user.id) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Script — {script.contentItem.title}
        </h1>
        <p className="text-muted-foreground">Version {script.version}</p>
      </div>
      <ScriptEditor script={script} />
    </div>
  );
}
