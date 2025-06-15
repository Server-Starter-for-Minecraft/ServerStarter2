import { api } from 'app/src-electron/core/api';
import {
  runtimeContainer,
  versionContainer,
} from 'app/src-electron/core/setup';
import { Runtime } from 'app/src-electron/schema/runtime';
import { WorldID } from 'app/src-electron/schema/world';
import { Path } from 'app/src-electron/util/binary/path';
import { interactiveProcess } from 'app/src-electron/util/binary/subprocess';
import { isError, isValid } from 'app/src-electron/util/error/error';
import { Failable } from 'app/src-electron/util/error/failable';
import { osPlatform } from 'app/src-electron/util/os/os';
import { GroupProgressor } from '../../common/progress';
import { ExecRuntime } from '../version/readyVersions/base';
import { WorldSettings } from '../world/files/json';
import { getAdditionalJavaArgument } from './setup/javaArgs';
import { getMemoryArguments } from './setup/memory';

/** サーバー起動前の準備の内容 戻り値はJava実行時引数 */
export async function readyRunServer(
  cwdPath: Path,
  id: WorldID,
  settings: WorldSettings,
  progress: GroupProgressor
): Promise<Failable<{ javaArgs: string[]; javaPath: Path }>> {
  async function readyRuntime(runtime: Runtime) {
    // 実行javaを用意
    const javaSub = progress.subGroup();
    const javaPath = await runtimeContainer.ready(
      runtime,
      osPlatform,
      true,
      javaSub
    );
    javaSub.delete();
    return javaPath;
  }

  async function memoryArg() {
    const sub = progress.subtitle({
      key: 'server.run.before.memoryArguments',
    });
    // 実行メモリ量のJAVA引数
    const result = await getMemoryArguments(settings.memory);
    sub.delete();
    return result;
  }

  async function userArg() {
    const sub = progress.subtitle({
      key: 'server.run.before.userArguments',
    });
    // ユーザー定義JAVA引数
    const additionalJavaArgument = await getAdditionalJavaArgument(
      settings.javaArguments
    );
    sub.delete();
    if (isValid(additionalJavaArgument)) {
      return additionalJavaArgument;
    }
    return [];
  }

  async function serverData() {
    /** フロントエンドにEula同意の伺いを立てる */
    async function eulaAgreementAction(
      url: string
    ): Promise<Failable<boolean>> {
      const sub = progress.subtitle({
        key: 'server.eula.asking',
      });
      const result = await api.invoke.AgreeEula(id, url);
      sub.delete();
      return result;
    }

    /** Spigotのビルド等に使用するランタイムを準備する */
    const execRuntime: ExecRuntime = async (args) => {
      // runtimeが指定されていない場合は最新版を適用
      let targetRuntime = args.runtime;
      if (!targetRuntime) {
        const tmpTargetRuntime = await runtimeContainer.getLatestRuntime(
          osPlatform
        );
        if (isError(tmpTargetRuntime)) return tmpTargetRuntime;
        targetRuntime = tmpTargetRuntime;
      }

      const javaPath = await readyRuntime(targetRuntime);
      if (isError(javaPath)) return javaPath;

      return interactiveProcess(
        javaPath,
        args.args,
        args.onOut,
        args.onOut,
        args.currentDir,
        true,
        undefined,
        10000
      );
    };

    // サーバーデータ準備
    const serverSub = progress.subGroup();
    const server = await versionContainer.readyVersion(
      settings.version,
      cwdPath,
      execRuntime,
      eulaAgreementAction,
      serverSub
    );
    serverSub.delete();
    return server;
  }

  // ユーザーカスタム要素のJVM引数とサーバーJarの情報を取得
  const [memory, user, server] = await Promise.all([
    memoryArg(),
    userArg(),
    serverData(),
  ]);
  if (isError(server)) return server;

  // サーバーJarを実行するためのRuntimeの準備を行う
  const javaPath = await readyRuntime(server.runtime);
  if (isError(javaPath)) return javaPath;

  // JVM引数のまとめ
  // （当該サーバー起動時に必ず必要となる引数`server.getCommand()`に，カスタム要素`{jvmArgs: customJvmArgs}`を追加している）
  const customJvmArgs = [...memory, ...user];
  const javaArgs = server.getCommand({ jvmArgs: customJvmArgs });

  return { javaArgs, javaPath };
}
