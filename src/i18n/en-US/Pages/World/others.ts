import { MessageSchema } from 'src/boot/i18n';

export const enOthers: MessageSchema['others'] = {
  openFolder: {
    title: 'Open Saving data folder',
    desc: 'Open the folder where the world data is saved.',
    btnText: 'Open folder',
  },
  backup: {
    title: 'Manage a backup world',
    backupDesc:
      '\
      Make backup of this world\n\
      Backed-up world data can be accessed from "Recover from Backup"',
    makeBackup: 'Make backup',
    recoverFromBackup: 'Recover from backup',
    madeBackup: 'Made backup of {world}',
    recovered: 'FInish world recovering',
  },
  worldFolder: {
    title: 'World folder',
    description: 'Select your folder to save world data',
    addFolder: 'Add the world folder',
    openFolder: 'Open the world folder',
    openSettings: "Open world folder's settings",
    updateFolder: 'Update world folder',
    add: 'Add a new World folder',
    addBtn: 'Add {0}{1}',
    folderName: 'Name of world folder',
    select: 'Select folder',
    exist: '{name} already exists',
    registered: '{path} is already registered',
    inputFolderName: 'Input folder name',
    selectFolder: 'Select folder',
    selectFolderBtn: 'Select folder',
    cannotEdit: 'World folders cannot be edited while a world is running',
  },
};
