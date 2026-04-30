import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { createAuthMiddleware } from 'better-auth/api';
import { prisma } from '@/lib/prisma';
import { nextCookies } from 'better-auth/next-js';
import { dbAcceptPendingInvite } from '@/features/invites/db';

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  socialProviders: {
    google: {
      prompt: 'select_account',
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  hooks: {
    // Single function, not an array — branch on ctx.path inside
    after: createAuthMiddleware(async (ctx) => {
      // Social OAuth completes at /callback/:id, not /sign-in/social
      // newSession is available here, not on the sign-in path
      if (ctx.path.startsWith('/callback/') && ctx.context.newSession) {
        const { email, id } = ctx.context.newSession.user;
        await dbAcceptPendingInvite(email, id);
      }
    }),
  },
  user: {
    modelName: 'user',
    additionalFields: {
      role: {
        type: 'string',
        required: false,
        defaultValue: 'WAITLISTED', // ← string literal, not Role enum value
        input: false,
      },
      isSuperuser: {
        type: 'boolean',
        required: false,
        defaultValue: false,
        input: false,
      },
      permissionExpiresAt: {
        type: 'string', // DateTime stored as ISO string
        required: false,
        defaultValue: null,
        input: false,
      },
    },
  },
  plugins: [nextCookies()],
});
