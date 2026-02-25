'use client';

import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Globe } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/auth-client';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleGoogleLogin = async () => {
    setIsLoading(true);

    // 2. Create the promise for Better Auth
    const promise = authClient.signIn.social({
      provider: 'google',
      callbackURL: '/dashboard', // Where to go after login
    });

    // 3. Wrap it in the Sonner toast
    toast.promise(promise, {
      loading: 'Conectando con Google...',
      success: () => {
        // Better Auth handles the redirect, but we can stop the spinner
        // We don't set isLoading(false) here immediately because the page will reload/redirect
        return '¡Redirigiendo...';
      },
      error: (err) => {
        setIsLoading(false);
        console.error(err);
        return 'Error al iniciar sesión. Intente nuevamente';
      },
    });
  };

  return (
    <div className="min-h-screen w-full lg:grid lg:grid-cols-2">
      {/* --- LEFT COLUMN: The Form --- */}
      <div className="bg-background relative flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        {/* LOGO: Top Left Corner */}
        <div className="absolute top-8 left-8 md:top-10 md:left-10">
          <Link
            href="/"
            className="flex items-center gap-2 transition-opacity hover:opacity-80"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-600 text-white">
              <Globe className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight">
              Anáhuac Internacional
            </span>
          </Link>
        </div>

        {/* CENTERED CONTENT */}
        <div className="mx-auto grid w-full max-w-87.5 gap-6">
          <div className="flex flex-col gap-2 text-center">
            <h1 className="text-3xl font-bold tracking-tight">
              Portal de Convenios
            </h1>
            <p className="text-muted-foreground text-balance">
              Ingresa con tu cuenta institucional para consultar la oferta
              académica internacional.
            </p>
          </div>

          <div className="grid gap-4">
            <Button
              variant="outline"
              className="relative h-12 w-full text-base font-normal transition-colors hover:border-orange-200 hover:bg-orange-50 hover:text-orange-900"
              onClick={handleGoogleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <svg
                  className="mr-2 h-4 w-4"
                  aria-hidden="true"
                  focusable="false"
                  data-prefix="fab"
                  data-icon="google"
                  role="img"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 488 512"
                >
                  <path
                    fill="currentColor"
                    d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
                  ></path>
                </svg>
              )}
              Acceder con Google Institucional
            </Button>

            <div className="text-muted-foreground px-4 text-center text-xs">
              Disponible para campus México, Sur y Norte. Al continuar, aceptas
              el{' '}
              <Link
                href="/terms"
                className="hover:text-primary underline underline-offset-4"
              >
                Reglamento de Intercambios
              </Link>{' '}
              y{' '}
              <Link
                href="/privacy"
                className="hover:text-primary underline underline-offset-4"
              >
                Aviso de Privacidad
              </Link>
              .
            </div>
          </div>
        </div>
      </div>

      {/* --- RIGHT COLUMN: The Image --- */}
      <div className="relative hidden overflow-hidden bg-orange-950 lg:block">
        {/* Dark overlay for text readability - using orange tint */}
        <div className="absolute inset-0 z-10 bg-orange-950/60 mix-blend-multiply" />

        {/* The University Architecture Image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1562774053-701939374585?q=80&w=2686&auto=format&fit=crop')",
          }}
        />

        {/* Quote/Testimonial Area */}
        <div className="relative z-20 flex h-full flex-col justify-end p-12 text-white">
          <blockquote className="max-w-lg space-y-4">
            <p className="text-xl leading-relaxed font-medium drop-shadow-md">
              &ldquo;La internacionalización no es solo viajar; es expandir tu
              visión profesional y humana en las mejores universidades del
              mundo.&rdquo;
            </p>
            <footer className="border-l-2 border-orange-500 pl-4 text-base font-medium opacity-90 drop-shadow-sm">
              Dirección de Internacionalización
              <span className="mt-1 block text-sm font-normal opacity-75">
                Red de Universidades Anáhuac
              </span>
            </footer>
          </blockquote>
        </div>
      </div>
    </div>
  );
}
