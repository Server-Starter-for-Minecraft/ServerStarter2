import { ProgressMessageTranslation } from 'app/src-electron/schema/progressMessage';

export const enUSProgress: ProgressMessageTranslation = {
  server: {
    preparing: '',
    postProcessing: '',
    getOwner: '',
    eula: {
      title: '',
      generating: '',
      loading: '',
      saving: '',
      asking: ''
    },
    local: {
      loading: '',
      saving: '',
      savingSettingFiles: '',
      formatWorldDirectory: '',
      reloading: '',
			checkUsing: '',
			movingSaveData: ''
    },
		remote: {
			check: '',
			pull: '',
			push: ''
		},
		java: {
			memoryArguments: '',
			userArguments: ''
		},
		version: {
			getLog4jSettingFile: ''
		},
  },
};