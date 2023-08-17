import { ProgressMessageTranslation } from 'app/src-electron/schema/progressMessage';

export const jaProgress: ProgressMessageTranslation = {
  server: {
    preparing: '{world}を起動中',
    postProcessing: '{world}を閉じています',
    getOwner: 'オーナーのデータを取得中です',
    eula: {
      title: 'EULAの同意状況を確認しています',
      generating: 'eula.txt を生成中です',
      loading: 'eula.txt を読み込み中です',
      saving: 'eula.txt に書き込み中です',
      asking: 'eula.txt に同意するかどうかを問い合わせています'
    },
    local: {
      loading: 'ローカルのワールドデータを読み込み中です',
      saving: 'ローカルにワールドデータを反映しています',
      savingSettingFiles: 'ワールド設定ファイルを保存中です',
      loadSettingFiles: 'ワールド設定ファイルを読み込み中です',
      formatWorldDirectory: 'ワールドのデータ構造を変更中です',
      reloading: 'ワールドデータを再読み込みしています',
			checkUsing: 'ワールドが使用中かどうか確認しています',
			movingSaveData: 'ワールドのデータを移動中です'
    },
		remote: {
			check: 'リモートのデータがあるかどうか確認しています',
			pull: 'リモートのデータをダウンロード中です',
      desc: {
        getPlayerFromUUID: 'UUIDからプレイヤーを取得中です',
        git: 'git.{method} {stage} stage を実行中',
      },
			push: 'リモートにデータをアップロード中です'
		},
    readyJava: {
      title: 'javaランタイムを準備中です',
      file: '{path}を生成中です',
    },
		readyVersion: {
			title: '{version}を準備中です',
      vanilla: {
        fetching: 'サーバーデータをダウンロード中です',
        saving: 'サーバーデータを保存中です'
      },
      spigot: {
        loadBuildJavaVersion: 'ビルド用のJavaバージョンを確認中です',
        readyBuildJava: 'ビルド用Javaの準備中です',
        readyBuildtool: 'ビルドツールを準備中です',
        loadBuildData: 'ビルド情報を取得中です',
        building: 'ビルド中です',
        moving: 'サーバーデータを移動中です'
      },
      papermc: {
        loadBuildData: 'ビルド情報を取得中です',
        readyServerData: 'サーバーデータを準備中です',
      },
      mohistmc: {
        readyServerData: 'サーバーデータを準備中です',
      },
      forge: {
        readyServerData: 'サーバーデータを準備中です',
      },
      fabric: {
        readyServerData: 'サーバーデータを準備中です',
      },
		},
    load: {
      title: 'ワールドデータを読み込み中です',
      loadLocalSetting: 'ローカルの設定ファイルを読み込み中です',
      reloading: 'ローカルの設定ファイルの再読み込み中です',
      aborting: '処理をキャンセルしています',
    },
    save: {
      title: 'ワールドデータを書き込み中です',
      localSetting: 'ローカルの設定ファイルを書き込み中です',
    },
    pull: {
      title: 'リモートからワールドデータをダウンロードしています',
      ready: 'ワールドデータダウンロードの準備中です',
      stage: 'gitで{stage}中(説明文は要検討)',
    },
    push: {
      title: 'リモートにワールドデータをアップロードしています',
      ready: 'ワールドデータアップロードの準備中です',
      stage: 'gitで{stage}中(説明文は要検討)',
    },
    run: {
      before:{
        title: 'ワールド起動前の処理中です',
        memoryArguments: 'Javaのメモリ引数を生成しています',
        userArguments: 'Javaのユーザー定義引数を検証中です',
        getLog4jSettingFile: 'log4Jの設定ファイルをダウンロード中です',
        convertDirectory: 'ファイル構造を修正しています',
      },
      after: {
        title: 'ワールド起動後の処理中です',
      },
    },
  },
};
