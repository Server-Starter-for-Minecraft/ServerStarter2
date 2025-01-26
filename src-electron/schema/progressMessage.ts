/**
 * TODO: フロントエンドへの通信内容変更時に必要があれば更新する
 */

import {
  FlattenMessages,
  MessageContent,
  MessageTranslation,
} from '../util/message/base';
import { Remote } from './remote';
import { Version } from './version';

type WorldMessageContent = MessageContent<{ world: string; container: string }>;

type HProgressMessage = {
  server: {
    /** サーバーを起動前処理 ({container}/{world}) */
    preparing: WorldMessageContent;

    /** サーバーの終了後処理 ({container}/{world}) */
    postProcessing: WorldMessageContent;

    /** オーナーのデータの取得中 */
    getOwner: MessageContent;

    eula: {
      /** EULAの同意状況を確認中 */
      title: MessageContent;

      /** eula.txtを生成中 */
      generating: MessageContent;

      /** eula.txtを読み込み中 */
      loading: MessageContent;

      /** eula.txtを書き込み中 */
      saving: MessageContent;

      /** eula.txtに同意するかどうか問い合わせ中 */
      asking: MessageContent;
    };

    local: {
      /** ローカルのワールドデータを読み込み中 */
      loading: MessageContent;

      /** ローカルにワールドデータ反映中 */
      saving: MessageContent;

      /** ワールド設定ファイルを保存中 */
      savingSettingFiles: MessageContent;

      /** ワールド設定ファイルを読み込み中 */
      loadSettingFiles: MessageContent;

      /** ワールドのデータ構造を変更中 */
      formatWorldDirectory: MessageContent;

      /** ローカルのワールドデータを再読み込み中 */
      reloading: MessageContent;

      /** ワールドが使用中かどうか確認 */
      checkUsing: MessageContent;

      /** ローカルのワールドデータを移動中 */
      movingSaveData: WorldMessageContent;
    };

    remote: {
      /** リモートのデータがあるかどうか確認中 */
      check: MessageContent;

      /** リモートのデータをダウンロード中 */
      pull: MessageContent<{
        remote: Remote;
      }>;

      /** リモートのデータを修正中 */
      fixing: MessageContent;

      /** リモート操作の説明 */
      desc: {
        getPlayerFromUUID: MessageContent<{ uuid: string }>;

        /**
         * simpleGitのプログレスを反映
         * https://github.com/steveukx/git-js/blob/main/docs/PLUGIN-PROGRESS-EVENTS.md
         */
        git: MessageContent<{
          /** pull / push ... */
          method: string;
          /** pull / push ... */
          stage: string;
        }>;
      };

      /** リモートにデータをアップロード中 */
      push: MessageContent<{
        remote: Remote;
      }>;
    };

    readyJava: {
      /** Javaランタイムを準備中 */
      title: MessageContent;

      /** {path}を生成中 */
      file: MessageContent<{ path: string }>;
    };

    readyVersion: {
      /** {version}を準備中 */
      title: MessageContent<{ version: Version }>;

      vanilla: {
        /** サーバーデータをダウンロード中 */
        fetching: MessageContent;

        /** サーバーデータを保存中 */
        saving: MessageContent;
      };

      spigot: {
        /** ビルド用のJavaのバージョンを確認中 */
        loadBuildJavaVersion: MessageContent;

        /** ビルド用のJavaを準備中 */
        readyBuildJava: MessageContent;

        /** ビルドツールを準備中 */
        readyBuildtool: MessageContent;

        /** ビルド情報を取得中 */
        loadBuildData: MessageContent;

        /** ビルド中 */
        building: MessageContent;

        /** サーバーデータを移動中 */
        moving: MessageContent;
      };

      papermc: {
        /** ビルド情報を取得中 */
        loadBuildData: MessageContent;

        /** サーバーデータを準備中 */
        readyServerData: MessageContent;
      };

      mohistmc: {
        /** サーバーデータを準備中 */
        readyServerData: MessageContent;
      };

      forge: {
        /** サーバーデータを準備中 */
        readyServerData: MessageContent;
      };

      fabric: {
        /** サーバーデータを準備中 */
        readyServerData: MessageContent;
      };
    };

    /** ワールドデータの読み込みに関する処理 */
    load: {
      /** ワールドデータを読み込み中 */
      title: MessageContent;

      /** ローカルの設定ファイルを読み込み中 */
      loadLocalSetting: MessageContent;

      /** ローカルの設定を再読み込み中 */
      reloading: MessageContent;

      /** 処理をキャンセル中 */
      aborting: MessageContent;
    };

    /** ワールドデータの書き込みに関する処理 */
    save: {
      /** ワールドデータを書き込み中 */
      title: MessageContent;

      /** ローカルの設定ファイルを保存中 */
      localSetting: MessageContent;
    };

    /** ワールドデータのpullに関する処理 */
    pull: {
      /** リモートからワールドデータをダウンロード中 */
      title: MessageContent;

      /** pullの準備中 */
      ready: MessageContent;

      /** gitの実行段階を表す？要検証 */
      stage: MessageContent<{ stage: string }>;
    };

    /** ワールドデータのpushに関する処理 */
    push: {
      /** リモートにワールドデータをアップロード中 */
      title: MessageContent;

      /** pushの準備中 */
      ready: MessageContent;

      /** gitの実行段階を表す？要検証 */
      stage: MessageContent<{ stage: string }>;
    };

    /** ワールドの実行に関する処理 */
    run: {
      before: {
        /** ワールド起動前の処理 */
        title: MessageContent;

        /** Javaのメモリ引数の生成中 */
        memoryArguments: MessageContent;

        /** Javaのユーザー定義引数の検証中 */
        userArguments: MessageContent;

        /** log4Jの設定ファイルをダウンロード中 */
        getLog4jSettingFile: MessageContent<{ path: string }>;

        /** ファイル構造を修正中 */
        convertDirectory: MessageContent;
      };
      after: {
        /** ワールド起動後の処理 */
        title: MessageContent;
      };
    };
  };
};

/** プログレスメッセージ自体のデータ構造 */
export type ProgressMessage = FlattenMessages<HProgressMessage>;

/** プログレスメッセージ翻訳用データ構造 */
export type ProgressMessageTranslation = MessageTranslation<HProgressMessage>;
