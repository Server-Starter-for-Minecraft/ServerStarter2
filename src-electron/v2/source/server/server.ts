import { spawn } from 'child_process';
import { Server, serverValidator } from '../../schema/server';
import { err, ok, Result } from '../../util/base';
import { Bytes } from '../../util/binary/bytes';
import { Path } from '../../util/binary/path';
import { Subprocess } from '../../util/binary/subprocess';
import { sleep } from '../../util/promise/sleep';
import { randomString } from '../../util/random/ramdomString';
import { NewType } from '../../util/type/newtype';
import { JsonFile } from '../../util/wrapper/jsonFile';

export type ServerId = NewType<string, 'ServerId'>;

/**
 * すべてのサーバーを格納するフォルダのような何か
 */
export class ServerContainer {
  private tempDir: Path;
  private processMap: Record<ServerId, Subprocess | undefined>;

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
  async list(): Promise<Result<ServerId[]>> {
    return ok((await this.tempDir.iter()).map((x) => x.basename() as ServerId));
  }

  private cwdPath(serverId: ServerId) {
    return this.tempDir.child(serverId);
  }

  private mataJson(serverId: ServerId) {
    return new JsonFile(
      this.cwdPath(serverId).child('server.ssmeta'),
      serverValidator
    );
  }

  /** サーバーのメタデータ (実行時引数等) を取得 */
  async getMeta(serverId: ServerId): Promise<Result<Server>> {
    return await this.mataJson(serverId).read();
  }

  /** サーバーのメタデータ (実行時引数等) を上書き */
  async setMeta(serverId: ServerId, meta: Server): Promise<Result<void>> {
    return await this.mataJson(serverId).write(meta);
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

    const dirPath = this.cwdPath(serverId);
    const server = await setup(dirPath);

    if (server.isErr()) return server;

    // メタデータを保存
    this.setMeta(serverId, server.value);

    return ok(serverId);
  }

  /** サーバーを起動 */
  async start(serverId: ServerId): Promise<Result<Subprocess>> {
    // 実行中の場合エラー
    if (this.processMap[serverId] !== undefined)
      return err(new Error('SERVER_IS_RUNNING'));
    const dirPath = this.cwdPath(serverId);
    const meta = await this.getMeta(serverId);
    if (meta.isErr()) return meta;

    const process = Subprocess.spawn(
      meta.value.command.process,
      meta.value.command.args,
      {
        cwd: dirPath.toStr(),
        stdio: 'pipe',
      }
    );

    this.processMap[serverId] = process;

    return ok(process);
  }

  /**
   * サーバーを終了
   * papermc / mohistmc (どっちだっけ?) では stopを打つだけだとサーバーが終了しないバージョンがあるので注意
   */
  async stop(serverId: ServerId): Promise<Result<void>> {
    // 実行中でない場合エラー
    const process = this.processMap[serverId];
    if (process === undefined) return err(new Error('SERVER_NOT_RUNNING'));

    // stopコマンドを送信
    await Bytes.fromString('stop').into(process);

    // stopコマンドを送信して10分経ってもプロセスが生きていた場合 kill する
    const WAIT_PROCESS_MS = 10 * 60 * 1000;

    const result = await Promise.any([
      process.promise(),
      sleep(WAIT_PROCESS_MS),
    ]);

    // Resultが返ってきた場合 プロセスが終了したので問題なし
    if (result) return ok(undefined);

    // プロセスキル
    const success = process.subprocess.kill();
    if (success) {
      await process.promise();

      // processMap からプロセスを削除
      this.processMap[serverId] = undefined;

      return ok(undefined);
    } else {
      return err(new Error('PROCESS_KILL_FAILED'));
    }
  }

  /**
   * サーバーを撤収してディレクトリを削除
   *
   * 撤収に失敗した場合はそのまま残り続ける
   *
   * @param teardown 撤収前にディレクトリに対して行う操作 ワールドデータの変更を反映させるのが主
   */
  async remove(
    serverId: ServerId,
    teardown: (dirPath: Path) => Promise<Result<void>>
  ): Promise<Result<void>> {
    // 実行中の場合エラー
    if (this.processMap[serverId] !== undefined)
      return err(new Error('SERVER_IS_RUNNING'));

    const dirPath = this.cwdPath(serverId);
    const tearResult = await teardown(dirPath);
    if (tearResult.isErr()) return tearResult;
    return ok(await dirPath.remove());
  }
}
