import { z } from 'zod';

export const MemoryUnit = z.enum([
  'B',
  'KB',
  'MB',
  'GB',
  'TB',
  '',
  'K',
  'M',
  'G',
  'T',
]);
export type MemoryUnit = z.infer<typeof MemoryUnit>;

export const MemorySettings = z
  .object({
    size: z.number().default(2),
    unit: MemoryUnit.default('GB'),
  })
  .default({});
export type MemorySettings = z.infer<typeof MemorySettings>;
