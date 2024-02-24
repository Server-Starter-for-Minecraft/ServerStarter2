/* バックエンド周りのエラーの翻訳 */

import { ErrorTranslationTypes } from 'app/src-electron/schema/error';

type ErrorDialogTitles = { errorDialog: { [key: string]: string } };

export const jaError: ErrorTranslationTypes & ErrorDialogTitles = {
  system: {
    runtime: {
      title: 'ランタイムエラーが発生しました({type})',
      desc: '{message}',
    },
    ipc: {
      title: 'IPC通信でエラーが発生しました({type})',
      desc: '{message}',
    },
    assertion: {
      title: '不明なエラーが発生しました',
      desc: '{message}',
    },
    subprocess: {
      title: 'subprocessの実行時にエラーが発生しました',
      desc: '終了コード: {exitcode}',
    },
  },
  data: {
    url: {
      fetch: {
        title: 'リモートサーバー上のデータの取得に失敗しました',
        desc: 'サーバー状態:{status}/{statusText}',
      },
      tooManyRequest: {
        title: 'リクエストが多すぎます',
        desc: '少し時間を置いてから再度実行してください',
      },
    },
    zip: {
      invalidZipFile: {
        title: '{path}は不適なZIPファイルです',
        desc: '{path}を確認してください',
      },
      isDir: {
        title: 'ZIPファイル中のパスのデータがディレクトリになっています',
        desc: '{path}を確認してください',
      },
    },
    path: {
      loadingFailed: {
        title: '{type}の読み込みに失敗しました',
        desc: '{path}を読み込めませんでした',
      },
      alreadyExists: {
        title: '{type}が既に存在しています',
      },
      notFound: {
        title: '{type}が存在していません',
        desc: '{path}を確認してください',
      },
      invalidExt: {
        title: '{path} の拡張子が正しくありません',
        desc: '拡張子{expectedExt}のファイルを選択してください',
      },
      invalidContent: {
        missingJavaCommand: {
          title:
            'run.bat、またはrun.sh内にjavaを起動するコマンドが存在していません',
          desc: '{path}を確認してください',
        },
        mustBeDirectory: {
          title: 'ここではディレクトリを使用する必要があります',
          desc: '{path}がディレクトリかどうか確認してください',
        },
        mustBeFile: {
          title: 'ここではファイルを選択する必要があります',
          desc: '{path}がファイルかどうか確認してください',
        },
        invalidDatapack: {
          title: '不適なデータパックが選択されました',
          desc: '{path}を確認してください',
        },
        invalidPlugin: {
          title: '不適なプラグインファイルが選択されました',
          desc: '{path}を確認してください',
        },
        invalidMod: {
          title: '不適なModファイルが選択されました',
          desc: '{path}を確認してください',
        },
        invalidCustomMap: {
          title: '不適なカスタムマップが選択されました',
          desc: '{path}を確認してください',
        },
        customMapZipWithMultipleLevelDat: {
          title: '{path}のカスタムマップにはlevel.datが複数格納されています',
        },
        invalidWorldSettingJson: {
          title: 'ワールドの設定ファイルが壊れています',
          desc: '{path} の中身が不適当です',
        },
        invalidOpsJson: {
          title: 'プレイヤーのopを管理するファイルが壊れています',
          desc: '{path} の中身が不適当です',
        },
        invalidWhitelistJson: {
          title: 'ホワイトリストを管理するファイルが壊れています',
          desc: '{path}の中身が不適当です',
        },
      },
      creationFiled: {
        title: '{type}の生成に失敗しました',
        desc: '{path}の生成ができませんでした',
      },
      dialogCanceled: {
        title: 'ファイル選択ウィンドウがキャンセルされました',
      },
      shellError: {
        title: 'ファイルを開く際に不明なエラーが発生しました',
        desc: '{message}',
      },
    },
    githubAPI: {
      fetchFailed: {
        title: 'GitHubからのデータの取得に失敗しました',
      },
      unknownBlobEncoding: {
        title: 'blobのエンコードが異なっています',
      },
      invalidWorldData: {
        title: 'WorldDataが壊れています',
        desc: '{owner}/{repo}/{branch}のデータを確認してください',
      },
    },
    failJsonFix: {
      title: 'JSONデータの修復に失敗しました',
    },
    hashNotMatch: {
      title: 'ファイルの中身が正しくない可能性があります',
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
        title: '使えない文字が含まれています',
        desc: '半角英数字のみ入力してください',
      },
      alreadyUsed: {
        title: 'この名前({value})は既に使われています',
        desc: '他の名前を使用してください',
      },
    },
    remoteWorldName: {
      notMatchRegex: {
        title: '使えない文字が含まれています',
        desc: '半角英数字のみ入力してください',
      },
      alreadyUsed: {
        title: 'この名前({value})は既に使われています',
        desc: '他の名前を使用してください',
      },
    },
  },
  core: {
    world: {
      invalidWorldId: {
        title: '指定されたワールドが存在しません',
      },
      missingLatestLog: {
        title: '直前のサーバログが存在しません',
      },
      serverPortIsUsed: {
        title: '指定された番号のポートは使用中です',
        desc: "プロパティ'server-port'よりポート番号を{port}から変更してください",
      },
      cannotChangeRunningWorldName: {
        title: '実行中のワールドの名前、保存フォルダは変更できません',
        desc: 'ワールド {name} を停止してから再度試してください',
      },
      cannotDuplicateRunningWorld: {
        title: '実行中のワールドの名前、保存フォルダは変更できません',
        desc: 'ワールド {name} を停止してから再度試してください',
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
        title: 'WorldContainerが登録されていません',
        desc: 'もう一度ご確認ください',
      },
    },
    version: {
      forgeInstallerNotProvided: {
        title: '{version}のforgeのインストーラは提供されていません',
      },
      failSpigotBuild: {
        javaNeeded: {
          title: '{spigotVersion}のspigotのビルドに失敗しました',
          desc: '{minVersion}～{maxVersion}の間のJavaがインストールされている必要があります',
        },
        missingJar: {
          title: 'サーバーのビルドに失敗しました',
          desc: 'ビルドに失敗したバージョン : {spigotVersion}',
        },
      },
      vanillaVersionNotExists: {
        title: 'バージョン{version}のvanillaは存在しません',
      },
    },
    missingPersonalAccessToken: {
      title: '{owner}/{repo}のパーソナルアクセストークンが存在しません',
    },
    minecraftEULANotAccepted: {
      title: 'Minecraftのeulaに同意していません',
    },
    failCacheAddiltionalData: {
      title: '{type}のキャッシュに失敗しました',
    },
    failGetGlobalIP: {
      title: 'グローバルIPの取得に失敗しました',
    },
    update: {
      missingAppSource: {
        title: '最新のリリースにアップデート用ファイルが見つかりません',
      },
    },
  },
  errorDialog: {
    failToGetOwner: 'オーナープレイヤーの取得に失敗しました',
    failOPForOwner: 'OP一覧にオーナープレイヤーを登録できませんでした',
    failToSaveExistedWorld: '配布ワールドの保存に失敗しました',
    failSync: 'ShareWorldの同期に失敗しました',
    failGetShareWorld: 'ShareWorldの取得に失敗しました',
    recoverFail: 'バックアップデータからの復旧に失敗しました',
  },
  lib: {
    ngrok: {
      unreservedAdress: {
        title: 'TCPアドレスが予約されていません',
        desc: '{address}は予約されていません',
      },
      unknown: {
        title: 'ポート開放不要化機能で不明なエラーが発生しました',
        desc: '{message}',
      },
    },
  },
};
