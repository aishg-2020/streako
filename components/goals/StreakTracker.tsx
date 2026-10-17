import type { Streak } from '@prisma/client';

export function StreakTracker({ streak }: { streak: Streak | null }) {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <h2 className="font-semibold text-sm">Streak</h2>
      <div className="text-center">
        <p className="text-5xl font-bold">{streak?.current ?? 0}</p>
        <p className="text-sm text-muted-foreground mt-1">day streak</p>
      </div>
      <div className="text-center text-xs text-muted-foreground">
        Longest: {streak?.longest ?? 0} days
      </div>
    </div>
  );
}
