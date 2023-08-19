import { ProgressMessageTranslation } from 'app/src-electron/schema/progressMessage';

export const enUSProgress: ProgressMessageTranslation = {
  server: {
    preparing: 'Opening {world}',
    postProcessing: 'Closing {world}',
    getOwner: 'Getting owner data',
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
      loadSettingFiles: 'Loadtin world setting file',
      formatWorldDirectory: 'Changing world directory',
      reloading: 'Reloading world data',
			checkUsing: 'Checking usement of the world',
			movingSaveData: 'Moving world data'
    },
		remote: {
			check: 'Checking existence of data on the remote',
			pull: 'Downloading data on the remote',
      fixing: 'Fixing remote data',
      desc: {
        getPlayerFromUUID: 'Gettinf player from UUID',
        git: 'Executing git.{method} {stage} stage',
      },
			push: 'Uploading date on the remote'
		},
    readyJava: {
      title: 'Preparing java runtime',
      file: 'Generating {path}',
    },
		readyVersion: {
			title: 'Preparing {version}',
      vanilla: {
        fetching: 'Downloading server data',
        saving: 'Saving server data'
      },
      spigot: {
        loadBuildJavaVersion: 'Checking Java version for build.',
        readyBuildJava: 'Preparing Java for build',
        readyBuildtool: 'Preparing build tools',
        loadBuildData: 'Getting build infomation',
        building: 'Building',
        moving: 'Moving server data'
      },
      papermc: {
        loadBuildData: 'Getting build infomation',
        readyServerData: 'Preparing server data',
      },
      mohistmc: {
        readyServerData: 'Preparing server data',
      },
      forge: {
        readyServerData: 'Preparing server data',
      },
      fabric: {
        readyServerData: 'Preparing server data',
      },
		},
    load: {
      title: 'Loading world data',
      loadLocalSetting: 'Loading local setting file',
      reloading: 'Reloading local setting file',
      aborting: 'aborting',
    },
    save: {
      title: 'Writing world data',
      localSetting: 'Writing local setting file',
    },
    pull: {
      title: 'Download world data from remote',
      ready: 'Preparing to download world data',
      stage: '{stage} by git',
    },
    push: {
      title: 'Upload world data from remote',
      ready: 'Preparing to upload world data',
      stage: '{stage} by git',
    },
    run: {
      before:{
        title: 'Processing before world startup',
        memoryArguments: 'Generating memory arguments in Java',
        userArguments: 'Validating user arguments in Java',
        getLog4jSettingFile: 'Downloading configuration file of log4J',
        convertDirectory: 'fixing directory structure',
      },
      after: {
        title: 'Processing after world startup',
      },
    },
  },
};