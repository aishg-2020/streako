import type { CreatorProfile } from '@prisma/client';

function parsePlatforms(val: unknown): string[] {
  if (Array.isArray(val)) return val as string[];
  if (typeof val === 'string') { try { return JSON.parse(val); } catch { return []; } }
  return [];
}

export function buildIdeatePrompt(profile: CreatorProfile, topic?: string) {
  const platforms = parsePlatforms(profile.platforms).join(', ') || 'their platforms';
  return {
    system: `You are a creator coach helping ${profile.displayName} grow on ${platforms}.
Niche: ${profile.niche}. Tone: ${profile.tone}. Goal: ${profile.primaryGoal}.
Target audience: ${profile.targetAudience}.
Generate fresh, specific content ideas tailored to their niche. Do not generate generic advice.
Recommendations are guidance, not guarantees of performance.`,
    prompt: topic
      ? `Generate 5 content ideas around the topic: "${topic}".`
      : `Generate 5 content ideas suited to ${profile.displayName}'s niche and recent activity.`,
  };
}
