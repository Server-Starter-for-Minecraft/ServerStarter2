import { MessageSchema } from "src/boot/i18n";

export const enUSConsole:MessageSchema['console'] = {
  init: 'Booting ServerStarter2...',
  boot: 'BOOT {name}',
  booting: 'Booting {id} ({type})/{name}',
  abnormalEnd:'Terminated abnormally',
  stop: 'stop',
  reboot: 'reboot',
  status: {
    Stop: 'Stop',
    Ready: 'Ready',
    Running: 'Running',
  },
  shutdownServer: 'Shutdowning server',
  command: 'Command',
}