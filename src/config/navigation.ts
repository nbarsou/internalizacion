import {
  LayoutDashboard,
  FileSpreadsheet,
  Building2,
  Users,
  Settings,
} from 'lucide-react';
import type { Permission } from '@/lib/permissions'; // Safe type-only import!
import type { LucideIcon } from 'lucide-react';

export type NavLink = {
  href: string;
  icon: LucideIcon;
  title: string;
  subtitle: string;
  permission: Permission; // Map each link to an RBAC rule
};

export const NAV_LINKS: NavLink[] = [
  {
    href: '/dashboard',
    icon: LayoutDashboard,
    title: 'Panel de Indicadores',
    subtitle: 'Vista general de internacionalización Anáhuac',
    permission: 'read:university', // Basic permission everyone has
  },
  {
    href: '/agreements',
    icon: FileSpreadsheet,
    title: 'Convenios',
    subtitle: 'Gestión de acuerdos internacionales',
    permission: 'read:agreement',
  },
  {
    href: '/universities',
    icon: Building2,
    title: 'Universidades',
    subtitle: 'Catálogo de instituciones aliadas',
    permission: 'read:agreement',
  },
  {
    href: '/users',
    icon: Users,
    title: 'Usuarios',
    subtitle: 'Administración de usuarios y roles',
    permission: 'read:user',
  },
  {
    href: '/settings',
    icon: Settings,
    title: 'Configuración',
    subtitle: 'Administración de referencias',
    permission: 'read:refs', // 👈 Only Admins and Editors will see this!
  },
];
