// This is just an example,
// so you can safely delete all default props below
import { MessageSchema } from "src/boot/i18n";

export const enUS: MessageSchema = {
  home: {
    worldName: 'World Name',
    enterName: 'Enter your world name',
    version: 'Version',
    serverType: 'Select the Server type',
    versionType: 'Select the Server Version',
    useWorld: 'Use existing world',
    settings: 'Open Settings'
  },
  importWorld: {
    
  },
  settingDetails: {
    
  },
  deleteWorld: {
    title: 'Delete World',
    titleExplanation: '\
    If you delete the world, you can not recover the data in any way.<br>\
    Please execute it carefully.',
    dialogTitle: 'Delete World',
    dialogExplanation: '\
    The world data of {deleteName} will absolutely be deleted.<br>\
    Are you sure to delete the world data?',
  },
  failDelete: {
    title: 'Failed delete',
    description: 'Failed to delete {deleteName}',
  },
};
