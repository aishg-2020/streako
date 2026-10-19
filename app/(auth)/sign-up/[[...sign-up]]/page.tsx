import { redirect } from 'next/navigation';
import { Flex } from 'antd';

export default async function SignUpPage() {
  if (process.env.MOCK_AUTH === 'true') {
    redirect('/dashboard');
  }

  const { SignUp } = await import('@clerk/nextjs');
  return (
    <Flex align="center" justify="center" style={{ minHeight: '100vh' }}>
      <SignUp />
    </Flex>
  );
}
