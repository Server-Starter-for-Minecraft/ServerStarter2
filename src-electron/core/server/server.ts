import { getLog4jArg } from './log4j';
import { Failable, isFailure, isSuccess } from '../../api/failable';
import { needEulaAgreement, readyVersion } from '../version/version';
import { readyJava } from '../../util/java/java';
import {
  removeServerSettingFiles,
  saveWorldSettingsJson,
  unrollSettings,
} from '../settings/settings';
import { interactiveProcess } from '../../util/subprocess';
import { api } from '../api';
import { checkEula } from './eula';
import { LEVEL_NAME } from '../const';
import { worldContainerToPath } from '../world/worldContainer';
import { pullRemoteWorld, pushRemoteWorld } from '../remote/remote';
import { Path } from 'src-electron/util/path';
import { loadWorldJson } from '../world/worldJson';
import { systemSettings } from '../stores/system';
import { JavaComponent } from '../version/vanilla';
import { VersionComponent } from '../version/base';
import { installAdditional } from '../installer/installer';
import { rootLoggerHierarchy } from '../logger';
import { parseCommandLine } from 'src-electron/util/commandLineParser';
import { World, WorldAdditional, WorldEdited } from 'app/src-electron/schema/world';
import { MemoryUnit } from 'app/src-electron/schema/memory';

class WorldUsingError extends Error {}

class ServerRunner {
  static stdin: undefined | ((command: string) => Promise<void>) = undefined;

  world: WorldEdited;
  cwdPath: Path;
  args: string[];

  constructor(world: WorldEdited) {
    this.world = world;

    // コマンド引数の設定
    this.args = [];

    // サーバーのCWDパスを得る
    this.cwdPath = worldContainerToPath(world.container).child(world.name);
  }

  private async pull(): Promise<Failable<undefined>> {
    const remote_pull = this.world.remote_pull;
    if (remote_pull === undefined) return;
    await pullRemoteWorld(this.cwdPath, remote_pull);
    // pullしてきたワールドが使用中かどうかを確認し、使用中の場合エラー
    const worldjson = await loadWorldJson(this.cwdPath);
    if (isSuccess(worldjson)) {
      if (worldjson.using)
        return new WorldUsingError(
          `world ${this.world.name} is running by ${
            worldjson.last_user ?? '<annonymous>'
          }`
        );
    }
  }

  /** ワールドの設定を保存しデータをリモートにpushする */
  private async saveAndPush(using: boolean): Promise<Failable<undefined>> {
    api.send.UpdateStatus('不要なファイルを削除中');
    // サーバー実行時のみ必要なファイルを削除
    await removeServerSettingFiles(this.cwdPath);

    this.world.using = using;
    this.world.last_user = systemSettings.get('user').owner;
    this.world.last_date = new Date().getTime();

    this.world.properties ??= {};

    // 使用中の場合level-nameをworldにする
    if (using) {
      this.world.properties['level-name'] = {
        type: 'string',
        value: LEVEL_NAME,
      };
    } else {
      delete this.world.properties['level-name'];
    }

    await this.saveWorldSettingFile();

    const remote_push = this.world.remote_push;
    if (remote_push === undefined) return;

    api.send.UpdateStatus('ワールドデータをアップロード中');
    pushRemoteWorld(this.cwdPath, remote_push);
  }

  /** ワールドが使用中でない限り設定の変更を反映しデータをリモートにpushする */
  private async pushOnNotUsing(result: Failable<World>): Promise<void> {
    if (!(result instanceof WorldUsingError)) {
      await this.saveAndPush(false);
    }
  }

  /** stdin,stdout,stderrの文字コードをutf-8に */
  private setJavaEncoding() {
    this.args.push('"-Dfile.encoding=UTF-8"');
  }

  /** 使用メモリの設定 */
  private setMamoryAmount() {
    const memory = this.world.memory ?? systemSettings.get('world').memory;

    let memorystr = '';

    const memorySize = Math.round(memory.size);

    const lowerunit = memory.unit.toLowerCase() as Lowercase<MemoryUnit>;

    switch (lowerunit) {
      case 'b':
      case '':
        memorystr = `${memorySize}`;
        break;
      case 'kb':
      case 'k':
        memorystr = `${memorySize}K`;
        break;
      case 'mb':
      case 'm':
        memorystr = `${memorySize}M`;
        break;
      case 'gb':
      case 'g':
        memorystr = `${memorySize}G`;
        break;
      case 'tb':
      case 't':
        memorystr = `${memorySize}T`;
        break;
      default:
        rootLoggerHierarchy.server
          .setMamoryAmount(memory)
          .error(`unknown unit ${memory.unit}`);
        return;
    }

    this.args.push(`-Xmx${memorystr}`, `-Xms${memorystr}`);
  }

