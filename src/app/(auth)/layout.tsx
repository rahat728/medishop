import { redirect } from 'next/navigation';
import { getSession, getRedirectPath } from '@/lib/auth';

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check if user is already logged in
  const session = await getSession();

  if (session?.user) {
    // Redirect to appropriate dashboard based on role
    redirect(getRedirectPath(session.user.role));
  }

  return <>{children}</>;
}
