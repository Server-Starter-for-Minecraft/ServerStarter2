import { MessageSchema } from 'src/boot/i18n';

export const enAdditionalContents: MessageSchema['additionalContents'] = {
  datapack: 'datapack',
  mod: 'MOD',
  plugin: 'plugin',
  management: '{type} management',
  installed: 'Installed {type}',
  newInstall: 'Install new',
  add: 'Install {type}',
  notInstalled: 'No {type} installed',
  openSaveLocation: 'Open {type} folder (already added)',
  openAllSaveLocation: 'Open {type} folder (They are saved all)',
  install: 'Install',
  installFromZip: 'New install from Zip',
  installFromFolder: 'New install from Folder',
  needReboot: 'A server restart is required for the changes to take effect',
  deleteDialog: {
    title: 'Checking delete the {type}',
    desc: 'This world was last played with this {type} and loading it without this {type} could cause corruption!\nDo you really want to delete this?',
    okbtn: 'Yes, delete this',
  },
  newContentDialog: {
    title: 'Import New Contents',
    desc: 'You can choose from one of the following options for additional content to import to this world',
    file_title: 'Import from files',
    world_title: 'Import from other worlds',
    world_desc:
      'Additional content already installed in each world can be added together. \n\
      Open the following dialog to see the contents of each world.',
    world_btn: "Open the dialog (The list of other world's contents)",
  },
  dragdrop: {
    default: 'Drop files here or {0} to upload',
    click: 'click here',
    dragging: 'Release to drop files here',
  },
};
