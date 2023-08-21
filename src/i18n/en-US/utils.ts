import { MessageSchema } from "src/boot/i18n";

export const enUSUtils: MessageSchema['utils'] = {
  searchWorld: 'Search a World',
  worldSettingTabs: {
    home: 'Home',
    console: 'Server',
    property: 'Property',
    player: 'Players',
    contents: 'Additional contents',
    datapack: 'Datapack',
    plugin: 'Plugin',
    mod: 'MOD',
    cloud: 'ShareWorld',
  },
  systemSettingTabs: {
    home: 'General',
    list_alt: 'Default property',
    cloud: 'Remote',
    folder: 'World Folders',
    info: 'System infomation',
  },
  bugReport: {
    title: 'Sorry to inconvenience you',
    desc: '\
      If this error occurs frequently, please report the error using the "Bug Report" link below.<br>\
      If you need an urgent response, please contact the author, CivilTT, via Twitter.',
    cause: '【Cause of Error】',
    reportBtn: 'Bug report',
    contact: 'Contact to author',
    close: 'close',
  },
  errorDialog: {
    failToGetOwner: 'Failed to get owner player',
    failOPForOwner: 'Failed to register owner player to OP list',
  }
};
