import mitt, { Emitter } from 'mitt';
import { Path } from 'src-electron/v2/util/binary/path';
import { DatapackMeta } from '../../schema/datapack';
import { Mod } from '../../schema/mod';
import { OsPlatform } from '../../schema/os';
import { Plugin } from '../../schema/plugin';
import { Runtime } from '../../schema/runtime';
import { World, WorldLocation } from '../../schema/world';
import { RuntimeContainer } from '../../source/runtime/runtime';
import { VersionContainer } from '../../source/version/version';
import { WorldSource } from '../../source/world/world';
import { err, ok, Result } from '../../util/base';
import { Subprocess } from '../../util/binary/subprocess';

/**
 * ワールドを扱うクラスだよ!
 *
 * リスナの登録は worldHandler.emitter.on()
 * リスナの発火は worldHandler.emitter.emit()
 */
export class WorldHandler {
  private robooting: boolean;
  private event: Result<
    Emitter<{ stdin: string; stdout: string; stderr: string }>,
    void
  >;

  private constructor(
    private source: WorldSource,
    private versionContainer: VersionContainer,
    private runtimeContainer: RuntimeContainer,
    private osPlatform: OsPlatform,
    private location: WorldLocation,
    private world: World
  ) {
    this.robooting = false;
    this.event = err();
  }

  /**
   * WorldHandlerを作成
   * @param world
   */
  static async create(
    source: WorldSource,
    versionContainer: VersionContainer,
    runtimeContainer: RuntimeContainer,
    osPlatform: OsPlatform,
    location: WorldLocation
  ): Promise<Result<WorldHandler>> {
    const worldMeta = await source.getWorldMeta(location);
    return worldMeta.onOk((x) =>
      ok(
        new WorldHandler(
          source,
          versionContainer,
          runtimeContainer,
          osPlatform,
          location,
          x
        )
      )
    );
  }

  runCommand(command: string) {
    this.event.onOk((x) =>
      ok(x.emit('stdin', `${command}\n` /** 改行が必要 */))
    );
  }

