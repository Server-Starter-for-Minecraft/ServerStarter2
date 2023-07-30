/* バックエンド周りのエラーの翻訳 */

import { ErrorTranslationTypes } from 'app/src-electron/schema/error';

export const jaError: ErrorTranslationTypes = {
  system: {
    runtime: '\
      ランタイムエラーが発生しました<br>\
      エラーの型: {type}<br>\
      エラーの内容: {message}',
    ipc: '\
      IPC通信でエラーが発生しました<br>\
      エラーの型: {type}<br>\
      エラーの内容: {message}<br>',
    subprocess: '\
      {processPath}でエラーが発生しました<br>\
      終了コード: {exitcode}',
  },
  data: {
    url: {
      fetch: '{url}からデータを取得するのに失敗しました',
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
        invalidPlugin: '不適なプラグインファイルが選択されました。正しいものであるかをもう一度確認してください。',
        invalidMod: '不適なModファイルが選択されました。正しいものであるかをもう一度確認してください。',
        invalidCustomMap: '不適なカスタムマップが選択されました。正しいものであるかをもう一度確認してください。',
        customMapZipWithMultipleLevelDat: '{path}のカスタムマップにはlevel.datが複数格納されています',
        invalidWorldSettingJson: 'server_settings.json の中身が不適当です',
        invalidOpsJson: 'ops.json の中身が不適当です',
        invalidWhitelistJson: 'whitelist.json 中身が不適当です',
      },
      creationFiled: 'ファイル、またはディレクトリの生成に失敗しました',
      dialogCanceled: 'ファイル選択ウィンドウがキャンセルされました'
    },
    hashNotMatch: 'ファイルの中身が正しくない可能性があります。',
  },
  value: {
    playerName: 'プレイヤー名{value}が存在しません',
    playerUUID: 'このUUIDに対応するプレイヤーは存在しません',
    playerNameOrUUID: '{value}に対応するプレイヤーは存在しません',
    base64URI: '{value}には画像が存在しません',
    commandLineArgument: '{value}の様なコマンドは存在しません',
    worldName: {
      notMatchRegex: '使えない文字が含まれています。半角英数字のみ入力してください',
      alreadyUsed: 'この名前は既に使われています',
    },
  },
  core: {
    world: {
      invalidWorldId: '{id}に対応するワールドが存在しません',
      cannotChangeRunningWorldName: '\
        実行中のワールドの名前、保存フォルダは変更できません<br>\
        ワールドを閉じてから再度試してください',
      worldAleradyRunning: '{container}/{name}に保存されているワールドは既に起動してあります',
      failedChangingOp: '\
        {users}のop権限の変更に失敗しました<br>\
        現在の{users}のopレベルは{op}です'
    },
    container: {
      noContainerSubscribed: 'WorldContainerが登録されていません、もう一度ご確認ください'
    },
    version: {
      forgeInstallerNotProvided: '{version}のforgeのインストーラは提供されていません',
      failSpigotBuild: {
        javaNeeded: '{version}のspiotのビルドに失敗しました、{minVersion}～{maxVersion}の間のJavaがインストールされている必要があります'
      },
      vanillaVersionNotExists: 'バージョン{version}のvanillaは存在しません',
    },
    missingPersonalAccessToken: 'https://github.com/{owner}/{repo}のパーソナルアクセストークンが存在しません',
    minecraftEULANotAccepted: 'Minecraftのeulaに同意していません',
    failCacheAddiltionalData: '{type}のキャッシュに失敗しました。',
    failGetGlobalIP: 'グローバルIPの取得に失敗しました',
  },
};
