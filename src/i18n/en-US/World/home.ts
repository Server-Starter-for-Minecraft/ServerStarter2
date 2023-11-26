import { MessageSchema } from 'src/boot/i18n';

export const enUSHome: MessageSchema['home'] = {
  worldName: {
    title: 'World Name',
    enterName: 'Enter your world name'
  },
  version: {
    title: 'Versions',
    serverType: 'Select the Server Type',
    versionType: 'Select the Server Version',
    allVersions: 'All versions',
    onlyReleased: 'Only released',
    buildNumber: 'Build number',
    notChange: '(No change required)',
    recommend: 'Recommended',
    installer: 'Installer',
    loader: 'Loader',
    latestSnapshot: 'Latest snapshot',
    latestRelease: 'Latest release',
    latestVersion: 'Latest version'
  },
  serverType: {
    vanilla: 'Vanilla (Official)',
    spigot: 'Spigot',
    papermc: 'PaperMC',
    forge: 'Forge',
    mohistmc: 'MohistMC',
    fabric: 'Fabric'
  },
  serverDescription: {
    vanilla: 'Official Minecraft server. Provides standard multiplay server.',
    spigot: 'Typical third party server. Allows plugins to be installed.',
    papermc: 'A server that makes Spigot run more lightly',
    forge: 'Most common servers as prerequisite servers for mods',
    mohistmc: 'Server based on Forge, but allows both mods and plugins to be installed',
    fabric: 'The premise server for the mods, which is a different system from Forge.'
  },
  icon: 'Change server icon',
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
        You can not choose this server.',
    failedDelete: 'Failed to delete {serverName} which does not exist'
  },
  init: {
    save: 'Save world settings',
    discard: 'Discard world settings'
  },
};