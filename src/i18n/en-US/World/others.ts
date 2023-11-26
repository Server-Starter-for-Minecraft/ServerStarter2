import { MessageSchema } from 'src/boot/i18n';

export const enOthers: MessageSchema['others'] = {
  backup: {
    backupDesc: '\
      Make backup of this world<br>\
      Backed-up world data can be accessed from "Recover from Backup"',
    makeBackup : 'Make backup',
    recoverFromBackup: 'Recover from backup',
    madeBackup: 'Made backup of {world}',
    recovered: 'FInish world recovering',
  },
}