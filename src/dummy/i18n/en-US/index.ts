// This is just an example,
// so you can safely delete all default props below

import { ErrorTranslationTypes } from 'app/src-electron/util/error/schema';

type iTranslate = {
  failed: string;
  success: string;
  error: ErrorTranslationTypes;
};

export const enUS: iTranslate = {
  failed: 'Action failed',
  success: 'Action was successful',
  error: {
    system: { runtime: 'Error', ipc: 'a', subprocess: 'c' },
    data: {},
  },
};
