/* バックエンド周りのエラーの翻訳 */

import { ErrorTranslationTypes } from "app/src-electron/schema/error";

export const enUSError: ErrorTranslationTypes = {
    system:  {
        runtime: '',
        ipc: '',
        subprocess: ''
    },
    data: {
        url: {
            fetch: ''
        },
        path: {
            loadingFailed: '',
            alreadyExists: '',
            notFound: '',
            invalidContent: {
              missingJavaCommand: '',
              mustBeDirectory: '',
              mustBeFile: '',
              invalidDatapack: '',
              invalidPlugin: '',
              invalidMod: '',
              invalidCustomMap: '',
              customMapZipWithMultipleLevelDat: '',
              invalidWorldSettingJson: '',
              invalidOpsJson: '',
              invalidWhitelistJson: ''
            },
            creationFiled: '',
            dialogCanceled: '',
        },
        hashNotMatch: ''
    },
    value: {
        playerName: '',
        playerUUID: '',
        playerNameOrUUID: '',
        base64URI: '',
        commandLineArgument: '',
        worldName: {
            notMatchRegex: '',
            alreadyUsed: ''
        },
    },
    core: {
        world: {
          invalidWorldId: '',
          worldAleradyRunning: ''
        },
        version: {
          forgeInstallerNotProvided: '',
          failSpigotBuild: {
            javaNeeded: ''
          },
          vanillaVersionNotExists: ''
        },
        missingPersonalAccessToken: '',
        minecraftEULANotAccepted: '',
        failCacheAddiltionalData: '',
        failGetGlobalIP: ''
    },
};