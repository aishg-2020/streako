import type { auth as ClerkAuthFn, currentUser as ClerkCurrentUserFn } from '@clerk/nextjs/server';

// Mock values used when MOCK_AUTH=true
const MOCK_USER_ID = 'mock_clerk_id';

type AuthResult = Awaited<ReturnType<typeof ClerkAuthFn>>;

export async function auth(): Promise<AuthResult> {
  if (process.env.MOCK_AUTH === 'true') {
    return {
      userId: MOCK_USER_ID,
      protect: async () => {},
    } as unknown as AuthResult;
  }
  const { auth: clerkAuth } = await import('@clerk/nextjs/server');
  return clerkAuth();
}

type CurrentUserResult = Awaited<ReturnType<typeof ClerkCurrentUserFn>>;

export async function currentUser(): Promise<CurrentUserResult> {
  if (process.env.MOCK_AUTH === 'true') {
    return {
      id: MOCK_USER_ID,
      emailAddresses: [{ emailAddress: 'demo@creator-os.dev' }],
      firstName: 'Demo',
      lastName: 'Creator',
    } as unknown as CurrentUserResult;
  }
  const { currentUser: clerkCurrentUser } = await import('@clerk/nextjs/server');
  return clerkCurrentUser();
}
