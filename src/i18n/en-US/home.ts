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
  useWorld: {
    title: 'Import existing world',
    description: 'Import single world or zip format destribution world',
    selectWorld: 'Select your world data',
    checkWorldInstall: 'Check for world install',
    checkDialog: 'I will introduce the following world data',
    installBtn: 'Install world',
  },
  otherSettings: 'Advanced Options',
  saveWorld: {
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

  },
  setting: {
    title: 'Start up settings',
    memSize: 'memory size',
    jvmArgument: 'Minecraft JVM arguments'
  },
  worldOperation:'World Operations',
  duplicate: {
    duplicateDesc: '\
      Duplicate the world and take over various settings such as server version, properties, OP player, etc.<br>\
      However, ShareWorld settings are not duplicated and must be configured again.',
    btn: 'Duplicate this world'
  },
  backup: {
    madeBackup: 'Made backup of {world}',
    recovered: 'FInish world recovering',
    backupDesc: '\
    Make backup of this world<br>\
    Backed-up world data can be accessed from "Recover from Backup"',
    makeBackup : 'Make backup',
    recoverFromBackup: 'Recover from backup',
    startRecover: 'Start recovering',
    recoverDialogDate: '\
      Introduce {world} created on {date} into the current existing world.<br>\
      Do you want to overwrite an existing world with a backup world?',
    recoverDialog: '\
      Introduce {world} into the current existing world.<br>\
      Do you want to overwrite an existing world with a backup world?',
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