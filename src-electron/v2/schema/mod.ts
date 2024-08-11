import { z } from 'zod';

export const Mod = z.object({
  name: z.string(),
  description: z.string(),
  hash: z.string(),
});
export type Mod = z.infer<typeof Mod>;