  /** サーバーデータを用意 */
  private async readyServerData() {
    const world = this.world;
    api.send.UpdateStatus(
      `サーバーデータを準備中 ${world.version.id} (${world.version.type})`
    );
    return await readyVersion(world.version, this.cwdPath);
  }

  /** Javaランタイムを用意 */
  private async readyJavaRuntime(component: JavaComponent) {
    api.send.UpdateStatus(`javaランタイムを準備中 (${component})`);

    // 実行javaを用意
    return await readyJava(component, true);
  }

  /** ワールドのpullが終わるのを待機 */
  private async awaitPull(pulling: Promise<Failable<undefined>>) {
    // ワールドのpullが終わるのを待機
    api.send.UpdateStatus('ワールドデータのダウンロード中');
    return await pulling;
  }

  /** log4jの脆弱性を回避 */
  private async handleLog4j() {
    // log4jの設定
    api.send.UpdateStatus('log4jの引数を設定中');
    const log4jarg = await getLog4jArg(this.cwdPath, this.world.version);

    // log4jのファイルがダウンロードできなかった場合エラー
    if (isFailure(log4jarg)) return log4jarg;

    // log4j引数を実行時引数に追加
    if (log4jarg) this.args.push(log4jarg);
  }

  /** 設定ファイルを展開 */
  private async unrollWorldSettings() {
    const world = this.world;
    // 設定ファイルをサーバーCWD直下に書き出す
    api.send.UpdateStatus('サーバー設定ファイルの展開中');
    world.properties = world.properties ?? {};
    world.properties['level-name'] = { type: 'string', value: LEVEL_NAME };
    await unrollSettings(world, this.cwdPath);
  }

  /** 設定jsonを保存 */
  private async saveWorldSettingFile() {
    // 設定ファイルをサーバーCWD直下に書き出す
    api.send.UpdateStatus('サーバー設定ファイルの保存中');
    await saveWorldSettingsJson(this.world, this.cwdPath);
  }

