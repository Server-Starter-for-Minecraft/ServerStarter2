import { getLog4jArg } from './log4j';
import {
  Failable,
  isFailure,
  isSuccess,
  runOnSuccess,
} from '../../api/failable';
import { needEulaAgreement, readyVersion } from '../version/version';
import { readyJava } from '../../util/java/java';
import {
  removeServerSettingFiles,
  saveWorldSettingsJson,
  unfoldSettings,
} from '../settings/settings';
import { interactiveProcess } from '../../util/subprocess';
import { api } from '../api';
import { checkEula } from './eula';
import { LEVEL_NAME } from '../const';
import { worldContainerToPath } from '../world/worldContainer';
import { pullRemoteWorld, pushRemoteWorld } from '../remote/remote';
import { Path } from 'src-electron/util/path';
import { loadWorldJson } from '../settings/worldJson';
import { systemSettings } from '../stores/system';
import { JavaComponent } from '../version/vanilla';
import { VersionComponent } from '../version/base';
import { installAdditionals } from '../installer/installer';
import { rootLoggerHierarchy } from '../logger';
import { parseCommandLine } from 'src-electron/util/commandLineParser';
import { World, WorldID } from 'src-electron/schema/world';
import { foldSettings } from '../settings/settings';
import { getMemoryArguments } from './memory';
import { getAdditionalJavaArgument, javaEncodingToUtf8 } from './javaArgs';

class WorldUsingError extends Error {}

class ServerRunner {
  stdin: undefined | ((command: string) => Promise<void>) = undefined;
  args: string[];
  cwdPath: Path;
  world: World;

  constructor(world: World, cwdPath: Path) {
    // コマンド引数の設定
    this.cwdPath = cwdPath;
    this.world = world;
    this.args = [];
  }

  private sendUpdateStatus(message: string) {
    api.send.UpdateStatus(this.world.id, message);
  }

  /** log4jの脆弱性を回避 */
  private async handleLog4j() {}

  /** 設定ファイルを展開 */
  private async unrollWorldSettings() {
    const world = this.world;
    // 設定ファイルをサーバーCWD直下に書き出す
    this.sendUpdateStatus('サーバー設定ファイルの展開中');
    world.properties['level-name'] = LEVEL_NAME;
    await unfoldSettings(this.cwdPath, world);
  }

  /** Eulaチェック(拒否した場合エラーを返す) */
  private async checkEula(server: VersionComponent, javaPath: Path) {
    const needEula = needEulaAgreement(this.world.version);
    // Eulaチェックが必要かどうかの検証に失敗した場合エラー
    if (isFailure(needEula)) return needEula;

    if (!needEula) return undefined;

    // Eulaチェック
    this.sendUpdateStatus('Eulaの同意状況を確認中');
    const eulaAgreement = await checkEula(
      this.world.id,
      javaPath,
      server.programArguments,
      this.cwdPath
    );

    // Eulaチェックに失敗した場合エラー
    if (isFailure(eulaAgreement)) return eulaAgreement;

    // Eulaに同意しなかった場合エラー
    if (!eulaAgreement) {
      return new Error(
        'To start server, you need to agree to Minecraft EULA (https://aka.ms/MinecraftEULA)'
      );
    }
  }

  /** javaのサブプロセスを起動 */
  private async awaitServerProcess(javaPath: Path) {
    // javaのサブプロセスを起動
    // TODO: エラー出力先のハンドル

    const addConsole = (chunk: string) =>
      api.send.AddConsole(this.world.id, chunk);

    const process = interactiveProcess(
      javaPath.absolute().str(),
      this.args,
      addConsole,
      addConsole,
      this.cwdPath.absolute().str(),
      true,
      // アプリケーション終了時/stopコマンドを実行 (実行から10秒のタイムアウトでプロセスキル)
      async (process) => {
        await process.write('stop');
        await process;
      },
      10000
    );

    // フロントエンドからの入力を受け付ける
    this.stdin = process.write;

    // サーバー起動をWindowに知らせる
    api.send.StartServer(this.world.id);

    // サーバー終了まで待機
    const result = await process;

    // サーバー起動をWindowに知らせる
    api.send.FinishServer(this.world.id);

    // フロントエンドからの入力を無視
    this.stdin = undefined;

    return result;
  }

  /** op/whitelist/propertiesの内容を読み込んでサーバー実行中の更新を反映 */
  private async updateAuthority(): Promise<void> {
    const { players, properties } = await foldSettings(this.cwdPath);
    this.world.players = players;
    this.world.properties = properties;
  }

  async runServer(world: World): Promise<Failable<World>> {
    // ワールドが起動中の場合エラー
    if (world.using)
      return new WorldUsingError(
        `world ${world.name} is running by ${world.last_user ?? '<annonymous>'}`
      );

    const javaArgs: string[] = [];

    // JAVAのstdioのエンコードをutf-8に
    javaArgs.push(...javaEncodingToUtf8());

    // 実行メモリ量のJAVA引数
    javaArgs.push(...(await getMemoryArguments(world.memory)));

    // ユーザー定義JAVA引数
    const additionalJavaArgument = await getAdditionalJavaArgument(world);
    if (isFailure(additionalJavaArgument)) {
      // TODO: エラーの伝達方法を変更
      this.sendUpdateStatus(additionalJavaArgument.toString());
    } else {
      javaArgs.push(...additionalJavaArgument);
    }

    // サーバーデータ準備
    this.sendUpdateStatus(
      `サーバーデータを準備中 ${world.version.id} (${world.version.type})`
    );
    const server = await readyVersion(world.version, this.cwdPath);
    // サーバーデータの用意ができなかった場合エラー
    if (isFailure(server)) return server;

    // 実行javaを用意
    this.sendUpdateStatus(`javaランタイムを準備中 (${server.component})`);
    const javaPath = await readyJava(server.component, true);
    // 実行javaが用意できなかった場合エラー
    if (isFailure(javaPath)) return javaPath;

    // log4jの設定
    this.sendUpdateStatus('log4jの引数を設定中');
    const log4jarg = await getLog4jArg(this.cwdPath, this.world.version);
    // log4jのファイルがダウンロードできなかった場合エラー
    if (isFailure(log4jarg)) return log4jarg;
    // log4j引数を実行時引数に追加
    if (log4jarg) javaArgs.push(log4jarg);

    // Eulaの同意チェック
    const eulaResult = await this.checkEula(server, javaPath);
    if (isFailure(eulaResult)) return eulaResult;

    // ワールド設定を展開
    await this.unrollWorldSettings();

    // サーバーのjarファイル参照を実行時引数に追加
    javaArgs.push(...server.programArguments, '--nogui');

    // ワールド設定を展開
    const processResult = await this.awaitServerProcess(javaPath);

    // 権限を更新
    await this.updateAuthority();

    if (isFailure(processResult)) return processResult;
  }

  async runCommand(command: string) {
    if (this.stdin === undefined)
      return new Error(`World ${this.world.id} is not in running`);

    if (command == 'reboot') {
      // TODO: 再起動に関する実装を行う
    } else {
      await this.stdin(command);
      api.send.AddConsole(this.world.id, `/${command}`);
    }
  }
}
