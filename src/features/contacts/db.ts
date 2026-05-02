import 'server-only';

import { prisma } from '@/lib/prisma';
import { ContactInput } from './schemas';

// ── Custom error classes ──────────────────────────────────────────────────────

export class UniversityNotFoundError extends Error {}
export class ContactNotFoundError extends Error {}

// ── Create ────────────────────────────────────────────────────────────────

export async function dbCreateContact(slug: string, data: ContactInput) {
  const university = await prisma.university.findUnique({
    where: { slug },
  });

  if (!university) throw new UniversityNotFoundError();

  return await prisma.contact.create({
    data: {
      universityId: university.id,
      name: data.name,
      concernType: data.concernType,
      valueType: data.valueType,
      value: data.value,
    },
  });
}

// ── Read ────────────────────────────────────────────────────────────

export async function dbGetContactsByUniversity(universityId: string) {
  return await prisma.contact.findMany({
    where: { universityId },
    select: {
      id: true,
      name: true,
      concernType: true,
      valueType: true,
      value: true,
    },
    orderBy: [{ concernType: 'asc' }, { valueType: 'asc' }],
  });
}

// The entire array (List of contacts)
export type ContactsDTO = Awaited<ReturnType<typeof dbGetContactsByUniversity>>;

// A single item from the array (Single contact)
export type ContactDTO = ContactsDTO[number];

// ── Update ────────────────────────────────────────────────────────────────

export async function dbUpdateContact(
  id: string,
  slug: string,
  data: ContactInput
) {
  const university = await prisma.university.findUnique({
    where: { slug },
  });

  if (!university) throw new UniversityNotFoundError();

  const result = await prisma.contact.updateMany({
    where: { id, universityId: university.id },
    data,
  });

  if (result.count === 0) throw new ContactNotFoundError();
}

// ── Delete ────────────────────────────────────────────────────────────────

export async function dbDeleteContact(id: string) {
  const result = await prisma.contact.deleteMany({
    where: { id },
  });

  if (result.count === 0) throw new ContactNotFoundError();
}
