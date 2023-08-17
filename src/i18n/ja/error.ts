/* バックエンド周りのエラーの翻訳 */

import { ErrorTranslationTypes } from 'app/src-electron/schema/error';

export const jaError: ErrorTranslationTypes = {
  system: {
    runtime: {
      title: 'ランタイムエラーが発生しました',
      desc: 'エラーの型: {type} ,エラーの内容: {message}',
    },
    ipc: {
      title: 'IPC通信でエラーが発生しました',
      desc: 'エラーの型: {type} ,エラーの内容: {message}',
    },
    subprocess: {
      title: '{processPath}でエラーが発生しました',
      desc: '終了コード: {exitcode}',
    },
  },
  data: {
    url: {
      fetch: {
        title: '{url}からのデータの取得に失敗しました',
        desc: 'サーバー状態:{status}/{statusText}'
      },
      tooManyRequest: {
        title: 'リクエストが多すぎます',
        desc : '少し時間を置いてから再度実行してください',
      }
    },
    zip: {
      isDir: {
        title: 'ZIPファイル中のパスのデータがディレクトリになっています',
        desc: '{path}を確認してください',
      },
    },
    path: {
      loadingFailed: {
        title: `{type}の読み込みに失敗しました`,
        desc: '{path}を読み込めませんでした'
      },
      alreadyExists: {
        title:'{type}が既に存在しています',
      },
      notFound: {
        title: '{type}が存在していません',
        desc: '{path}を確認してください',
      },
      invalidContent: {
        missingJavaCommand: {
          title: 'run.bat、またはrun.sh内にjavaを起動するコマンドが存在していません',
          desc: '{path}を確認してください',
        },
        mustBeDirectory: {
          title:'ここではディレクトリを使用する必要があります',
          desc: '{path}がディレクトリかどうか確認してください',
        },
        mustBeFile: {
          title: 'ここではファイルを選択する必要があります',
          desc: '{path}がファイルかどうか確認してください',
        },
        invalidDatapack: {
          title: '不適なデータパックが選択されました。',
          desc: '{path}を確認してください'
        },
        invalidPlugin:{
          title: '不適なプラグインファイルが選択されました。',
          desc: '{path}を確認してください'
        },
        invalidMod:{
          title: '不適なModファイルが選択されました。',
          desc: '{path}を確認してください'
        },
        invalidCustomMap:{
          title: '不適なカスタムマップが選択されました。',
          desc: '{path}を確認してください'
        },
        customMapZipWithMultipleLevelDat:{
          title: '{path}のカスタムマップにはlevel.datが複数格納されています',
        },
        invalidWorldSettingJson:{
          title: 'server_settings.json の中身が不適当です',
        },
        invalidOpsJson:{
          title: 'ops.json の中身が不適当です',
        },
        invalidWhitelistJson:{
          title: 'whitelist.json の中身が不適当です',
      },
      },
      creationFiled:{
        title: 'ファイル、またはディレクトリの生成に失敗しました',
      },
      dialogCanceled:{
        title: `ファイル選択ウィンドウがキャンセルされました`
      },
    },
    githubAPI: {
      fetchFailed:{
        title: '{url}からのデータの取得に失敗しました',
      },
      unknownBlobEncoding:{
        title: 'blobのエンコードが異なっています',
      },
      invalidWorldData:{
        title: 'WorldDataが壊れています',
        desc: '{owner}/{repo}/{branch}のデータを確認してください'
      },
    },
    failJsonFix: {
      title: 'JSONデータの修復に失敗しました',
    },
    hashNotMatch: {
      title: 'ファイルの中身が正しくない可能性があります。',
    },
  },
  value: {
    playerName: {
      title: 'プレイヤー名{value}が存在しません',
    },
    playerUUID: {
      title: 'このUUIDに対応するプレイヤーは存在しません',
    },
    playerNameOrUUID: {
      title: '{value}に対応するプレイヤーは存在しません',
    },
    base64URI: {
      title: '{value}には画像が存在しません',
    },
    commandLineArgument: {
      title: '{value}というコマンドは存在しません',
    },
    worldName: {
      notMatchRegex: {
        title: '使えない文字が含まれています。',
        desc:'半角英数字のみ入力してください',
      },
      alreadyUsed: {
        title: 'この名前({value})は既に使われています',
      },
    },
    remoteWorldName: {
      notMatchRegex: {
        title: '使えない文字が含まれています。',
        desc:'半角英数字のみ入力してください',
      },
      alreadyUsed: {
        title: 'この名前({value})は既に使われています',
      }
    }
  },
  core: {
    world: {
      invalidWorldId: {
        title: '{id}に対応するワールドが存在しません',
      },
      cannotChangeRunningWorldName: {
        title: '実行中のワールドの名前、保存フォルダは変更できません',
        desc: 'ワールドを閉じてから再度試してください',
      },
      worldAleradyRunning: {
        title: '{container}/{name}に保存されているワールドは既に起動中です',
      },
      failedChangingOp: {
        title: '{users}のop権限の変更に失敗しました',
        desc: '現在の{users}のopレベルは{op}です',
      },
    },
    container: {
      noContainerSubscribed: {
        title:'WorldContainerが登録されていません',
        desc: 'もう一度ご確認ください',
      },
    },
    version: {
      forgeInstallerNotProvided: {
        title: '{version}のforgeのインストーラは提供されていません',
      },
      failSpigotBuild: {
        javaNeeded: {
          title:'{version}のspigotのビルドに失敗しました',
          desc: '{minVersion}～{maxVersion}の間のJavaがインストールされている必要があります',
        },
      },
      vanillaVersionNotExists: {
        title: 'バージョン{version}のvanillaは存在しません',
      },
    },
    missingPersonalAccessToken: {
      title: 'https://github.com/{owner}/{repo}のパーソナルアクセストークンが存在しません',
    },
    minecraftEULANotAccepted: {
      title: 'Minecraftのeulaに同意していません',
    },
    failCacheAddiltionalData: {
      title:'{type}のキャッシュに失敗しました。',
    },
    failGetGlobalIP: {
      title: 'グローバルIPの取得に失敗しました',
    }
  },
};
