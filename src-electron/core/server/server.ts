import { World } from 'src-electron/api/schema';
import { getLog4jArg } from './log4j';
import { Failable, isFailure, isSuccess } from '../../api/failable';
import { readyVersion } from '../version/version';
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

  // ワールドデータをpullする関数
  // プロミスの待機はrunServerWithPullingの内部で行われる
  let pullWorld = undefined;

  const remote_pull = world.remote_pull;
  if (remote_pull?.type) {
    pullWorld = async () => {
      await pullRemoteWorld(cwdPath, remote_pull);
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
    };
  }

  const remote_push = world.remote_push;
  // ワールドデータをpushする関数
  // プロミスの待機はrunServerWithPullingの内部で行われる
  const pushWorld = remote_push?.type
    ? () => pushRemoteWorld(cwdPath, remote_push)
    : undefined;

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

/** ワールド設定を更新してサーバーを起動 */
async function _runServer(
  world: World,
  cwdPath: Path,
  pullWorld: undefined | (() => Promise<Failable<undefined>>),
  pushWorld: undefined | (() => Promise<Failable<undefined>>)
) {
  // ワールドが起動中の場合エラー
  if (world.using)
    return new WorldUsingError(
      `world ${world.name} is running by ${world.last_user ?? '<annonymous>'}`
    );

  // プルを開始
  const pulling = pullWorld?.();

  // java実行時引数(ここから増える)
  // stdin,stdout,stderrの文字コードをutf-8に
  // 確保メモリ量を設定
  const args = ['"-Dfile.encoding=UTF-8"'];

  if (world.memory !== undefined) {
    args.push(`-Xmx${world.memory}G`, `-Xms${world.memory}G`);
  }

  // // ワールドが存在しない場合エラー
  // if (!worldPath.exists()) return Error(`world ${world.name} not exists`);

  api.send.UpdateStatus(
    `サーバーデータを準備中 ${world.version.id} (${world.version.type})`
  );

  // サーバーデータを用意
  const version = await readyVersion(world.version, cwdPath);

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
  if (pulling !== undefined) {
    api.send.UpdateStatus('ワールドデータのダウンロード中');
    const pullResult = await pullWorld;
    // ワールドのpullに失敗したら終了
    if (isFailure(pullResult)) return pullResult;
  }

  // log4jの設定
  api.send.UpdateStatus('log4jの引数を設定中');
  const log4jarg = await getLog4jArg(cwdPath, world.version);

  // log4jのファイルがダウンロードできなかった場合エラー
  if (isFailure(log4jarg)) return log4jarg;

  // log4j引数を実行時引数に追加
  if (log4jarg) args.push(log4jarg);

  // サーバーのjarファイル参照を実行時引数に追加
  args.push(...programArguments, '--nogui');

  // 設定の更新
  world.using = true;
  world.last_user = systemSettings.get('user').owner;
  world.last_date = new Date().getTime();

  // 起動中フラグを立てた状態でpush
  if (pushWorld) await pushWorld();

  // 設定ファイルをサーバーCWD直下に書き出す
  api.send.UpdateStatus('サーバー設定ファイルの書き出し中');
  await saveWorldSettingsJson(world, cwdPath);

  // 設定ファイルをサーバーCWD直下に書き出す
  api.send.UpdateStatus('サーバー設定ファイルの展開中');
  world.properties = world.properties ?? {};
  world.properties['level-name'] = { type: 'string', value: LEVEL_NAME };
  await unrollSettings(world, cwdPath);

  async function setUsingFlagFalse() {
    // サーバー起動中のフラグを折る
    world.using = false;

    // level-nameの削除
    if (world.properties && world.properties['level-name']) {
      delete world.properties['level-name'];
    }

    // 設定ファイルをサーバーCWD直下に書き出す
    api.send.UpdateStatus('設定ファイルの書き出し中');

    // jsonの保存
    await saveWorldSettingsJson(world, cwdPath);
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

  // サーバー起動をWindowに知らせる
  api.send.FinishServer();

  // フロントエンドからの入力を無視
  stdin = undefined;

  // 使用中フラグを折る
  await setUsingFlagFalse();

  // サーバー実行時のみ必要なファイルを削除
  await removeServerSettingFiles(cwdPath);

  // サーバーの実行に失敗した場合はエラー
  if (isFailure(result)) return result;
}

/** ワールド設定を更新する (サーバー起動はしない) */
async function _saveSettings(
  world: World,
  cwdPath: Path,
  pullWorld: undefined | (() => Promise<Failable<undefined>>)
) {
  // ワールドが起動中の場合エラー
  if (world.using)
    return new WorldUsingError(
      `world ${world.name} is running by ${world.last_user ?? '<annonymous>'}`
    );

  // プルを開始
  const pulling = pullWorld?.();

  // ワールドのpullが終わるのを待機
  if (pulling !== undefined) {
    api.send.UpdateStatus('ワールドデータのダウンロード中');
    const pullResult = await pullWorld;
    // ワールドのpullに失敗したら終了
    if (isFailure(pullResult)) return pullResult;
  }

  // 設定ファイルをサーバーCWD直下に書き出す
  api.send.UpdateStatus('設定ファイルの書き出し中');
  await saveWorldSettingsJson(world, cwdPath);
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
