import { z } from 'zod';

/** Ngrokの設定 */
export const NgrokSetting = z.object({
  use_ngrok: z.boolean(),
  remote_addr: z.string().optional(),
});
export type NgrokSetting = z.infer<typeof NgrokSetting>;
