'use client';

import { usePathname } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useSignOut } from '@/features/auth/hooks/use-sign-out';

// Map paths to titles so the header updates automatically
const PAGE_TITLES = {
  '/dashboard': {
    title: 'Panel de Indicadores',
    subtitle: 'Vista general de internacionalización Anáhuac',
  },
  '/agreements': {
    title: 'Convenios',
    subtitle: 'Gestión de acuerdos internacionales',
  },
  '/universities': {
    title: 'Universidades',
    subtitle: 'Catálogo de instituciones aliadas',
  },
};

export function AppHeader() {
  const pathname = usePathname();

  const { signOut } = useSignOut();

  // Default to dashboard info if path not found, or handle logic as needed
  const currentInfo =
    PAGE_TITLES[pathname as keyof typeof PAGE_TITLES] ||
    PAGE_TITLES['/dashboard'];

  return (
    <header className="bg-background sticky top-0 z-30 flex h-14 items-center gap-4 border-b px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      <div className="flex flex-col">
        <h1 className="text-xl font-semibold tracking-tight">
          {currentInfo.title}
        </h1>
        <p className="text-muted-foreground text-xs">{currentInfo.subtitle}</p>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="icon" className="rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/placeholder-user.png" />
                <AvatarFallback>AD</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={signOut}
              className="text-destructive focus:text-destructive cursor-pointer"
            >
              Cerrar Sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
