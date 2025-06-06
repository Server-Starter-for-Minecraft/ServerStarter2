import { MessageSchema } from 'src/boot/i18n';

export const enUSConsole: MessageSchema['console'] = {
  init: 'Booting ServerStarter2...',
  boot: 'BOOT {0}{1}',
  booting: 'Booting {id} ({type})/{name}',
  abnormalEnd: 'Terminated abnormally',
  showLog: 'Show the previous server log',
  stop: {
    btn: 'close',
    withName: 'CLOSE {0}{1}',
    progress: 'closing',
    progressWithName: 'Working on closing {0}{1}',
  },
  reboot: {
    btn: 'reboot',
    progress: 'rebooting',
    progressWithName: 'Working on rebooting {0}{1}',
  },
  status: {
    Stop: 'Stop',
    Ready: 'Ready',
    Running: 'Running',
    CheckLog: 'Checking Log',
  },
  shutdownServer: 'Shutdowning server',
  command: 'Command',
  search: {
    btn: 'Search in console',
    placeholder: 'Search in console',
    noMatches: 'No matches',
    matchCount: '{current} of {total}',
  },
  toolBtn: 'Tools',
  appearance: 'Appearance',
};
