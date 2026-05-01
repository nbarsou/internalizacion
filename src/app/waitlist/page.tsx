// app/waitlist/page.tsx
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { Role } from '@/generated/prisma/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { WaitlistSignOut } from '@/features/auth/components/waitlist-sign-out';

export default async function WaitlistPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  // Not logged in at all
  if (!session) redirect('/');

  // Has a real role — send them to the app
  // (don't use verifySession here — it would create a redirect loop)
  if (session.user.role !== Role.WAITLISTED) redirect('/dashboard');

  const user = session.user;

  return (
    // changed: bg-gray-50 -> bg-background
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md text-center shadow-lg">
        <CardHeader>
          {/* changed: text-gray-900 -> text-foreground */}
          <CardTitle className="text-foreground text-2xl font-bold">
            ¡Estás en la lista!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4 text-left">
            {/* changed: text-gray-700 -> text-foreground */}
            <p className="text-foreground text-lg">
              Hola{' '}
              <span className="text-primary font-semibold">{user.name}</span>,
            </p>
            {/* changed: text-gray-600 -> text-muted-foreground */}
            <p className="text-muted-foreground leading-relaxed">
              Estamos construyendo esto con mucha dedicación. ¡Muchas gracias
              por tu interés!
            </p>
            <p className="text-muted-foreground leading-relaxed">
              En cuanto esté listo, te mandaremos un correo para que lo puedas
              probar.
            </p>
          </div>

          <div className="border-border border-t pt-4">
            {/* changed: text-gray-400 -> text-muted-foreground/60 */}
            <p className="text-muted-foreground/60 mb-4 text-xs">
              ¿Quieres usar otra cuenta?
            </p>

            {/* The Client Component handles the logic securely */}
            <WaitlistSignOut />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
