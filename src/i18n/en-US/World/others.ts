import { MessageSchema } from 'src/boot/i18n';

export const enOthers: MessageSchema['others'] = {
  backup: {
    title: 'Manage a backup world',
    backupDesc: '\
      Make backup of this world<br>\
      Backed-up world data can be accessed from "Recover from Backup"',
    makeBackup : 'Make backup',
    recoverFromBackup: 'Recover from backup',
    madeBackup: 'Made backup of {world}',
    recovered: 'FInish world recovering',
  },
  worldFolder: {
    title: 'World folder',
    description: 'Select your folder to save world data',
    addFolder: 'Add world folder',
    updateFolder: 'Update world folder',
    add: 'add',
    addBtn: 'Add {name}',
    folderName: 'Name of world folder',
    select: 'Select folder',
    exist: '{name} already exists',
    registered: '{path} is already registered',
    inputFolderName: 'Input folder name',
    selectFolder: 'Select folder',
    selectFolderBtn: 'Select folder',
    cannotEdit: 'World folders cannot be edited while a world is running',
  }
}