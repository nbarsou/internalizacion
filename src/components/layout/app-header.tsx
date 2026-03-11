'use client';

import { usePathname } from 'next/navigation';
import { NAV_LINKS } from '@/config/navigation'; // Adjust path if needed

export function AppHeader() {
  const pathname = usePathname();

  // Find the matching config for the current route, or default to the first one (Dashboard)
  const currentInfo =
    NAV_LINKS.find(
      (link) => pathname === link.href || pathname.startsWith(`${link.href}/`)
    ) || NAV_LINKS[0];

  return (
    <header className="bg-background sticky top-0 z-30 flex h-14 items-center gap-4 border-b px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      <div className="flex flex-col">
        <h1 className="text-xl font-semibold tracking-tight">
          {currentInfo.title}
        </h1>
        <p className="text-muted-foreground text-xs">{currentInfo.subtitle}</p>
      </div>
    </header>
  );
}
