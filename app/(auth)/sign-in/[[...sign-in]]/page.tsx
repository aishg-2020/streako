import { redirect } from 'next/navigation';
import { Flex } from 'antd';

export default async function SignInPage() {
  // In mock mode skip the Clerk UI — the user is always "logged in"
  if (process.env.MOCK_AUTH === 'true') {
    redirect('/dashboard');
  }

  // Lazy import so Clerk is never loaded without real keys
  const { SignIn } = await import('@clerk/nextjs');
  return (
    <Flex align="center" justify="center" style={{ minHeight: '100vh' }}>
      <SignIn />
    </Flex>
  );
}
