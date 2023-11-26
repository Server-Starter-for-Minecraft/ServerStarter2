import { MessageSchema } from "src/boot/i18n";

export const enRecoverDialog: MessageSchema['recoverDialog'] = {
  title: 'Create a new World from backup world',
  desc: 'Create a new World from the following selected backup world',
  date: 'backup date：{date}',
  failedDate: 'Failed to read data',
  backupName: 'World name：{world}',
  startRecover: 'Start recovering',
}