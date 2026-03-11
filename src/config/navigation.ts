import {
  LayoutDashboard,
  FileSpreadsheet,
  Building2,
  Users,
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
    permission: 'university:view', // Basic permission everyone has
  },
  {
    href: '/agreements',
    icon: FileSpreadsheet,
    title: 'Convenios',
    subtitle: 'Gestión de acuerdos internacionales',
    permission: 'agreement:view',
  },
  {
    href: '/universities',
    icon: Building2,
    title: 'Universidades',
    subtitle: 'Catálogo de instituciones aliadas',
    permission: 'university:view',
  },
  {
    href: '/users',
    icon: Users,
    title: 'Usuarios',
    subtitle: 'Administración de usuarios y roles',
    permission: 'member:view', // 👈 Only Admins and Editors will see this!
  },
];
