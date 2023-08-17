import { MessageSchema } from "src/boot/i18n";

export const enUSConsole:MessageSchema['console'] = {
  init: 'Booting ServerStarter2...',
  boot: 'BOOT {name}',
  booting: 'Booting {name}',
  abnormalEnd:'Terminated abnormally',
  stop: 'stop',
  reboot: 'reboot',
}