import { MessageSchema } from 'src/boot/i18n';

export const enUSEulaDialog: MessageSchema['eulaDialog'] = {
  title: 'Agree Minecraft EULA',
  agree: 'Agree EULA and execute',
  desc: '\
    This server is subject to the terms of {0}.\n\
    Please read before use.',
  eula: 'Minecraft EULA',
  disagree: 'Disagree EULA',
};
