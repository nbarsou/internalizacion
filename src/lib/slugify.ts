// src/lib/slugify.ts
const SLUG_BASE_MAX = 55;

export function toSlug(input: string): string {
  return input
    .toString()
    .normalize('NFD') // decompose accented characters
    .replace(/[\u0300-\u036f]/g, '') // strip accent marks
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // keep only letters, numbers, space, hyphen
    .replace(/[\s-]+/g, '-') // collapse spaces & multiple hyphens
    .replace(/^-+|-+$/g, '') // trim leading/trailing hyphens
    .slice(0, SLUG_BASE_MAX); // enforce max length
}