  /** データパックを導入 */
  async installDatapack(datapack: DatapackMeta): Promise<Result<void>> {
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
  updateMeta(world: Partial<World>): Promise<Result<void>> {
    this.world = { ...this.world, ...world };
    return this.source.setWorldMeta(this.location, this.world);
  }

  /**
   * ワールドを起動して待機
   *
   * @param onStart このタイミングではまだサーバーは実行されていないため、runCommandは効かない
   */
  async run(options: {
    onStart(): {
      onStdout(value: string): void;
      onStderr(value: string): void;
    };
  }): Promise<Result<void>> {
    if (this.world.using) return err.error('WORLD_IS_USING');

    // ワールド設定を変更中
    // using = true に設定
    const updateUsing = await this.updateMeta({ using: true });
    if (updateUsing.isErr) return updateUsing;

    // サーバーデータを作成中
    const setupResult = await this.setupWorld();
    if (setupResult.isErr) return setupResult;
    const runServer = setupResult.value();

    const event = mitt<{ stdin: string; stdout: string; stderr: string }>();
    const spawnProcessOrError = await runServer(event);
    if (spawnProcessOrError.isErr) return spawnProcessOrError;

    const { spawnProcess } = spawnProcessOrError.value();

    // startイベントを発行
    const { onStdout, onStderr } = options.onStart();

    this.event = ok(event);
    event.on('stdout', onStdout);
    event.on('stderr', onStderr);

    do {
      this.robooting = false;
      // サーバーを実行
      const processResult = await spawnProcess();
      if (processResult.isErr) return processResult;

      // 再起動フラグが立っていたらもう一回
    } while (this.robooting);

    this.event = err();

    // additionalの撤収

    // 撤収作業
    return await this.source.packWorldData(this.location);
  }

  /**
   * @returns サーバーを実行する関数
   */
  private async setupWorld() {
    if (this.world.version.type === 'unknown')
      return err.error('CANNOT_RUN_UNKNOWN_SERVER');

    const serverPathOrError = await this.source.extractWorldData(this.location);
    if (serverPathOrError.isErr) return serverPathOrError;
    const serverPath = serverPathOrError.value();

    // TODO: データパックを展開
    // TODO: プラグインを展開
    // TODO: modを展開

    // バーションを導入
    const versionResultOrError = await this.versionContainer.readyVersion(
      this.world.version,
      serverPath,
      async ({ runtime, args, currentDir, onOut }) => {
        const event = mitt<{ stdin: string; stdout: string; stderr: string }>(
          new Map([
            ['stdout', [(x: string) => onOut(ok(x))]],
            ['stderr', [(x: string) => onOut(err(x))]],
          ])
        );
        const spawnProcessOrError = await this.execRuntime({
          runtime,
          args,
          currentDir,
          event,
        });
        if (spawnProcessOrError.isErr) return spawnProcessOrError;
        const { spawnProcess } = spawnProcessOrError.value();
        return spawnProcess();
      },
      () => this.eulaAgreement()
    );
    if (versionResultOrError.isErr) return versionResultOrError;
    const versionResult = versionResultOrError.value();

    // ワールドの展開に成功
    return ok(
      async (
        event: Emitter<{ stdin: string; stdout: string; stderr: string }>
      ) => {
        return this.execRuntime({
          runtime: versionResult.runtime,
          args: versionResult.getCommand({ jvmArgs: [] }),
          currentDir: serverPath,
          event,
        });
      }
    );
  }

  /**
   * eulaの同意を求める
   * TODO: 実装
   */
  private async eulaAgreement() {
    return ok(true);
  }

  private async execRuntime(options: {
    runtime: Runtime;
    args: string[];
    currentDir: Path;
    event: Emitter<{ stdin: string; stdout: string; stderr: string }>;
  }): Promise<
    Result<{
      spawnProcess: () => Promise<Result<void>>;
    }>
  > {
    const pathOrError = await this.runtimeContainer.ready(
      options.runtime,
      this.osPlatform,
      true
    );
    if (pathOrError.isErr) return pathOrError;
    const runtimePath = pathOrError.value();

    const spawnProcess = async () => {
      const sub = Subprocess.spawn(runtimePath.path, options.args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: options.currentDir.path,
      });
      const stdout = await sub.stdout.value().stream;
      const stderr = await sub.stderr.value().stream;
      stdout.on('data', (x: Buffer) =>
        options.event.emit('stdout', x.toString())
      );
      stderr.on('data', (x: Buffer) =>
        options.event.emit('stderr', x.toString())
      );

      const write = (val: string) => {
        sub.subprocess.stdin?.write(val);
      };
      options.event.on('stdin', write);
      const result = await sub.promise();
      options.event.off('stdin', write);

      // プロセスがコード0以外もしくはシグナルによって終了した場合はエラーとみなす
      return result.onOk((x) =>
        x === 0 ? ok() : err.error(`PROCESS_FAILED:${x}`)
      );
    };

    return ok({ spawnProcess });
  }
}

/** In Source Testing */
if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;
  const { Path } = await import('src-electron/v2/util/binary/path');
  const path = await import('path');

  // 一時使用フォルダを初期化
  const workPath = new Path(path.dirname(__dirname)).child(
    'work',
    path.basename(__filename, '.ts')
  );
  workPath.mkdir();

  test(
    '',
    async () => {
      const handler = await WorldHandler.create(
        new WorldSource(),
        new VersionContainer(workPath.child('version')),
        new RuntimeContainer(workPath.child('runtime'), async () =>
          err.error('TODO: NOT_IMPLEMENTED')
        ),
        'windows-x64',
        WorldLocation.parse({
          container: {
            path: workPath.child('worlds').path,
            containerType: 'local',
          },
          worldName: 'test001',
        })
      ).then((x) => x.value());

      handler.updateMeta({
        version: {
          type: 'vanilla',
          id: '1.20.1',
          release: true,
        },
        using: false,
      });

      const promise = handler.run({
        onStart() {
          setTimeout(() => {
            handler.runCommand('say hello\n');
            handler.runCommand('stop\n');
          }, 10000);
          return {
            onStderr(value) {
              console.error(value);
            },
            onStdout(value) {
              console.log(value);
            },
          };
        },
      });

      expect((await promise).isOk).toBe(true);
    },
    1000 * 1000
  );
}
