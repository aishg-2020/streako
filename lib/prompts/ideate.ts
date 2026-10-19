import type { CreatorProfile } from '@prisma/client';

function parsePlatforms(val: unknown): string[] {
  if (Array.isArray(val)) return val as string[];
  if (typeof val === 'string') { try { return JSON.parse(val); } catch { return []; } }
  return [];
}

export function buildIdeatePrompt(
  profile: CreatorProfile,
  topic?: string,
  options: { count?: number; exclude?: string[] } = {}
) {
  const platforms = parsePlatforms(profile.platforms).join(', ') || 'their platforms';
  const count = options.count ?? 5;
  const noun = count === 1 ? 'content idea' : 'content ideas';
  const exclude = (options.exclude ?? []).filter(Boolean);

  const ask = topic
    ? `Generate exactly ${count} ${noun} around the topic: "${topic}".`
    : `Generate exactly ${count} ${noun} suited to ${profile.displayName}'s niche and recent activity.`;

  const avoid = exclude.length
    ? `\n\nDo not repeat or closely paraphrase any of these existing ideas:\n${exclude.map((t) => `- ${t}`).join('\n')}`
    : '';

  return {
    system: `You are a creator coach helping ${profile.displayName} grow on ${platforms}.
Niche: ${profile.niche}. Tone: ${profile.tone}. Goal: ${profile.primaryGoal}.
Target audience: ${profile.targetAudience}.
Generate fresh, specific content ideas tailored to their niche. Do not generate generic advice.
Recommendations are guidance, not guarantees of performance.`,
    prompt: ask + avoid,
  };
}
