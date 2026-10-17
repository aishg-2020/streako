import type { CreatorProfile, Post, Script } from '@prisma/client';

export function buildWeeklyReviewPrompt(
  profile: CreatorProfile,
  posts: Post[],
  scripts: Script[]
) {
  return {
    system: `You are a creator coach generating a weekly review for ${profile.displayName}.
Their niche: ${profile.niche}. Goal: ${profile.primaryGoal}.
Be honest, specific, and encouraging. Identify patterns in the data.
This is guidance, not a guarantee of results.`,
    prompt: `Generate a weekly review based on this activity:
- Posts published this week: ${posts.length}
- Scripts written this week: ${scripts.length}
- Platforms active: ${[...new Set(posts.map((p) => p.platform))].join(', ') || 'none'}

Provide a summary, list achievements, areas for improvement, and top 3 priorities for next week.`,
  };
}
