import { redirect } from 'next/navigation';
import { getSession, getRedirectPath } from '@/lib/auth';

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check if user is already logged in
  const session = await getSession();
  console.log('🔐 [AuthLayout] Session:', session ? `Found (${session.user?.email}, role: ${session.user?.role})` : 'NULL');

  if (session?.user) {
    const redirectPath = getRedirectPath(session.user.role);
    console.log(`🚀 [AuthLayout] Already logged in as ${session.user.role}, redirecting to: ${redirectPath}`);
    redirect(redirectPath);
  }

  return <>{children}</>;
}
