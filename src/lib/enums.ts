// src/lib/enums.ts
/* eslint-disable @typescript-eslint/no-unused-vars */
// Values and labels must stay in sync with schema.prisma enums.
// The checks below will error at compile time if they drift.

import type { Role as PrismaRole } from '@/generated/prisma/client';
import type { ContactConcernType as PrismaContactConcernType } from '@/generated/prisma/client';
import type { ContactValueType as PrismaContactValueType } from '@/generated/prisma/client';

type StrictEqual<X, Y> =
  (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2
    ? true
    : false;

type Assert<T extends true> = T;

export const ROLE_OPTIONS = [
  'ADMIN',
  'EDITOR',
  'VIEWER',
  'WAITLISTED',
] as const;
export type Role = (typeof ROLE_OPTIONS)[number];
export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Administrador',
  EDITOR: 'Editor',
  VIEWER: 'Lector',
  WAITLISTED: 'Lista de Espera',
};
type _RoleCheck = Assert<StrictEqual<Role, PrismaRole>>;

export const CONTACT_CONCERN_OPTIONS = [
  'INCOMING',
  'OUTGOING',
  'GENERAL',
] as const;
export type ContactConcern = (typeof CONTACT_CONCERN_OPTIONS)[number];
export const CONTACT_CONCERN_LABELS: Record<ContactConcern, string> = {
  INCOMING: 'Entrante',
  OUTGOING: 'Saliente',
  GENERAL: 'General',
};
type _ContactConcernCheck = Assert<
  StrictEqual<ContactConcern, PrismaContactConcernType>
>;

export const CONTACT_VALUE_OPTIONS = ['EMAIL', 'PHONE'] as const;
export type ContactValue = (typeof CONTACT_VALUE_OPTIONS)[number];
export const CONTACT_VALUE_LABELS: Record<ContactValue, string> = {
  EMAIL: 'Correo Electrónico',
  PHONE: 'Número de Telefono',
};
type _ContactValueCheck = Assert<
  StrictEqual<ContactValue, PrismaContactValueType>
>;
