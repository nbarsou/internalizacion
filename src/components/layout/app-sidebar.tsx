'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useSignOut } from '@/features/auth/hooks/use-sign-out';
import { NAV_LINKS } from '@/config/navigation';
import type { Permission } from '@/lib/permissions';

// Add the user object to your expected props
interface AppSidebarProps {
  can: Record<Permission, boolean>;
  user: {
    name: string;
    email: string;
    image?: string | null;
  };
}

export function AppSidebar({ can, user }: AppSidebarProps) {
  const pathname = usePathname();
  const { signOut } = useSignOut();

  const isActive = (path: string) =>
    pathname === path || pathname.startsWith(`${path}/`);

  const allowedLinks = NAV_LINKS.filter((link) => can[link.permission]);

  // Quick helper to get initials for the fallback (e.g., "Juan Perez" -> "JP")
  const getInitials = (name: string) => {
    return (
      name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase() || 'U'
    );
  };

  return (
    <aside className="bg-background fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r sm:flex">
      <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
        {/* Tooltip wrapping the Avatar */}
        <TooltipProvider>
          <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.image || undefined} alt={user.name} />
                <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent side="right" className="flex flex-col gap-1">
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-muted-foreground text-xs">{user.email}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <div className="bg-border h-px w-full" />

        {allowedLinks.map((link) => {
          const Icon = link.icon;
          return (
            <TooltipProvider key={link.href}>
              <Tooltip delayDuration={200}>
                <TooltipTrigger asChild>
                  <Link href={link.href}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`rounded-lg transition-colors ${
                        isActive(link.href)
                          ? 'bg-muted text-primary'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                      aria-label={link.title}
                    >
                      <Icon className="size-5" />
                    </Button>
                  </Link>
                </TooltipTrigger>
                {/* Optional: Add tooltips to your nav links too! */}
                <TooltipContent side="right">{link.title}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </nav>

      <nav className="mt-auto flex flex-col items-center gap-4 px-2 sm:py-5">
        <TooltipProvider>
          <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={signOut}
                className="text-muted-foreground hover:text-destructive rounded-lg transition-colors"
                aria-label="Logout"
              >
                <LogOut className="size-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Cerrar Sesión</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </nav>
    </aside>
  );
}
