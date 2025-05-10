/* バックエンド周りのエラーの翻訳 */
import { MessageSchema } from 'src/boot/i18n';

export const enUSError: MessageSchema['error'] = {
  system: {
    runtime: {
      title: 'Runtime error occurred({type})',
      desc: '{message}',
    },
    ipc: {
      title: 'IPC error occuerred({type})',
      desc: '{message}',
    },
    assertion: {
      title: 'Unknown error has occured',
      desc: '{message}',
    },
    subprocess: {
      title: 'Error occurred when subprocess executing',
      desc: 'Exitcode: {exitcode}',
    },
  },
  data: {
    url: {
      fetch: {
        title: 'Failed to get data from remote server',
        desc: 'Server status : {status}/{statusText}',
      },
      tooManyRequest: {
        title: 'To many requests have sent',
        desc: 'Wait a few moments and do again',
      },
    },
    zip: {
      invalidZipFile: {
        title: '{path} is invalid',
        desc: 'PLease check {path}',
      },
      isDir: {
        title: 'The data in the path in the ZIP file is a directory',
        desc: 'Please check {path}',
      },
    },
    path: {
      loadingFailed: {
        title: 'Failed to read the {type}',
        desc: 'failed for {path}',
      },
      renameFailed: {
        title: 'Failed to rename the {type}',
        desc: 'failed for {path}',
      },
      alreadyExists: {
        title: '{type} already exists',
      },
      notFound: {
        title: 'No {type} exists',
        desc: 'Please check {path}',
      },
      invalidExt: {
        title: 'Extension of {path} is inappropriate',
        desc: 'Please select files with the extension {expectedExt}',
      },
      invalidContent: {
        missingJavaCommand: {
          title: 'There are no command to exec java in run.bat or run.sh',
          desc: 'Please check {path}',
        },
        mustBeDirectory: {
          title: 'You need to use directory here',
          desc: 'Please check {path} is directory or not',
        },
        mustBeFile: {
          title: 'You need to select file here',
          desc: 'Please check {path} is file or not',
        },
        invalidDatapack: {
          title: 'Improper datapack is selected',
          desc: 'Please check {path}',
        },
        invalidPlugin: {
          title: 'Improper plugin file is selected',
          desc: 'Please check {path}',
        },
        invalidMod: {
          title: 'Improper Mod file is selected',
          desc: 'Please check {path}',
        },
        invalidCustomMap: {
          title: 'Improper custom map is select',
          desc: 'Please check {path}',
        },
        customMapZipWithMultipleLevelDat: {
          title:
            'There are too many level.dat in the custom map saved in {path}',
        },
        invalidWorldSettingJson: {
          title: 'The file of world settings is invalid',
          desc: '{path} is inappropriate',
        },
        invalidOpsJson: {
          title: 'The file manages the player op is invalid',
          desc: '{path} is inappropriate',
        },
        invalidWhitelistJson: {
          title: 'The file manages the whitelist is invalid',
          desc: '{path} is inappropriate',
        },
      },
      creationFailed: {
        title: 'Failed to create {type}',
        desc: 'Failed to create {path}',
      },
      deletionFailed: {
        title: 'Failed to delete {type}',
        desc: 'Failed to delete {path}',
      },
      moveFailed: {
        title: 'Failed to move {type}',
        desc: 'Failed to move {path}',
      },
      dialogCanceled: {
        title: 'Window to select file is cancelled',
      },
      shellError: {
        title: 'Unknown error occured when opening the file',
        desc: '{message}',
      },
    },
    githubAPI: {
      fetchFailed: {
        title: 'Failed to fetch data from GitHub',
      },
      unknownBlobEncoding: {
        title: 'Incorrect encoding used in blob',
      },
      invalidWorldData: {
        title: 'World data is invalid',
        desc: 'Please check the data on {owner}/{repo}/{branch}',
      },
    },
    failJsonFix: {
      title: 'Failed to fix JSON file',
    },
    hashNotMatch: {
      title: 'The file may not be correct',
    },
  },
  value: {
    playerName: {
      title: '{value} does not exist',
    },
    playerUUID: {
      title: 'No players are related to this ID',
    },
    playerNameOrUUID: {
      title: 'Nethier player exist related {value}',
    },
    base64URI: {
      title: 'No figure exist in {value}',
    },
    commandLineArgument: {
      title: 'Wrong command line, {value} does not exist',
    },
    worldName: {
      notMatchRegex: {
        title: 'Inallowed letter is used',
        desc: 'just use an alphabet or number',
      },
      alreadyUsed: {
        title: 'This name ({value}) is already used',
        desc: 'please use other name',
      },
    },
    remoteWorldName: {
      notMatchRegex: {
        title: 'Inallowed letter is used',
        desc: ' just use an alphabet or number',
      },
      alreadyUsed: {
        title: 'This name ({value}) is already used',
        desc: 'please use other name',
      },
    },
  },
  core: {
    world: {
      invalidWorldId: {
        title: 'The specified world does not exist.',
      },
      missingLatestLog: {
        title: 'Previous server log does not exist',
      },
      serverPortIsUsed: {
        title: 'The port number in use is specified as the server port',
        desc: "Please change the port number from {port} at property 'server-port'",
      },
      cannotChangeRunningWorldName: {
        title: 'You cannot change your world name or saved folder',
        desc: 'Close your world and do it again',
      },
      cannotDuplicateRunningWorld: {
        title:
          'The name of the running world and the folder where it is saved cannot be changed',
        desc: 'Stop world {name} and try again',
      },
      worldAleradyRunning: {
        title: 'Your world saved in {container}/{name} is already started',
      },
      failedChangingOp: {
        title: 'Failed to change op level for {users}',
        desc: 'Op level about {users} is {op}',
      },
    },
    container: {
      noContainerSubscribed: {
        title: 'No WorldContainer is registered',
        desc: 'Check WorldContainer again',
      },
    },
    version: {
      forgeInstallerNotProvided: {
        title: 'No forge installer for {version} exists',
      },
      failSpigotBuild: {
        javaNeeded: {
          title: 'Failed to build spiot for {spigotVersion}',
          desc: 'install Java from {minVersion} to {maxversion}',
        },
        missingJar: {
          title: 'Failed to build server',
          desc: 'failed for version {spigotVersion}',
        },
      },
      vanillaVersionNotExists: {
        title: 'vanilla does not exist in version {version}',
      },
    },
    runtime: {
      installFailed: {
        title: 'Failed to install a Java runtime',
        desc: 'Wait a few moments and run again. ({version})',
      },
    },
    missingPersonalAccessToken: {
      title: 'Personal access token for {owner}/{repo} dose not exist',
    },
    minecraftEULANotAccepted: {
      title: 'It does not agree to eula for Minecraft',
    },
    failCacheAddiltionalData: {
      title: 'Failed to cache {type}',
    },
    failGetGlobalIP: {
      title: 'Failed to get global IP address',
    },
    update: {
      missingAppSource: {
        title: 'Update file not found in latest release',
      },
    },
  },
  errorDialog: {
    failToGetOwner: 'Failed to get owner player',
    failOPForOwner: 'Failed to register owner player to OP list',
    failToSaveExistedWorld: 'Failed to save existed world',
    failSync: 'Failed to sync with ShareWorld',
    failGetShareWorld: 'Failed to get ShareWorld',
    recoverFail: 'Failed to recover world from backup data',
  },
  lib: {
    ngrok: {
      unreservedAdress: {
        title: 'TCP Address is not reserved',
        desc: '{address} is not bound',
      },
      unknown: {
        title: 'Unknown error occured at ngrok',
        desc: '{message}',
      },
    },
  },
};
