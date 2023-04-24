import { World } from 'app/src-electron/api/scheme';
import { getLog4jArg } from './log4j';
import { isFailure } from '../../api/failable';
import { readyVersion } from './version/version';
import { readyJava } from '../utils/java/java';
import { unrollSettings } from './settings';
import { interactiveProcess } from '../utils/subprocess';
import { api } from '../api';
import { checkEula } from './eula';
import { Path } from '../utils/path/path';

let stdin: undefined | ((command: string) => Promise<void>) = undefined;

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

const LEVEL_NAME = 'world';

/** サーバーを起動する */
export async function runServer(world: World) {
  const cwdPath = new Path(world.container).child(world.name);

  const settings = world.settings;

  // java実行時引数(ここから増える)
  // stdin,stdout,stderrの文字コードをutf-8に
  // 確保メモリ量を設定
  const args = ['"-Dfile.encoding=UTF-8"'];

  if (settings.memory !== undefined) {
    args.push(`-Xmx${settings.memory}G`, `-Xms${settings.memory}G`);
  }

  // // ワールドが存在しない場合エラー
  // if (!worldPath.exists()) return Error(`world ${world.name} not exists`);

  // ワールドが起動中の場合エラー
  if (settings.using) return Error(`world ${world.name} is already activated`);

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
  const javaPath = await readyJava(component, true);

  // 実行javaが用意できなかった場合エラー
  if (isFailure(javaPath)) return javaPath;

  api.send.UpdateStatus('log4jの引数を設定中');

  const log4jarg = await getLog4jArg(cwdPath, settings.version);

  // log4jのファイルがダウンロードできなかった場合エラー
  if (isFailure(log4jarg)) return log4jarg;

  // log4j引数を実行時引数に追加
  if (log4jarg) args.push(log4jarg);

  // サーバーのjarファイル参照を実行時引数に追加
  args.push(...programArguments, '--nogui');

  // ワールドデータをダウンロード

  api.send.UpdateStatus('設定ファイルの書き出し中');

  // 設定ファイルをサーバーCWD直下に書き出す
  await unrollSettings(settings, LEVEL_NAME, cwdPath);

  api.send.UpdateStatus('Eulaの同意状況を確認中');

  // Eulaチェック
  const eulaAgreement = await checkEula(javaPath, programArguments, cwdPath);

  // Eulaチェックに失敗した場合
  if (isFailure(eulaAgreement)) return eulaAgreement;

  // Eulaに同意しなかった場合エラー
  if (!eulaAgreement) {
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

  // サーバーの実行に失敗した場合はエラー
  if (isFailure(result)) return result;
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
