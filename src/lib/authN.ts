import 'server-only';
import { cache } from 'react';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth'; // Your Better-Auth client

// 1. Memoize the session check (Performance)
export const verifySession = cache(async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // 2. Global Security Gate (Auth)
  if (!session?.user) {
    redirect('/');
  }

  // 3. Return only what is needed (DTO-ish)
  return { isAuth: true, userId: session.user.id, user: session.user };
});
