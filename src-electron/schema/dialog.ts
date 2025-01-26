import { z } from 'zod';

/** フォルダ選択ダイアログ等の標準ダイアログのための型定義 */
export const DialogOptions = z.object({
  title: z.string().optional(),
  defaultPath: z.string().optional(),
  /**
   * Custom label for the confirmation button, when left empty the default label will
   * be used.
   */
  buttonLabel: z.string().optional(),
  /**
   * Message to display above input boxes.
   *
   * @platform darwin
   */
  message: z.string().optional(),
});

export type DialogOptions = z.infer<typeof DialogOptions>;
