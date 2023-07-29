import { ProgressMessageTranslation } from 'app/src-electron/schema/progressMessage';

export const enUSProgress: ProgressMessageTranslation = {
  server: {
    preparing: 'Opening {world}',
    postProcessing: 'Closing {world}',
    eula: {
      title: 'Checking agreement of EULA',
      generating: 'Making eula.txt',
      loading: 'Loading eula.txt',
      saving: 'Writing eula.txt',
      asking: 'Asking the agreement about eula.txt'
    },
    local: {
      loading: 'Loading world data from local folder',
      saving: 'Reflecting world data to local folder',
      savingSettingFiles: 'Saving world setting file',
      formatWorldDirectory: 'Changing world directory',
      reloading: 'Reloading world data',
			checkUsing: 'Checking usement of the world',
			movingSaveData: 'Moving world data'
    },
		remote: {
			check: 'Checking existence of data on the remote',
			pull: 'Downloading data on the remote',
			push: 'Uploading date on the remote'
		},
		java: {
			memoryArguments: 'Getting parameters of memory capacity',
			userArguments: 'Getting parameters of user settings'
		},
		version: {
			getLog4jSettingFile: 'Downloading setting files of log4J'
		},
  },
};