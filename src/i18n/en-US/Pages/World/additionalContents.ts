import { MessageSchema } from 'src/boot/i18n';

export const enAdditionalContents: MessageSchema['additionalContents'] = {
  datapack: 'datapack',
  mod: 'MOD',
  plugin: 'plugin',
  header: {
    search: {
      placeholder: 'Input the name of additional content',
      item: {
        tooltipTitle: 'Title：{title}',
        tooltipDesc: 'The list of installed contents\n{worldList}',
        caption: 'This content has been already installed in {worldList}',
        historicalContent: 'It had been installed before',
      },
    },
    noResults: 'No Results',
    addBtn: 'Add new contents',
    openSavedFolder: "Open the saving folder's path",
  },
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
  contentDetails: 'Content details',
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
  addMultipleContentsDialog: {
    title: 'Import multiple contents',
    okBtn: 'Import selected contents',
    desc: 'Select the world containing the content you want to import from the left list',
    addBtn: 'Select all',
    releaseBtn: 'Cancel',
    noContentMsg: 'No contents',
  },
  detailsEditor: {
    okBtn: 'Save changes',
    desc: 'This details applies for all content in ServerStarter2 exclude ShareWorld',
    descSW: 'This details applies for only this content',
    contentsName: 'Content name',
    share: {
      title: 'Do you want to share this content via ShareWorld?',
      desc: 'Please check the terms of the content and make sure that sharing via ShareWorld does not violate any redistribution or other regulations. \n\
        When this function is turned off, only this details will be shared, not the main body data of the content.',
      toggleON: 'Share this content include the main body data',
      toggleOFF: 'Not share this content',
    },
    memoField: {
      title: 'Notes',
      desc: 'Click on this area to edit notes',
    },
  },
  dragdrop: {
    default: 'Drop files here or {0} to upload',
    click: 'click here',
    dragging: 'Release to drop files here',
  },
};
