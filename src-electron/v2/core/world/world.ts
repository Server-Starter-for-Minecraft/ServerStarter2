import { ServerContainer } from '../../source/server/server';
import { World, WorldMeta } from '../../source/world/world';
import { Result, err, ok } from '../../util/base';
import { runServer } from './server';
import { setupWorld } from './setup';
import mitt, { Emitter } from 'mitt';

/**
 * ワールドを扱うクラスだよ!
 *
 * リスナの登録は worldHandler.emitter.on()
 * リスナの発火は worldHandler.emitter.emit()
 */
export class WorldHandler {
  private world: World;
  private meta: WorldMeta;
  events: Emitter<{
    start: undefined;
    stdout: string;
    stderr: string;
    end: undefined;

    stdin: string;
    restart: string;
    stop: string;
  }>;

  private constructor(world: World, meta: WorldMeta) {
    this.meta = meta;
    this.world = world;
    this.events = mitt();
  }

  private updateMeta(mata: Partial<WorldMeta>): Promise<Result<void>> {
    this.meta = { ...this.meta, ...mata };
    return this.world.setMeta(this.meta);
  }

  static async create(world: World): Promise<Result<WorldHandler>> {
    const meta = await world.getMeta();
    if (meta.isErr()) return meta;
    return ok(new WorldHandler(world, meta.value));
  }

  /**
   * ワールドを起動して待機
   *
   * ### Errors
   * - WORLD_IS_USING : ワールドがすでに起動中
   * - REQUIRE_EULA_AGREEMENT : Eulaに同意してね
   */
  async run() {
    if (this.meta.using) return err(new Error('WORLD_IS_USING'));

    if (!this.meta.eula) return err(new Error('REQUIRE_EULA_AGREEMENT'));

    // ワールド設定を変更中
    // using = true に設定
    const updateUsing = await this.updateMeta({ using: true });
    if (updateUsing.isErr()) return updateUsing;

    // サーバーデータを作成中
    // サーバーを作成
    const serverResult = await ServerContainer.create((path) =>
      setupWorld(path, this.world, this.meta)
    );
    if (serverResult.isErr()) return serverResult;
    const server = serverResult.value;
    // startイベントを発行
    this.events.emit('start');

    const emitStdout = (data: Buffer) =>
      this.events.emit('stdout', data.toString());

    const emitStderr = (data: Buffer) =>
      this.events.emit('stderr', data.toString());

    // サーバーを起動中
    // サーバーを実行
    await runServer(server, { emitStdout, emitStderr });
  }
}
