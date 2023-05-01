import { World } from 'src-electron/api/schema';
import { getLog4jArg } from './log4j';
import { Failable, isFailure, isSuccess } from '../../api/failable';
import { readyVersion } from '../version/version';
import { readyJava } from '../../util/java/java';
import { unrollSettings } from '../settings/settings';
import { interactiveProcess } from '../../util/subprocess';
import { api } from '../api';
import { checkEula } from './eula';
import { LEVEL_NAME } from '../const';
import { worldContainerToPath } from '../world/worldContainer';
import { pullRemoteWorld, pushRemoteWorld } from '../remote/remote';
import { Path } from 'src-electron/util/path';
import { loadWorldJson } from '../world/worldJson';

let stdin: undefined | ((command: string) => Promise<void>) = undefined;

class WorldUsingError extends Error {}

export const runServer = (world: World) =>
  runServerOrSaveSettings(world, false);
export const saveWorldSettings = (world: World) =>
  runServerOrSaveSettings(world, true);

/**
 * サーバーを起動する/ワールド設定を保存する
 * @param saveSettingsOnly trueにした場合ワールドの起動は行わずワールドの設定のみを上書きして終了
 */
async function runServerOrSaveSettings(
  world: World,
  saveSettingsOnly: boolean
) {
  // サーバーのCWDパスを得る
  const cwdPath = worldContainerToPath(world.container).child(world.name);

  // ワールドデータをpullするプロミスを生成
  // プロミスの待機はrunServerWithPullingの内部で行われる
  let pullWorld = undefined;
  let pushWorld = undefined;
  if (world.settings.remote?.type) {
    const remote = world.settings.remote;
    pullWorld = pullRemoteWorld(cwdPath, remote);
    pushWorld = () => pushRemoteWorld(cwdPath, remote);
  }

  let result: Failable<undefined>;
  if (saveSettingsOnly) {
    // saveSettingsOnly === true -> ワールド設定を保存
    result = await _saveSettings(world, cwdPath, pullWorld);
  } else {
    // saveSettingsOnly === false -> サーバーを実行
    result = await _runServer(world, cwdPath, pullWorld, pushWorld);
  }

  /** 実行結果がWorldUsingErrorでない限りワールドデータをpush */
  if (pushWorld !== undefined && !(result instanceof WorldUsingError)) {
    await pushWorld();
  }

  // 実行結果を返す
  return result;
}

