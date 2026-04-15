import 'server-only';

import { prisma } from '@/lib/prisma';
import { notDeleted } from '@/lib/db-filters';
import type {
  ContactConcernType,
  ContactValueType,
} from '@/generated/prisma/client';

// ── Custom error classes ──────────────────────────────────────────────────────

export class ContactNotFoundError extends Error {}

// ── Read functions ────────────────────────────────────────────────────────────

export async function dbGetContactsByUniversity(universityId: string) {
  return prisma.contact.findMany({
    where: { universityId, ...notDeleted },
    orderBy: [{ concernType: 'asc' }, { valueType: 'asc' }],
  });
}

// ── Write functions ───────────────────────────────────────────────────────────

export type CreateContactData = {
  universityId: string;
  concernType: ContactConcernType;
  valueType: ContactValueType;
  name?: string | null;
  value: string;
};

// Create a new contact entry. (e.g., adding a specific EMAIL for an INCOMING concern)
export async function dbCreateContact(data: CreateContactData) {
  return prisma.contact.create({
    data,
  });
}

export type UpdateContactData = Partial<
  Omit<CreateContactData, 'universityId'>
>;

export async function dbUpdateContact(
  id: string,
  universityId: string,
  data: UpdateContactData
) {
  // We use updateMany scoped to universityId to prevent IDOR vulnerabilities.
  // Even though it targets a unique ID, updateMany allows us to filter by both.
  const result = await prisma.contact.updateMany({
    where: { id, universityId, ...notDeleted },
    data,
  });

  if (result.count === 0) throw new ContactNotFoundError();

  // Return the updated row
  return prisma.contact.findFirstOrThrow({
    where: { id },
  });
}

export async function dbSoftDeleteContact(id: string, universityId: string) {
  // Scope to universityId to prevent IDOR
  const result = await prisma.contact.updateMany({
    where: { id, universityId, ...notDeleted },
    data: { deletedAt: new Date() },
  });

  if (result.count === 0) throw new ContactNotFoundError();
}
