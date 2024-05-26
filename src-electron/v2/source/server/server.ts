import { ok } from 'assert';
import { Opt, Result } from '../../util/base';
import { Path } from '../../util/binary/path';
import { Subprocess } from '../../util/binary/subprocess';
import { TempDir } from '../../util/tampDir';

export type ServerMeta = {
  command: {
    process: string;
    args: string[];
  };
};

/**
 * すべてのサーバーを格納するフォルダのような何か
 */
export abstract class ServerContainer {
  dir: TempDir;

  constructor(path: Path) {
    this.dir = new TempDir(path);
  }

  /**
   * サーバー一覧を表示
   *
   * ソフトが起動しているときに実行すると実行中のサーバー一覧が得られる
   *
   * ソフトが起動するときに実行すると、前回起動時に正常に終了しなかったサーバー一覧が得られる
   */
  list(): Promise<Result<Server[]>>;

  /**
   * サーバーを実行するために一時的なフォルダを作成しServerMetaを返す
   *
   * 実行に失敗したらディレクトリの中身を全削除して終了
   *
   * @param setup 展開先のパスを受け取ってワールドを展開後、実行に必要な情報を返す関数 展開に失敗した場合は元の状態を維持
   */
  async create(
    setup: (dirPath: Path) => Promise<Result<ServerMeta>>
  ): Promise<Result<Server>> {
    const dirPath = this.dir.tmpChild();
    const serverMeta = await setup(dirPath);
    if (serverMeta.isErr)
    return;
  }
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
