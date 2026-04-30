// lib/form-utils.ts

export type FormState<TFields extends string = string> =
  | {
      /** Zod field-level validation failed. Errors shown inline; no toast. */
      type: 'validation';
      errors: Partial<Record<TFields, string[]>>;
    }
  | {
      /** Action ran but failed — auth, DB, or business logic error. */
      type: 'error';
      message: string; // required — always tell the user what happened
    }
  | {
      /** Action succeeded. */
      type: 'success';
      message?: string; // optional — redirect actions have no message
    }
  | null; // initial state — nothing has happened yet
