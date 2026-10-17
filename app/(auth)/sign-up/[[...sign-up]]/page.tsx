import { redirect } from 'next/navigation';

export default function SignUpPage() {
  if (process.env.MOCK_AUTH === 'true') {
    redirect('/dashboard');
  }

  const { SignUp } = require('@clerk/nextjs');
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <SignUp />
    </div>
  );
}
