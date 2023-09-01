import { Locale } from 'app/src-electron/schema/system';

export type UpdateTranslation = {
  main: string;
  mac_pass: string;
};

export const updateMessage: Record<Locale, UpdateTranslation> = {
  'en-US': {
    main: 'updating ServerStarter2...',
    mac_pass: 'please enter device password to update ServerStarter2',
  },
  ja: {
    main: 'ServerStarter2をアップデートしています...',
    mac_pass: 'ServerStarter2をアップデートするために端末のパスワードを入力してください',
  },
};
