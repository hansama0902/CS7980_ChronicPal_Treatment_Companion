import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { LoginSchema } from '@/validators/authValidator';
import { checkLoginRateLimit } from '@/lib/rateLimit';

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: 'jwt' },
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = LoginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { allowed } = checkLoginRateLimit(parsed.data.email);
        if (!allowed) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        });

        const passwordMatch = user
          ? await bcrypt.compare(parsed.data.password, user.passwordHash)
          : false;

        if (!user || !passwordMatch) return null;

        return { id: user.id, email: user.email, role: user.role };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = (token.role as string) ?? 'PATIENT';
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
});
