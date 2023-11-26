import { MessageSchema } from "src/boot/i18n";

export const enUSBugReport: MessageSchema['bugReport'] = {
  title: 'Sorry to inconvenience you',
  desc: '\
    If this error occurs frequently, please report the error using the "Bug Report" link below.<br>\
    If you need an urgent response, please contact the author, CivilTT, via Twitter.',
  cause: '【Cause of Error】',
  reportBtn: 'Bug report',
  contact: 'Contact to author',
  close: 'close',
};
