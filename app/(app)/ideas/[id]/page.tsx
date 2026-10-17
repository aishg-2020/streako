import { auth } from '@clerk/nextjs/server';
import { notFound, redirect } from 'next/navigation';
import { db } from '@/lib/db';

export default async function IdeaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) redirect('/sign-in');

  const idea = await db.idea.findFirst({ where: { id, userId: user.id } });
  if (!idea) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{idea.title}</h1>
        <p className="text-muted-foreground">{idea.platform} · {idea.format}</p>
      </div>
      <div className="rounded-lg border bg-card p-6">
        <p>{idea.description}</p>
        {idea.hooks.length > 0 && (
          <div className="mt-4">
            <h3 className="font-semibold text-sm mb-2">Suggested Hooks</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              {idea.hooks.map((hook, i) => <li key={i}>{hook}</li>)}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
