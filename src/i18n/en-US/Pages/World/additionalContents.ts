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
};
