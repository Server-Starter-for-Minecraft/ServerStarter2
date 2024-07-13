import { z } from 'zod';

export const Plugin = z.object({
  name: z.string(),
  description: z.string(),
  hash: z.string(),
});

export type Plugin = z.infer<typeof Plugin>;
