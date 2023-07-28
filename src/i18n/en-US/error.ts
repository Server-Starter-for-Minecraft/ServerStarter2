/* バックエンド周りのエラーの翻訳 */

import { ErrorTranslationTypes } from 'app/src-electron/schema/error';

export const enUSError: ErrorTranslationTypes = {
  system: {
    runtime: '\
      Runtime error occurred.<br>\
      Error type: {type}<br>\
      Error message: {message}',
    ipc: '\
      IPC error occuerred<br>\
      Error type: {type}<br>\
      Error message: {message}',
    subprocess: '\
      Error occurred in {processPath}<br>\
      Exitcode: {exitcode}',
  },
  data: {
    url: {
      fetch: 'Failed to get data from {url}',
    },
    path: {
      loadingFailed: 'Failed to read the file or directory',
      alreadyExists: 'File or directory already exists',
      notFound: 'No file or directory exists',
      invalidContent: {
        missingJavaCommand: 'There are no command to exec java in run.bat or run.sh',
        mustBeDirectory: 'You need to use directory here',
        mustBeFile: 'You need to select file here',
        invalidDatapack: 'Improper datapack is selected',
        invalidPlugin: 'Improper plugin file is selected',
        invalidMod: 'Improper Mod file is selected',
        invalidCustomMap: 'Improper custom map is select',
        customMapZipWithMultipleLevelDat: 'There are too many level.dat in the custom map saved in {path}',
        invalidWorldSettingJson: 'server_setting.json is not inappropriate',
        invalidOpsJson: 'ops.json is not inappropriate',
        invalidWhitelistJson: 'ops.json is not inappropriate',
      },
      creationFiled: 'Failed to create file or directory',
      dialogCanceled: 'Window to select file is cancelled',
    },
    hashNotMatch: 'The file may not be correct',
  },
  value: {
    playerName: '{value} does not exist',
    playerUUID: 'No players are related to this ID',
    playerNameOrUUID: 'Nethier player exist related {value}',
    base64URI: 'No figure exist in {value}',
    commandLineArgument: 'Wrong command line, {value} does not exist',
    worldName: {
      notMatchRegex: 'Inallowed letter is used, just use an alphabet or number',
      alreadyUsed: 'This name is already used',
    },
  },
  core: {
    world: {
      invalidWorldId: 'There is no world in {id}',
      cannotChangeRunningWorldName: '\
        You cannot change your world name or saved folder<br>\
        Close your world and do it again',
      worldAleradyRunning: 'Your world saved in {container}/{name} is already started',
      failedChangingOp: '\
        Failed to change op level for {users}<br>\
        Op level about {users} is {op}',
    },
    container: {
      noContainerSubscribed: 'No WorldContainer is registered, check it again',
    },
    version: {
      forgeInstallerNotProvided: 'No forge installer for {version} exists',
      failSpigotBuild: {
        javaNeeded: 'Failed to build spiot for {version}, install Java from {minVersion} to {maxversion}',
      },
      vanillaVersionNotExists: 'vanilla does not exist in version {version}',
    },
    missingPersonalAccessToken: 'Personal access token for https://github.com/{owner}/{repo}',
    minecraftEULANotAccepted: 'It does not agree to eula for Minecraft',
    failCacheAddiltionalData: 'Failed to cache {type}',
    failGetGlobalIP: 'Failed to get global IP address',
  },
};
