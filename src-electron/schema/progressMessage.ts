import {
  FlattenMessages,
  MessageContent,
  MessageTranslation,
} from '../util/message/base';
import { Remote } from './remote';

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

      /** リモートにデータをアップロード中 */
      push: MessageContent<{
        remote: Remote;
      }>;
    };

    java: {
      /** メモリ容量に関する実行時引数を取得 */
      memoryArguments: MessageContent;

      /** ユーザー設定の実行時引数を取得 */
      userArguments: MessageContent;
    };

    version: {
      /** log4Jの設定ファイルをダウンロード中 */
      getLog4jSettingFile: MessageContent<{ path: string }>;
    };
  };
};

/** プログレスメッセージ自体のデータ構造 */
export type ProgressMessage = FlattenMessages<HProgressMessage>;

/** プログレスメッセージ翻訳用データ構造 */
export type ProgressMessageTranslation = MessageTranslation<HProgressMessage>;
