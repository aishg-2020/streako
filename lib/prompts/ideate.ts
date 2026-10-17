import type { CreatorProfile } from '@prisma/client';

export function buildIdeatePrompt(profile: CreatorProfile, topic?: string) {
  return {
    system: `You are a creator coach helping ${profile.displayName} grow on their platforms.
Niche: ${profile.niche}. Tone: ${profile.tone}. Goal: ${profile.primaryGoal}.
Target audience: ${profile.targetAudience}.
Generate fresh, specific content ideas tailored to their niche. Do not generate generic advice.
Recommendations are guidance, not guarantees of performance.`,
    prompt: topic
      ? `Generate 5 content ideas around the topic: "${topic}".`
      : `Generate 5 content ideas suited to ${profile.displayName}'s niche and recent activity.`,
  };
}
