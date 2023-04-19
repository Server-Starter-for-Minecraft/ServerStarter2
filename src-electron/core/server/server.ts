import { Version, World } from 'app/src-electron/api/scheme';
import { Path } from '../utils/path/path';
import { getLog4jArg } from './log4j';
import { runtimePath, serverCwdPath, worldsPath } from './const';
import { isFailure } from '../utils/result';
import { readyVersion } from './version/version';
import { readyJava } from '../utils/java/java';
import { unrollSettings } from './settings';
import { interactiveProcess } from '../utils/subprocess';
import { api } from '../api';

let stdin: undefined | ((command: string) => Promise<void>) = undefined;

/** サーバーを起動する */
export async function runServer(world: World) {
  const worldPath = worldsPath.child(world.name);
  const settings = world.settings;

  const memory = settings.memory ?? 5;
  const args = ['"-Dfile.encoding=UTF-8"', `-Xmx${memory}G`, `-Xms${memory}G`];

  // ワールドが存在しない場合エラー
  if (!worldPath.exists()) return Error(`world ${world.name} not exists`);

  // ワールドが起動中の場合エラー
  if (settings.using) return Error(`world ${world.name} is already activated`);

  api.send.UpdateStatus(
    `サーバーデータを準備中 ${settings.version.id} (${settings.version.type})`
  );

  // サーバーデータを用意
  const version = await readyVersion(settings.version);

  // versionの用意ができなかった場合エラー
  if (isFailure(version)) return version;

  const { jarpath, component } = version;

  api.send.UpdateStatus(`javaランタイムを準備中 (${component})`);

  // 実行javaを用意
  const javaPath = await readyJava(runtimePath, component);

  // 実行javaが用意できなかった場合エラー
  if (isFailure(javaPath)) return javaPath;

  api.send.UpdateStatus(`log4jの引数を設定中`);

  const log4jarg = await getLog4jArg(serverCwdPath, settings.version);

  // log4jのファイルがダウンロードできなかった場合エラー
  if (isFailure(log4jarg)) return log4jarg;

  // log4j引数を実行時引数に追加
  if (log4jarg) args.push(log4jarg);

  // サーバーのjarファイル参照を実行時引数に追加
  args.push('-jar', `"${jarpath.absolute().str()}"`, '--nogui');

  // ワールドデータをダウンロード

  // level-nameと実行時引数の決定
  const { levelName, arg } = defineLevelName(worldPath, settings.version);

  // ワールドディレクトリ指定用の引数を実行時引数に追加
  if (arg) args.push(arg);

  api.send.UpdateStatus(`設定ファイルの書き出し中`);

  // 設定ファイルをサーバーCWD直下に書き出す
  await unrollSettings(settings, levelName);

  // Eulaチェック

  console.log(javaPath.absolute().str(), args);

  const addconsole = (cmd: string) => {
    console.log(cmd, typeof cmd), api.send.AddConsole(cmd);
  };

  // javaのサブプロセスを起動
  // TODO: エラー出力先のハンドル
  const [stdinfunc, process] = interactiveProcess(
    javaPath.absolute().str(),
    args,
    addconsole,
    addconsole,
    serverCwdPath.absolute().str(),
    true
  );
  // フロントエンドからの入力を受け付ける
  stdin = stdinfunc;

  // サーバー起動をWindowに知らせる
  api.send.StartServer();

  // サーバー終了まで待機
  await process;

  // フロントエンドからの入力を無視
  stdin = undefined;
}

function defineLevelName(worldPath: Path, version: Version) {
  let levelName: string;
  let arg: undefined | string;
  switch (version.type) {
    case 'vanilla':
      levelName = worldPath
        .child('world')
        .absolute()
        .str()
        .replaceAll('\\', '\\\\');
      break;
    default:
      throw new Error(`unknown version ${version.id}(${version.type})`);
  }
  return { levelName, arg };
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
