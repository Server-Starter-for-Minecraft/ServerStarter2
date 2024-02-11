import { fixObject } from '../base/fixer/object';
import { fixBoolean, fixString } from '../base/fixer/primitive';

/** Ngrokの設定 */
export type NgrokSetting$1 = {
  use_ngrok: boolean;
  remote_addr?: string;
};

export const defaultNgrokSetting$1: NgrokSetting$1 = {
  use_ngrok: false,
};

export const NgrokSetting$1 = fixObject<NgrokSetting$1>({
  use_ngrok: fixBoolean.default(defaultNgrokSetting$1.use_ngrok),
  remote_addr: fixString.optional(),
});
