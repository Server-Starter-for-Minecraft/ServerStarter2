import { MessageSchema } from "src/boot/i18n";

export const enUSMainLayout: MessageSchema['mainLayout'] = {
  allWorld: 'All Worlds',
  systemSetting: 'System Settings',
  searchWorld: 'Search world',
  openList: 'Open worldr list',
  minimizeList: 'Minimize world list',
  newWorldBtn: {
    addWorld: 'Add new world',
    content: {
      newWorld: {
        title: '',
        desc: ''
      },
      customMap: {
        title: '',
        desc: ''
      },
      duplicate: {
        title: '',
        desc: ''
      },
      backup: {
        title: '',
        desc: ''
      }
    }
  },
  customMapImporter: {
    addSeveralWorld: 'Add various worlds',
    addCustomWorld: 'Add Custom world',
    selectZip: 'Select ZIP file',
    selectFolder: 'Select folder',
    lastPlayed: "({datetime})",
    addSingleWorld: 'Add single world',
    loadSingleWorld: 'Loading<br>single play world',
    noSingleWorld: 'Single play world<br>was not found',
    checkDialog: {
      title: 'Introducing new world',
      desc: 'I am introducing the following world data',
    }
  },
  backupDialog: {
    title: 'Create a new World from backup world',
    desc: 'Create a new World from the following selected backup world',
    date: 'backup date：{date}',
    failedDate: 'Failed to read data',
    backupName: 'World name：{world}',
    startRecover: 'Start recovering',
  }
};