async function _runServer(
  world: World,
  cwdPath: Path,
  pullWorld: undefined | Promise<Failable<undefined>>,
  pushWorld: undefined | (() => Promise<Failable<undefined>>)
) {
  const settings = world.settings;

  // ワールドが起動中の場合エラー
  if (settings.using)
    return new WorldUsingError(
      `world ${world.name} is running by ${
        settings.last_user ?? '<annonymous>'
      }`
    );

  // java実行時引数(ここから増える)
  // stdin,stdout,stderrの文字コードをutf-8に
  // 確保メモリ量を設定
  const args = ['"-Dfile.encoding=UTF-8"'];

  if (settings.memory !== undefined) {
    args.push(`-Xmx${settings.memory}G`, `-Xms${settings.memory}G`);
  }

  // // ワールドが存在しない場合エラー
  // if (!worldPath.exists()) return Error(`world ${world.name} not exists`);

  api.send.UpdateStatus(
    `サーバーデータを準備中 ${settings.version.id} (${settings.version.type})`
  );

  // サーバーデータを用意
  const version = await readyVersion(settings.version, cwdPath);

  // サーバーデータの用意ができなかった場合エラー
  if (isFailure(version)) return version;

  const { programArguments, component } = version;

  api.send.UpdateStatus(`javaランタイムを準備中 (${component})`);

  // 実行javaを用意
  const _javaPath = await readyJava(component, true);

  // 実行javaが用意できなかった場合エラー
  if (isFailure(_javaPath)) return _javaPath;
  const javaPath = _javaPath;

  // ワールドのpullが終わるのを待機
  if (pullWorld) {
    api.send.UpdateStatus('ワールドデータのダウンロード中');
    const pullResult = await pullWorld;
    // ワールドのpullに失敗したら終了
    if (isFailure(pullResult)) return pullResult;

    // pullしてきたワールドが使用中かどうかを確認し、使用中の場合エラー
    const worldjson = await loadWorldJson(cwdPath);
    if (isSuccess(worldjson)) {
      if (worldjson.using)
        return new WorldUsingError(
          `world ${world.name} is running by ${
            worldjson.last_user ?? '<annonymous>'
          }`
        );
    }
  }

  // log4jの設定
  api.send.UpdateStatus('log4jの引数を設定中');
  const log4jarg = await getLog4jArg(cwdPath, settings.version);

  // log4jのファイルがダウンロードできなかった場合エラー
  if (isFailure(log4jarg)) return log4jarg;

  // log4j引数を実行時引数に追加
  if (log4jarg) args.push(log4jarg);

  // サーバーのjarファイル参照を実行時引数に追加
  args.push(...programArguments, '--nogui');

  // サーバー起動中のフラグを立てる
  settings.using = true;

  // 設定ファイルをサーバーCWD直下に書き出す
  api.send.UpdateStatus('設定ファイルの書き出し中');
  await unrollSettings(world, LEVEL_NAME, cwdPath);

  // 起動中フラグを立てた状態でpush
  if (pushWorld) {
    await pushWorld();
  }

  async function setUsingFlagFalse() {
    // サーバー起動中のフラグを折る
    settings.using = false;

    // 設定ファイルをサーバーCWD直下に書き出す
    api.send.UpdateStatus('設定ファイルの書き出し中');
    await unrollSettings(world, '', cwdPath);
  }

  // Eulaチェック
  api.send.UpdateStatus('Eulaの同意状況を確認中');
  const eulaAgreement = await checkEula(javaPath, programArguments, cwdPath);

  // Eulaチェックに失敗した場合
  if (isFailure(eulaAgreement)) {
    // 使用中フラグを折る
    await setUsingFlagFalse();
    return eulaAgreement;
  }

  // Eulaに同意しなかった場合エラー
  if (!eulaAgreement) {
    // 使用中フラグを折る
    await setUsingFlagFalse();
    return new Error(
      'To start server, you need to agree to Minecraft EULA (https://aka.ms/MinecraftEULA)'
    );
  }

  // javaのサブプロセスを起動
  // TODO: エラー出力先のハンドル
  const process = interactiveProcess(
    javaPath.absolute().str(),
    args,
    api.send.AddConsole,
    api.send.AddConsole,
    cwdPath.absolute().str(),
    true
  );
  // フロントエンドからの入力を受け付ける
  stdin = process.write;

  // サーバー起動をWindowに知らせる
  api.send.StartServer();

  // サーバー終了まで待機
  const result = await process;

  // フロントエンドからの入力を無視
  stdin = undefined;

  // 使用中フラグを折る
  await setUsingFlagFalse();

  // サーバーの実行に失敗した場合はエラー
  if (isFailure(result)) return result;
}

async function _saveSettings(
  world: World,
  cwdPath: Path,
  pullWorld: undefined | Promise<Failable<undefined>>
) {
  const settings = world.settings;

  // ワールドが起動中の場合エラー
  if (settings.using)
    return new WorldUsingError(
      `world ${world.name} is running by ${
        settings.last_user ?? '<annonymous>'
      }`
    );

  // ワールドのpullが終わるのを待機
  if (pullWorld) {
    api.send.UpdateStatus('ワールドデータのダウンロード中');
    const pullResult = await pullWorld;
    // ワールドのpullに失敗したら終了
    if (isFailure(pullResult)) return pullResult;

    // pullしてきたワールドが使用中かどうかを確認し、使用中の場合エラー
    const worldjson = await loadWorldJson(cwdPath);
    if (isSuccess(worldjson)) {
      if (worldjson.using)
        return new WorldUsingError(
          `world ${world.name} is running by ${
            worldjson.last_user ?? '<annonymous>'
          }`
        );
    }
  }

  // 設定ファイルをサーバーCWD直下に書き出す
  api.send.UpdateStatus('設定ファイルの書き出し中');
  await unrollSettings(world, LEVEL_NAME, cwdPath);
}

export function runCommand(command: string): void {
  console.log(command, stdin);
  if (stdin === undefined) return;

  if (command == 'reboot') {
    // TODO: 再起動に関する実装を行う
  } else {
    stdin(command).then(() => api.send.AddConsole(`/${command}`));
  }
}

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
