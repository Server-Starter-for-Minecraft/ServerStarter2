import { Opt, Result } from '../../util/base';
import { Path } from '../../util/binary/path';
import { Subprocess } from '../../util/binary/subprocess';

export type ServerMeta = {
  command: {
    process: string;
    args: string[];
  };
};

/**
 * サーバーを格納するフォルダのような何か
 * シングルトン
 */
export abstract class ServerContainer {
  /**
   * コンテナ内のサーバー一覧を表示
   *
   * ソフトが起動しているときに実行すると実行中のサーバー一覧が得られる
   *
   * ソフトが起動するときに実行すると、前回起動時に正常に終了しなかったサーバー一覧が得られる
   */
  static list(): Promise<Result<Server[]>>;

  /**
   * サーバーを作成し実行開始、Serverインスタンスを返す
   *
   * 実行に失敗したらディレクトリの中身を全削除して終了
   *
   * @param setup 展開先のパスを受け取ってワールドを展開後、実行に必要な情報を返す関数 展開に失敗した場合は元の状態を維持
   */
  static create(
    setup: (dirPath: Path) => Promise<Result<ServerMeta>>
  ): Promise<Result<Server>>;
}

export class Server {
  readonly process: Opt<Subprocess>;
  constructor(process: Opt<Subprocess>) {
    this.process = process;
  }

  /** サーバーを起動 */
  start(): Result<void> {}

  /**
   * サーバーを終了
   * papermc / mohistmc (どっちだっけ?) では stopを打つだけだとサーバーが終了しないバージョンがあるので注意
   */
  stop(): Result<void> {}

  /**
   * サーバーを撤収
   * @param teardown 撤収前にディレクトリに対して行う操作 ワールドデータの変更を反映させるのが主
   */
  remove(
    teardown: (dirPath: Path) => Promise<Result<void>>
  ): Promise<Result<void>> {}
}
