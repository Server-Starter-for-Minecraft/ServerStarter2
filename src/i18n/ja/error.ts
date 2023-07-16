/* バックエンド周りのエラーの翻訳 */

import { ErrorTranslationTypes } from 'app/src-electron/schema/error';

export const jaError: ErrorTranslationTypes = {
  system: {
    runtime: '',
    ipc: '',
    subprocess: '',
  },
  data: {
    url: {
      fetch: '',
    },
    path: {
      loadingFailed: 'ファイル、またはディレクトリの読み込みに失敗しました',
      alreadyExists: 'ファイル、またはディレクトリが既に存在しています',
      notFound: 'ファイル、またはディレクトリが存在していません',
      invalidContent: {
        missingJavaCommand: 'run.bat、またはrun.sh内にjavaを起動するコマンドが存在していません',
        mustBeDirectory: 'ここではディレクトリを使用する必要があります',
        mustBeFile: 'ここではファイルを選択する必要があります',
        invalidDatapack: '不適なデータパックが選択されました。正しいものであるかをもう一度確認してください。',
        invalidPlugin: '不敵なプラグインファイルが選択されました。正しいものであるかをもう一度確認してください。',
        invalidMod: '不敵なModファイルが選択されました。正しいものであるかをもう一度確認してください。',
        invalidCustomMap: '不敵なカスタムマップが選択されました。正しいものであるかをもう一度確認してください。',
        customMapZipWithMultipleLevelDat: '',
        invalidWorldSettingJson: '',
        invalidOpsJson: '',
        invalidWhitelistJson: '',
      },
      creationFiled: 'ファイル、またはディレクトリの生成に失敗しました',
      dialogCanceled: 'ファイル選択ウィンドウがキャンセルされました'
    },
    hashNotMatch: '',
  },
  value: {
    playerName: '',
    playerUUID: '',
    playerNameOrUUID: '',
    base64URI: '',
    commandLineArgument: '',
    worldName: {
      notMatchRegex: '使えない文字が含まれています。半角英数字のみ入力してください',
      alreadyUsed: 'この名前は既に使われています',
    },
  },
  core: {
    world: {
      invalidWorldId: '{id}に対応するワールドが存在しません',
      worldAleradyRunning: '',
    },
    version: {
      forgeInstallerNotProvided: '',
      failSpigotBuild: {
        javaNeeded: '',
      },
      vanillaVersionNotExists: '',
    },
    missingPersonalAccessToken: '',
    minecraftEULANotAccepted: '',
    failCacheAddiltionalData: '',
    failGetGlobalIP: '',
  },
};
