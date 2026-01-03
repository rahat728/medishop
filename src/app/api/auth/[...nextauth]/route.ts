import NextAuth from 'next-auth'; // Re-trigger build
import { authOptions } from '@/lib/auth/options';

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
