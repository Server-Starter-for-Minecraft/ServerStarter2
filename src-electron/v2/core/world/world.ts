import mitt, { Emitter } from 'mitt';
import { Datapack } from '../../schema/datapack';
import { Mod } from '../../schema/mod';
import { Plugin } from '../../schema/plugin';
import { World, WorldContainer, WorldName } from '../../schema/world';
import { WorldSource } from '../../source/world/world';
import { err, ok, Result } from '../../util/base';
import { serverContainer } from '../setup';
import { runServer } from './server';
import { setupWorld, teardownWorld } from './setup';

/**
 * ワールドを扱うクラスだよ!
 *
 * リスナの登録は worldHandler.emitter.on()
 * リスナの発火は worldHandler.emitter.emit()
 */
export class WorldHandler {
  private world: World;
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

  private constructor(meta: World) {
    this.world = meta;
    this.events = mitt();
    this.robooting = false;

    // 再起動イベントのハンドル
    this.events.on('reboot', () => {
      if (this.robooting) return;
      this.robooting = true;
      this.events.emit('stop');
    });
  }

  /**
   * WorldHandlerを作成
   * @param world
   */
  static async create(
    container: WorldContainer,
    worldName: WorldName
  ): Promise<Result<WorldHandler>> {
    const worldMeta = await WorldSource.getWorldMeta(container, worldName);
    return worldMeta.map((x) => new WorldHandler(x));
  }

  /** データパックを導入 */
  async installDatapack(datapack: Datapack): Promise<Result<void>> {
    // ワールドのメタデータを更新するだけ
  }

  /** プラグインを導入 */
  async installPlugin(plugin: Plugin): Promise<Result<void>> {
    // ワールドのメタデータを更新するだけ
  }

  /** Modを導入 */
  async installMod(mod: Mod): Promise<Result<void>> {
    // ワールドのメタデータを更新するだけ
  }

  /**
   * メタデータを更新
   * @param world
   */
  private updateMeta(world: Partial<World>): Promise<Result<void>> {
    this.world = { ...this.world, ...world };
    return WorldSource.setWorldMeta(this.world);
  }

  /**
   * ワールドを起動して待機
   *
   * ### Errors
   * - WORLD_IS_USING : ワールドがすでに起動中
   * - REQUIRE_EULA_AGREEMENT : Eulaに同意してね
   */
  async run(): Promise<Result<void>> {
    if (this.world.using) return err(new Error('WORLD_IS_USING'));
    if (!this.world.eula) return err(new Error('REQUIRE_EULA_AGREEMENT'));

    // ワールド設定を変更中
    // using = true に設定
    const updateUsing = await this.updateMeta({ using: true });
    if (updateUsing.isErr()) return updateUsing;

    // サーバーデータを作成中
    // サーバーを作成
    const serverResult = await serverContainer.create((dirPath) =>
      setupWorld(dirPath, this.world)
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

      const stop = () => serverContainer.stop(server);
      this.events.on('stop', stop);

      // サーバーを実行
      await runServer(server, { emitStdout, emitStderr });
      this.events.off('stop', stop);

      // 再起動フラグが立っていたらもう一回
    } while (this.robooting);

    // 撤収作業
    return await serverContainer.remove(server, (dirPath) =>
      teardownWorld(dirPath, this.world)
    );
  }
}
