import { auth } from '@/lib/auth-server';
import { streamObject } from 'ai';
import { z } from 'zod';
import { model } from '@/lib/ai';
import { db } from '@/lib/db';
import { buildScriptFeedbackPrompt } from '@/lib/prompts/scriptFeedback';

const FeedbackSchema = z.object({
  overallScore: z.number().min(1).max(10),
  strengths: z.array(z.string()),
  improvements: z.array(z.string()),
  hookAnalysis: z.string(),
  pacing: z.string(),
  suggestions: z.array(z.string()),
  shotList: z.array(
    z.object({
      scene: z.number(),
      description: z.string(),
      type: z.string(),
    })
  ),
});

const MOCK_FEEDBACK = {
  overallScore: 7,
  strengths: [
    'Strong opening hook that creates curiosity',
    'Clear and simple language accessible to beginners',
    'Good use of personal story to build trust',
  ],
  improvements: [
    'The middle section loses momentum — tighten the explanation at the 45-second mark',
    'Missing a clear call-to-action at the end',
    'Could use a pattern interrupt around the 30-second mark to re-engage viewers',
  ],
  hookAnalysis: 'Your hook is effective — it leads with a relatable problem and promises a specific outcome. Consider making the stakes clearer in the first 3 seconds.',
  pacing: 'Good overall pace but slows noticeably around the 40–50 second section. Consider cutting the background context and getting to the solution faster.',
  suggestions: [
    'Add a "here\'s what we\'ll cover" roadmap at the 10-second mark',
    'End with a question to boost comments: "What\'s your biggest money mistake?"',
    'Add on-screen text for the key stat to reinforce retention',
  ],
  shotList: [
    { scene: 1, description: 'Talking head — hook statement to camera', type: 'Medium shot' },
    { scene: 2, description: 'Screen recording of the concept being demonstrated', type: 'Screen capture' },
    { scene: 3, description: 'Back to camera for the main takeaway', type: 'Close-up' },
    { scene: 4, description: 'Text overlay with the key stat', type: 'Graphic insert' },
    { scene: 5, description: 'CTA to camera', type: 'Medium shot' },
  ],
};

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return new Response('Unauthorized', { status: 401 });

  if (process.env.MOCK_AI === 'true') {
    return Response.json(MOCK_FEEDBACK);
  }

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    include: { profile: true },
  });
  if (!user?.profile) return new Response('Profile not found', { status: 404 });

  const body = await req.json();
  const { scriptBody } = body;

  if (!scriptBody) return new Response('Missing script body', { status: 400 });

  const { system, prompt } = buildScriptFeedbackPrompt(user.profile as never, scriptBody);

  const result = streamObject({
    model,
    schema: FeedbackSchema,
    system,
    prompt,
  });

  return result.toTextStreamResponse();
}
