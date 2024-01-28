import { MessageSchema } from 'src/boot/i18n';

export const enTabs: MessageSchema['tabs'] = {
  worldSettingTabs: {
    home: 'Home',
    console: 'Server',
    property: 'Property',
    player: 'Players',
    contents: 'Additional contents',
    datapack: 'Datapack',
    plugin: 'Plugin',
    mod: 'MOD',
    shareWorld: 'ShareWorld',
    others: 'Others',
  },
  systemSettingTabs: {
    home: 'General',
    list_alt: 'Default property',
    cloud: 'Remote',
    folder: 'World Folders',
    info: 'System infomation',
  },
};
