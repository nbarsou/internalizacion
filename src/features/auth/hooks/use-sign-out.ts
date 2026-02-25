// src/features/auth/hooks/use-sign-out.ts
'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { authClient } from '@/lib/auth-client';

type UseSignOutOptions = {
  /** Where to redirect after a successful sign-out. Defaults to "/login" */
  redirectTo?: string;
};

/**
 * Returns a `signOut` function that:
 * - Shows a loading → success / error toast sequence
 * - Redirects on success
 *
 * Usage anywhere in the client tree:
 *   const { signOut } = useSignOut();
 *   <button onClick={signOut}>Cerrar sesión</button>
 */
export function useSignOut({ redirectTo = '/' }: UseSignOutOptions = {}) {
  const router = useRouter();

  const signOut = () => {
    toast.promise(
      authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            router.push(redirectTo);
          },
        },
      }),
      {
        loading: 'Cerrando sesión...',
        success: 'Sesión cerrada',
        error: 'Error al cerrar sesión',
      }
    );
  };

  return { signOut };
}
