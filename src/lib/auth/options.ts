import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import connectDB from '@/lib/db/mongoose';
import { User } from '@/lib/db/models';

// =============================================================================
// NextAuth Configuration
// =============================================================================

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        try {
          await connectDB();

          // Find user with password field included
          const user = await User.findOne({
            email: credentials.email.toLowerCase()
          }).select('+password');

          if (!user) {
            throw new Error('No account found with this email');
          }

          if (!user.isActive) {
            throw new Error('Your account has been deactivated');
          }

          // Verify password
          const isPasswordValid = await user.comparePassword(credentials.password);

          if (!isPasswordValid) {
            throw new Error('Invalid password');
          }

          // Return user object (without password)
          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
          };
        } catch (error: any) {
          console.error('Auth error:', error);
          throw new Error(error.message || 'Authentication failed');
        }
      },
    }),
  ],

  // =============================================================================
  // Session Configuration
  // =============================================================================
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },

  // =============================================================================
  // JWT Configuration
  // =============================================================================
  jwt: {
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },

  // =============================================================================
  // Pages
  // =============================================================================
  pages: {
    signIn: '/login',
    error: '/login',
  },

  // =============================================================================
  // Callbacks
  // =============================================================================
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }

      // Handle session update
      if (trigger === 'update' && session) {
        token.name = session.name;
      }

      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },

    async redirect({ url, baseUrl }) {
      // Allow relative URLs
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }
      // Allow URLs on the same origin
      if (new URL(url).origin === baseUrl) {
        return url;
      }
      return baseUrl;
    },
  },

  // =============================================================================
  // Events
  // =============================================================================
  events: {
    async signIn({ user }) {
      console.log(`✅ User signed in: ${user.email}`);
    },
    async signOut({ token }) {
      console.log(`👋 User signed out: ${token?.email}`);
    },
  },

  // =============================================================================
  // Debug (disable in production)
  // =============================================================================
  debug: process.env.NODE_ENV === 'development',
};
