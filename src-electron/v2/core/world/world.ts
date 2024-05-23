import { DatapackDomain } from '../../schema/datapack';
import { ModDomain } from '../../schema/mod';
import { PluginDomain } from '../../schema/plugin';
import { WorldDomain } from '../../schema/world';
import { ServerContainer } from '../../source/server/server';
import { World } from '../../source/world/world';
import { Result, err, ok } from '../../util/base';
import { runServer } from './server';
import { setupWorld, teardownWorld } from './setup';
import mitt, { Emitter } from 'mitt';

/**
 * ワールドを扱うクラスだよ!
 *
 * リスナの登録は worldHandler.emitter.on()
 * リスナの発火は worldHandler.emitter.emit()
 */
export class WorldHandler {
  private world: World;
  private meta: WorldDomain;
  private robooting: boolean;

  events: Emitter<{
    start: undefined;
    stdout: string;
    stderr: string;
    end: undefined;
    stdin: string;
    reboot: undefined;
    stop: undefined;
  }>;

  private constructor(world: World, meta: WorldDomain) {
    this.meta = meta;
    this.world = world;
    this.events = mitt();
    this.robooting = false;

    this.events.on('reboot', () => {
      this.robooting = true;
      this.events.emit('stop');
    });
  }

  /**
   * WorldHandlerを作成
   * @param world
   */
  static async create(world: World): Promise<Result<WorldHandler>> {
    const meta = await world.getMeta();
    if (meta.isErr()) return meta;
    return ok(new WorldHandler(world, meta.value));
  }

  /** データパックを導入 */
  async installDatapack(datapack: DatapackDomain): Promise<Result<void>> {}

  /** プラグインを導入 */
  async installPlugin(plugin: PluginDomain): Promise<Result<void>> {}

  /** Modを導入 */
  async installMod(mod: ModDomain): Promise<Result<void>> {}

  /**
   * メタデータを更新
   * @param world
   */
  private updateMeta(mata: Partial<WorldDomain>): Promise<Result<void>> {
    this.meta = { ...this.meta, ...mata };
    return this.world.setMeta(this.meta);
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
    const serverResult = await ServerContainer.create((dirPath) =>
      setupWorld(dirPath, this.world, this.meta)
    );
    if (serverResult.isErr()) return serverResult;
    const server = serverResult.value;

    // startイベントを発行
    this.events.emit('start');

    const emitStdout = (data: Buffer) =>
      this.events.emit('stdout', data.toString());

    const emitStderr = (data: Buffer) =>
      this.events.emit('stderr', data.toString());

    do {
      this.robooting = false;

      const stop = () => server.stop();
      this.events.on('stop', stop);

      // サーバーを実行
      await runServer(server, { emitStdout, emitStderr });
      this.events.off('stop', stop);

      // 再起動フラグが立っていたらもう一回
    } while (this.robooting);

    // 撤収作業
    await server.remove((dirPath) => teardownWorld(dirPath, this.world));
  }
}
