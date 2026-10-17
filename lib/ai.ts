import { createAnthropic } from '@ai-sdk/anthropic';
import { streamObject, generateObject } from 'ai';

const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
export const model = anthropic('claude-sonnet-4-5');

export { streamObject, generateObject };
