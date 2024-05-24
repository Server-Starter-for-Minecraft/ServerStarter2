import { MessageSchema } from 'src/boot/i18n';

export const enAutoShutdown: MessageSchema['autoshutdown'] = {
  title: 'Auto shutdown',
  desc: '\
    Shutdown this pc after {time} sec.\n\
    If canceled, it will not shutdown.',
  cancel: 'Cancel',
  ok: 'OK (shutdown after {time} sec.)',
};
