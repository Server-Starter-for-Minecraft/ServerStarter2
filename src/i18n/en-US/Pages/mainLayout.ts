import { MessageSchema } from 'src/boot/i18n';

export const enUSMainLayout: MessageSchema['mainLayout'] = {
  allWorld: 'All Worlds',
  systemSetting: 'System Settings',
  donation: {
    btn: 'Support us',
    title: 'Support the development of ServerStarter',
    desc: '\
      ServerStarter is developed and run as a non-profit project without any ads.\n\
      Your donation will be used for future development and operation.',
    select: 'Choose an amount to donate',
    note: 'The Square payment page will open in your browser (credit cards, Apple Pay and Google Pay are accepted)',
    options: {
      small: { desc: 'Buy us a coffee' },
      medium: { desc: 'Buy us a lunch' },
      large: { desc: 'Give development a big boost' },
      custom: { title: 'Custom amount', desc: 'Donate any amount you like' },
    },
  },
  searchWorld: 'Search world',
  openList: 'Open the world list',
  minimizeList: 'Minimize world list',
  noWorld: 'No Worlds Found',
  selectWorld: 'Select a world',
  loading: 'Loading {name}',
  failedLoading: 'Failed to load {name}',
  newWorldBtn: {
    addWorld: 'Add new world',
    content: {
      newWorld: {
        title: 'Create a New WORLD',
        desc: 'Create a completely new world',
      },
      customMap: {
        title: 'Introduce a created world',
        desc: 'Introduce zipped custom maps and single-player worlds',
      },
      duplicate: {
        title: 'Duplicate the current world',
        desc: 'Duplicate with various settings such as a server version and properties',
      },
      backup: {
        title: 'Introduce a backed-up world',
        desc: 'Adding a backed-up world',
      },
    },
  },
  customMapImporter: {
    addSeveralWorld: 'Add various worlds',
    addCustomWorld: 'Add Custom world',
    selectZip: 'Select ZIP file',
    selectFolder: 'Select folder',
    lastPlayed: '({datetime})',
    addSingleWorld: 'Add single world',
    loadSingleWorld: 'Loading\nsingle play world',
    noSingleWorld: 'Single play world\nwas not found',
    checkDialog: {
      title: 'Introducing new world',
      desc: 'I am introducing the following world data',
    },
  },
  backupDialog: {
    title: 'Create a new World from backup world',
    desc: 'Create a new World from the following selected backup world',
    date: 'backup date：{date}',
    failedDate: 'Failed to read data',
    backupName: 'World name：{world}',
    startRecover: 'Start recovering',
  },
};
