import { MessageSchema } from "src/boot/i18n";

export const enUSConsole:MessageSchema['console'] = {
  init: 'Booting ServerStarter2...',
  boot: 'BOOT {name}',
  booting: 'Booting {id} ({type})/{name}',
  abnormalEnd:'Terminated abnormally',
  stop: {
    btn: 'close',
    withName: 'CLOSE {name}',
    progress: 'closing',
    progressWithName: 'Working on closing {name}'
  },
  reboot: {
    btn: 'reboot',
    progress: 'rebooting',
    progressWithName: 'Working on rebooting {name}'
  },
  status: {
    Stop: 'Stop',
    Ready: 'Ready',
    Running: 'Running',
    CheckLog: 'Checking Log'
  },
  shutdownServer: 'Shutdowning server',
  command: 'Command',
}