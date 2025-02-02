import { z } from 'zod';

/** Ngrokの設定 */
export const NgrokSetting = z
  .object({
    use_ngrok: z.boolean().default(false),
    remote_addr: z.string().optional(),
  })
  .default({});
export type NgrokSetting = z.infer<typeof NgrokSetting>;
