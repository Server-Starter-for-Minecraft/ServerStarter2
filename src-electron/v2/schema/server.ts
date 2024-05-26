import { z } from 'zod';

export type Server = {
  command: {
    process: string;
    args: string[];
  };
};

export const serverValidator: z.ZodSchema<Server> = z.object({
  command: z.object({
    process: z.string(),
    args: z.array(z.string()),
  }),
});
