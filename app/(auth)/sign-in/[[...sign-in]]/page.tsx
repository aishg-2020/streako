import { redirect } from 'next/navigation';

export default function SignInPage() {
  // In mock mode skip the Clerk UI — the user is always "logged in"
  if (process.env.MOCK_AUTH === 'true') {
    redirect('/dashboard');
  }

  // Lazy import so Clerk is never loaded without real keys
  const { SignIn } = require('@clerk/nextjs');
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <SignIn />
    </div>
  );
}
