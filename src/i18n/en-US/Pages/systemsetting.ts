import { MessageSchema } from 'src/boot/i18n';

export const enUSSystemSetting: MessageSchema['systemsetting'] = {
  title: 'Settings',
  general: {
    lang: 'Language',
    langDesc: 'Select your language',
    colorMode: 'Appearance',
    useVisionSupport: 'Apply vision support',
    noVisionSupport: "Don't apply vision support",
    autoShutdown: 'Auto-Shutdown',
    shutdownDesc: 'Allow to shutdown your PC after you close the server',
  },
  property: {
    description: 'Set the default setting for creating new world',
    search: 'Search the setting',
  },
  remote: {},
  folder: {
    unregistTitle: 'Unregister {name}',
    unregistDialog:
      '\
      Unregister {name} from the ServerStarter2 world save list. \n\
      Unregistered folders and their internal data will not be deleted.',
    tooltipVisible: 'Display worlds saved in this folder in the world list',
    tooltipInvisible:
      'Do not display worlds saved in this folder in the world list',
    unregist: 'Unregister',
  },
  info: {
    systemVersion: 'System version',
    latest: '(Latest)',
    update: 'Update to the latest version',
    finalUpdate: 'Last update：{datetime}',
    systemLog: 'System Logs',
    systemLogDesc: 'Open the folder containing system logs',
    openSystemLog: 'Open log folder',
    externalLink: 'External links',
    homepage: 'Official Homepage',
    contact: 'Contact',
    dm: '(Please contact us via DM)',
    license: 'License',
    MIT: 'MIT License',
    licenseDesc:
      '\
      Modification and redistribution of the system without permission from the creator is prohibited.\n\
      Please refer to the ServerStarter2 Terms of Use and License Agreement for more information.',
    developer: 'Developer',
    productionManager: 'Production Manager',
    technicalManager: 'Technical Manager',
    support: 'Supports',
  },
};
