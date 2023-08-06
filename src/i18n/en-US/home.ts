import { title } from "process";
import { MessageSchema } from "src/boot/i18n";

export const enUSHome: MessageSchema["home"] = {
  worldName: {
    title: 'World Name',
    enterName: 'Enter your world name'
  },
  version: {
    title: 'Versions',
    serverType: 'Select the Server Type',
    versionType: 'Select the Server Version',
    displayVersion: 'Versions to be displayed in the selection list',
    allVersions: 'All versions',
    onlyReleased: 'Only released',
    buildNumber: 'Build number',
    notChange: '(No change required)',
    recommend: 'Recommended',
    installer: 'Installer',
    loader: 'Loader'

  },
  serverType: {
    vanilla: 'Vanilla',
    spigot: 'Spigot',
    papermc: 'PaperMC',
    forge: 'Forge',
    mohistmc: 'MohistMC',
    fabric: 'Fabric'
  },
  icon: 'Change server icon',
  useWorld: {
    title: 'Import existing world',
    description: 'Import single world or zip format destribution world',
    selectWorld: 'Select your world data'
  },
  saveWorld: {
    title: 'World folder',
    description: 'Select your folder to save world data'
  },
  setting: {
    title: 'Start up settings',
    memSize: 'memory size',
    jvmArgument: 'Minecraft JVM arguments'
  },
  deleteWorld: {
    title: 'Delete World',
    button: 'Delete your world data',
    titleDesc: '\
      If you delete this world, you can not recover your world data in any way.<br>\
      Please be careful to execute.',
    dialogTitle: 'Delete your world data',
    dialogDesc: '\
      Your {deleteName} data will be deleted permanently.<br>\
      Are you sure to delete the world data?'
  },
  error: {
      title: 'Warning!',
      failedGetVersion: '\
        Failed to get the version {serverVersion}.<br>\
        You can not choose this server./',
      failedDelete: 'Failed to delete {serverName} which does not exist.'
  },
  init: {
    save: 'Save world settings',
    discard: 'Discard world settings'
  },
};