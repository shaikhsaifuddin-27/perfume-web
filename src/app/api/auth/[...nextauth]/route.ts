import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { verifyMfaToken } from '@/lib/mfa';
import { checkLockout, recordFailedAttempt, resetFailedAttempts } from '@/lib/authLockout';
import { verifySignature } from '@/lib/webauthn';
import { headers } from 'next/headers';

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().optional(),
  mfaCode: z.string().optional(),
  type: z.string().optional(),
  credentialId: z.string().optional(),
  signature: z.string().optional(),
});

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days default
  },
  pages: {
    signIn: '/account',
    error: '/account',
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const reqHeaders = await headers();
        const forwarded = reqHeaders.get('x-forwarded-for');
        const ip = forwarded?.split(',')[0]?.trim() ?? reqHeaders.get('x-real-ip') ?? '127.0.0.1';

        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) {
          throw new Error('Invalid input');
        }

        const { email, password, mfaCode, type, credentialId, signature } = parsed.data;

        // Check lockout status
        const lockoutStatus = await checkLockout(email, ip);
        if (lockoutStatus.locked) {
          throw new Error(lockoutStatus.reason ?? 'Account is temporarily locked.');
        }

        const normalizedEmail = email.toLowerCase().trim();

        // Passkey Flow
        if (type === 'passkey') {
          if (!credentialId || !signature) {
            throw new Error('Missing passkey credentials');
          }

          let storedChallenge = null;
          const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
          const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
          if (redisUrl && redisToken) {
            const res = await fetch(`${redisUrl}`, {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${redisToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(['GET', `webauthn:login-challenge:${normalizedEmail}`]),
            });
            if (res.ok) {
              const data = await res.json();
              storedChallenge = data?.result;
            }
          }

          if (!storedChallenge) {
            throw new Error('Passkey challenge expired or missing. Please try again.');
          }

          const passkey = await prisma.passkey.findUnique({
            where: { credentialId },
            include: { user: true },
          });

          if (!passkey || passkey.user.email !== normalizedEmail) {
            throw new Error('Invalid passkey credential.');
          }

          const isSignatureValid = verifySignature(passkey.publicKey, storedChallenge, signature);
          if (!isSignatureValid) {
            const lockoutInfo = await recordFailedAttempt(email, ip);
            await new Promise((resolve) => setTimeout(resolve, lockoutInfo.delayMs));
            throw new Error('Passkey signature verification failed.');
          }

          // Reset failed attempts on success
          await resetFailedAttempts(email, ip);

          // Cleanup challenge
          if (redisUrl && redisToken) {
            await fetch(`${redisUrl}`, {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${redisToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(['DEL', `webauthn:login-challenge:${normalizedEmail}`]),
            });
          }

          return {
            id: passkey.user.id,
            email: passkey.user.email,
            name: passkey.user.name,
            role: passkey.user.role,
            mfaEnabled: passkey.user.mfaEnabled,
          };
        }

        // Standard Password Flow
        if (!password) {
          throw new Error('Password is required');
        }

        const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

        if (!user || !user.password) {
          await bcrypt.compare('dummy', '$2a$10$dummyhashtopreventtimingattacks');
          const lockoutInfo = await recordFailedAttempt(email, ip);
          await new Promise((resolve) => setTimeout(resolve, lockoutInfo.delayMs));
          throw new Error('Invalid credentials');
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
          const lockoutInfo = await recordFailedAttempt(email, ip);
          await new Promise((resolve) => setTimeout(resolve, lockoutInfo.delayMs));
          throw new Error('Invalid credentials');
        }

        if (user.mfaEnabled) {
          if (!mfaCode || !user.mfaSecret || !verifyMfaToken(mfaCode, user.mfaSecret)) {
            throw new Error('Invalid MFA code');
          }
        }

        await resetFailedAttempts(email, ip);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          mfaEnabled: user.mfaEnabled,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.mfaEnabled = user.mfaEnabled;
        token.createdAt = Date.now();
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.mfaEnabled = token.mfaEnabled;

        // Privileged roles session limited to 4 hours
        if (token.role && token.role !== 'USER') {
          const createdAt = (token.createdAt as number) || 0;
          const fourHoursMs = 4 * 60 * 60 * 1000;
          if (Date.now() - createdAt > fourHoursMs) {
            // Return null to signal NextAuth that the session is expired.
            // Never return { user: undefined } — it makes session truthy on
            // the client while session.user is undefined, causing crashes.
            return null as unknown as typeof session;
          }
        }
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
