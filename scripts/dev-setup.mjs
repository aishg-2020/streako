#!/usr/bin/env node
// Sets up the local SQLite dev environment.
// Run once: npm run dev:setup

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

// Load .env.local so child processes inherit the right vars
function loadEnv() {
  const path = '.env.local';
  if (!existsSync(path)) {
    console.error('✗  .env.local not found. Copy .env.local.dev → .env.local first.');
    process.exit(1);
  }
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnv();

const DEV_DB = process.env.DEV_DATABASE_URL ?? 'file:./prisma/dev.db';
const env = { ...process.env, DEV_DATABASE_URL: DEV_DB };

console.log('1/3  Generating Prisma client from SQLite dev schema…');
execSync('npx prisma generate --schema=prisma/schema.dev.prisma', { stdio: 'inherit', env });

console.log('2/3  Pushing schema to SQLite…');
execSync('npx prisma db push --schema=prisma/schema.dev.prisma --skip-generate', { stdio: 'inherit', env });

console.log('3/3  Seeding mock user and profile…');

const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient({ datasources: { db: { url: DEV_DB } } });

try {
  const user = await db.user.upsert({
    where: { clerkId: 'mock_clerk_id' },
    create: { clerkId: 'mock_clerk_id', email: 'demo@creator-os.dev' },
    update: {},
  });

  await db.creatorProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      displayName: 'Demo Creator',
      niche: 'Personal Finance',
      contentCategories: JSON.stringify(['investing', 'budgeting']),
      platforms: JSON.stringify(['YOUTUBE', 'INSTAGRAM']),
      postingFrequency: 3,
      availableHours: 10,
      experienceLevel: 'INTERMEDIATE',
      primaryGoal: 'Grow to 50k followers and monetise through brand deals',
      tone: 'Educational and engaging',
      targetAudience: 'Young professionals aged 22–35',
      onboardingDone: true,
    },
    update: { onboardingDone: true },
  });

  await db.streak.upsert({
    where: { userId: user.id },
    create: { userId: user.id, current: 3, longest: 7 },
    update: {},
  });

  console.log('\n✓  Dev DB ready at', DEV_DB);
  console.log('   Mock user: demo@creator-os.dev (clerkId: mock_clerk_id)');
  console.log('   Run: npm run dev\n');
} finally {
  await db.$disconnect();
}
