import type { CreatorProfile } from '@prisma/client';

function parsePlatforms(val: unknown): string[] {
  if (Array.isArray(val)) return val as string[];
  if (typeof val === 'string') { try { return JSON.parse(val); } catch { return []; } }
  return [];
}

export function buildScriptFeedbackPrompt(profile: CreatorProfile, scriptBody: string) {
  const platforms = parsePlatforms(profile.platforms).join(', ') || 'their platforms';
  return {
    system: `You are a creator coach reviewing scripts for ${profile.displayName}.
Their niche: ${profile.niche}. Tone: ${profile.tone}. Platforms: ${platforms}.
Provide constructive, specific, actionable feedback. Score holistically but be encouraging.
Recommendations are guidance, not guarantees.`,
    prompt: `Review the following script and provide structured feedback:\n\n${scriptBody}`,
  };
}
