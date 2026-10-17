import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// When MOCK_AUTH=true, bypass Clerk entirely
if (process.env.MOCK_AUTH !== 'true') {
  // Dynamic import so Clerk is never loaded in mock mode
  // (Clerk throws on startup if keys are missing)
}

export async function middleware(req: NextRequest) {
  if (process.env.MOCK_AUTH === 'true') {
    return NextResponse.next();
  }

  const { clerkMiddleware, createRouteMatcher } = await import('@clerk/nextjs/server');

  const isPublicRoute = createRouteMatcher([
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/api/webhooks/clerk',
  ]);

  return clerkMiddleware(async (auth, request) => {
    if (!isPublicRoute(request)) {
      await auth.protect();
    }
  })(req, {} as never);
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
