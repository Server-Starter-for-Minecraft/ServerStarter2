import { MessageSchema } from "src/boot/i18n";

export const enUSUtils: MessageSchema['utils'] = {
  bugReport: {
    title: 'Sorry to inconvenience you',
    desc: '\
      If this error occurs frequently, please report the error using the "Bug Report" link below.<br>\
      If you need an urgent response, please contact the author, CivilTT, via Twitter.',
    cause: '【Cause of Error】',
    reportBtn: 'Bug report',
    contact: 'Contact to author',
    close: 'close',
  },
  errorDialog: {
    failToGetOwner: 'Failed to get owner player',
    failOPForOwner: 'Failed to register owner player to OP list',
    failToSaveExistedWorld: 'Failed to save existed world',
    failSync: 'Failed to sync with ShareWorld',
    failGetShareWorld: 'Failed to get ShareWorld',
    recoverFail: 'Failed to recover world from backup data',
  }
};
