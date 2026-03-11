// lib/form-utils.ts

export type FormState<TFields extends string = string> = {
  success?: boolean;
  /** Top-level message — DB errors, auth errors, or a success description */
  message?: string;
  /** Field-level Zod validation errors, keyed by field name */
  errors?: Partial<Record<TFields, string[]>>;
  /**
   * When set, the client should navigate here after showing a success toast.
   * Never call redirect() server-side when you need a toast — return this instead.
   *
   * Example: { success: true, redirectTo: '/t/my-tournament-slug' }
   */
  redirectTo?: string;
} | null;
