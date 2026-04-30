// lib/schemas.ts

import { z } from 'zod';

export const slugSchema = z
  .string()
  .min(1, 'URL inválida')
  .max(60) // 55 base + '-xxxx' nanoid suffix
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'URL inválida');