  /** Eulaチェック(拒否した場合エラーを返す) */
  private async checkEula(server: VersionComponent, javaPath: Path) {
    const needEula = needEulaAgreement(this.world.version);
    // Eulaチェックが必要かどうかの検証に失敗した場合エラー
    if (isFailure(needEula)) return needEula;

    if (!needEula) return undefined;

    // Eulaチェック
    api.send.UpdateStatus('Eulaの同意状況を確認中');
    const eulaAgreement = await checkEula(
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
    const process = interactiveProcess(
      javaPath.absolute().str(),
      this.args,
      api.send.AddConsole,
      api.send.AddConsole,
      this.cwdPath.absolute().str(),
      true
    );
    // フロントエンドからの入力を受け付ける
    ServerRunner.stdin = process.write;

    // サーバー起動をWindowに知らせる
    api.send.StartServer();

    // サーバー終了まで待機
    const result = await process;

    // サーバー起動をWindowに知らせる
    api.send.FinishServer();

    // フロントエンドからの入力を無視
    ServerRunner.stdin = undefined;

    return result;
  }

  private constructWorld(additional: WorldAdditional): World {
    const world = this.world;
    return {
      name: world.name,
      container: world.container,
      version: world.version,
      avater_path: world.avater_path,

      using: world.using,
      last_date: world.last_date,
      last_user: world.last_user,
      memory: world.memory,

      properties: world.properties,
      remote_pull: world.remote_pull,
      remote_push: world.remote_push,
      additional,
    };
  }

  private async _runServer(): Promise<Failable<World>> {
    const world = this.world;

    // ワールドが起動中の場合エラー
    if (world.using)
      return new WorldUsingError(
        `world ${world.name} is running by ${world.last_user ?? '<annonymous>'}`
      );

    // プルを開始
    const pulling = this.pull();

    this.setJavaEncoding();

    this.setMamoryAmount();

    this.setAdditionalJavaArgument();

    const server = await this.readyServerData();
    // サーバーデータの用意ができなかった場合エラー
    if (isFailure(server)) return server;

    const javaPath = await this.readyJavaRuntime(server.component);
    // 実行javaが用意できなかった場合エラー
    if (isFailure(javaPath)) return javaPath;

    const pullResult = await this.awaitPull(pulling);
    // pullに失敗した場合エラー
    // TODO: PAT切れだった場合PATを更新してリトライ
    if (isFailure(pullResult)) return pullResult;

    await this.handleLog4j();

    // datapack,mod,pluginのインストール
    const [additional] = await installAdditional(
      world.additional,
      this.cwdPath
    );

    await this.saveAndPush(true);

    const eulaResult = await this.checkEula(server, javaPath);
    if (isFailure(eulaResult)) return eulaResult;

    await this.unrollWorldSettings();

    // サーバーのjarファイル参照を実行時引数に追加
    this.args.push(...server.programArguments, '--nogui');

    const processResult = await this.awaitServerProcess(javaPath);
    if (isFailure(processResult)) return processResult;

    return this.constructWorld(additional);
  }

  /** ユーザー設定のJavaの実行時引数を反映する */
  private setAdditionalJavaArgument(): Failable<undefined> {
    const arg =
      this.world.javaArguments ?? systemSettings.get('world').javaArguments;
    if (arg === undefined) return;
    const result = parseCommandLine(arg);
    if (isFailure(result)) return result;
    this.args.push(...result);
  }

  private async _saveWorldSettings(): Promise<Failable<World>> {
    const world = this.world;

    // ワールドが起動中の場合エラー
    if (world.using)
      return new WorldUsingError(
        `world ${world.name} is running by ${world.last_user ?? '<annonymous>'}`
      );

    // プルを開始
    const pullResult = await this.awaitPull(this.pull());
    // pullに失敗した場合エラー
    // TODO: PAT切れだった場合PATを更新してリトライ
    if (isFailure(pullResult)) return pullResult;

    // datapack,mod,pluginのインストール
    const [additional] = await installAdditional(
      world.additional,
      this.cwdPath
    );

    return this.constructWorld(additional);
  }

  async runServer(): Promise<Failable<World>> {
    const result = await this._runServer();
    await this.pushOnNotUsing(result);
    return result;
  }

  async saveWorldSettings(): Promise<Failable<World>> {
    const result = await this._saveWorldSettings();
    await this.pushOnNotUsing(result);
    return result;
  }

  static runCommand(command: string) {
    if (ServerRunner.stdin === undefined) return;
    if (command == 'reboot') {
      // TODO: 再起動に関する実装を行う
    } else {
      ServerRunner.stdin(command).then(() =>
        api.send.AddConsole(`/${command}`)
      );
    }
  }
}

export const runServer = (world: WorldEdited) =>
  new ServerRunner(world).runServer();
export const saveWorldSettings = (world: World) =>
  new ServerRunner(world).saveWorldSettings();

export const runCommand = ServerRunner.runCommand;

// export async function testRunServer(version: Version) {
//   // サーバーデータを用意
//   const v = await readyVersion(version);

//   // サーバーデータの用意ができなかった場合エラー
//   if (isFailure(v)) return v;

//   const { programArguments, serverCwdPath, component } = v;

//   // 実行javaを用意
//   const javaPath = await readyJava(component, true);

//   // 実行javaが用意できなかった場合エラー
//   if (isFailure(javaPath)) return javaPath;

//   // サーバーを起動
//   const result = execProcess(
//     javaPath.absolute().str(),
//     [...programArguments, '--nogui'],
//     serverCwdPath.absolute().str(),
//     true
//   );

//   let error: any = undefined;
//   // 10秒経って起動を続けていたら正常に起動したとみなしプロセスをkill
//   sleep(100).then(() => {
//     try {
//       result.kill();
//     } catch (e) {
//       error = e;
//     }
//   });

//   const eula = serverCwdPath.child('eula.txt').exists();

//   const json = { version, eula, result, error }
//   console.log(json)

//   serverCwdPath
//     .child('result.json')
//     .writeText(JSON.stringify(json));

//   await result;
// }
