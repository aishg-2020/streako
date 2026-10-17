import type { CreatorProfile } from '@prisma/client';

export function buildScriptFeedbackPrompt(profile: CreatorProfile, scriptBody: string) {
  return {
    system: `You are a creator coach reviewing scripts for ${profile.displayName}.
Their niche: ${profile.niche}. Tone: ${profile.tone}. Platforms: ${profile.platforms.join(', ')}.
Provide constructive, specific, actionable feedback. Score holistically but be encouraging.
Recommendations are guidance, not guarantees.`,
    prompt: `Review the following script and provide structured feedback:\n\n${scriptBody}`,
  };
}
