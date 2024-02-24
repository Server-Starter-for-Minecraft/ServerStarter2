import { MessageSchema } from 'src/boot/i18n';

export const enUSConsole: MessageSchema['console'] = {
  init: 'Booting ServerStarter2...',
  boot: 'BOOT &nbsp; <span class="text-omit col">{name}</span>',
  booting: 'Booting {id} ({type})/{name}',
  abnormalEnd: 'Terminated abnormally',
  showLog: 'Show the previous server log',
  stop: {
    btn: 'close',
    withName: 'CLOSE &nbsp; <span class="text-omit col">{name}</span>',
    progress: 'closing',
    progressWithName:
      'Working on closing &nbsp; <span class="text-omit col">{name}</span>',
  },
  reboot: {
    btn: 'reboot',
    progress: 'rebooting',
    progressWithName:
      'Working on rebooting &nbsp; <span class="text-omit col">{name}</span>',
  },
  status: {
    Stop: 'Stop',
    Ready: 'Ready',
    Running: 'Running',
    CheckLog: 'Checking Log',
  },
  shutdownServer: 'Shutdowning server',
  command: 'Command',
};
