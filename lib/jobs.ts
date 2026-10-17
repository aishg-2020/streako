import { PgBoss } from 'pg-boss';

const globalForBoss = globalThis as unknown as { boss: PgBoss };

export function getBoss(): PgBoss {
  if (!globalForBoss.boss) {
    globalForBoss.boss = new PgBoss(process.env.DATABASE_URL!);
  }
  return globalForBoss.boss;
}

export const JOB_NAMES = {
  WEEKLY_REVIEW: 'weekly-review',
} as const;
