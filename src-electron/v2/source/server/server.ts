import { ok } from 'assert';
import { Opt, Result, err } from '../../util/base';
import { Path } from '../../util/binary/path';
import { Subprocess } from '../../util/binary/subprocess';
import { NewType } from '../../util/type/newtype';
import { randomString } from '../../util/random/ramdomString';
import { Server } from '../../schema/server';


export type ServerId = NewType<string, 'ServerId'>;

/**
 * すべてのサーバーを格納するフォルダのような何か
 */
export abstract class ServerContainer {
  private tempDir: Path;
  processMap: Record<ServerId,Subprocess|undefined>;

  constructor(path: Path) {
    this.tempDir = path;
    this.processMap = {};
  }

  /**
   * サーバー一覧を表示
   *
   * ソフトが起動しているときに実行すると実行中(&作成中 &終了中)のサーバー一覧が得られる
   *
   * ソフトが起動するときに実行すると、前回起動時に正常に終了しなかったサーバー一覧が得られる
   */
  list(): Promise<Result<ServerId[]>> {}

  private cwdPath(serverId:ServerId){
    return this.tempDir.child(serverId)
  }

  private mataPath(serverId:ServerId){
    return this.cwdPath(serverId).child('server.ssmeta')
  }

  /** サーバーのメタデータ (実行時引数等) を取得 */
  async getMeta(serverId:ServerId): Promise<Result<Server>>{
    this.mataPath(serverId).writeText(JSON.stringify(meta))
  }

  /** サーバーのメタデータ (実行時引数等) を取得 */
  async setMeta(serverId:ServerId,meta:Server): Promise<Result<void>>{
    this.mataPath(serverId).writeText(JSON.stringify(meta))
  }

  /**
   * サーバーを実行するために一時的なフォルダを作成しServerMetaを返す
   *
   * 実行に失敗したらディレクトリの中身を全削除して終了
   *
   * @param setup 展開先のパスを受け取ってワールドを展開後、実行に必要な情報を返す関数 展開に失敗した場合は元の状態を維持
   */
  async create(
    setup: (dirPath: Path) => Promise<Result<Server>>
  ): Promise<Result<ServerId>> {
    // TODO: 衝突時の対応がいる NewWorld_1 等の実装とも共通化したい
    const serverId = randomString() as ServerId;

    const dirPath = this.cwdPath(serverId)

    return (await setup(dirPath)).map(() => serverId);
  }

  /** サーバーを起動 */
  async start(serverId: ServerId): Result<void> {
    if (this.processMap[serverId] === undefined) return err(new Error('SERVER_IS_RUNNING'))
    const dirPath = this.cwdPath(serverId)
    dirPath
  }

  /**
   * サーバーを終了
   * papermc / mohistmc (どっちだっけ?) では stopを打つだけだとサーバーが終了しないバージョンがあるので注意
   */
  async stop(serverId: ServerId): Result<void> {

  }

  /**
   * サーバーを撤収
   * @param teardown 撤収前にディレクトリに対して行う操作 ワールドデータの変更を反映させるのが主
   */
  remove(
    teardown: (dirPath: Path) => Promise<Result<void>>
  ): Promise<Result<void>> {
    await teardown()
  }
}
