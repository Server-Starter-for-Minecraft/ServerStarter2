import { World } from 'app/src-electron/api/scheme';
import { sleep } from '../utils/testTools';
import { api } from 'app/src-electron/core/api';

// 処理フロー
// １．フロントがProgressPageに遷移
// ２．フロントからバックのrunServer()を呼び出し
// ３．startServer()でサーバー起動をフロントに通知
// ４．通知を受けてフロントがConsolePageに遷移
// ５．バックよりConsolePageの内容を更新
// （６．フロントよりコマンド入力を受けた場合，バックにコマンドを渡して処理）
export async function runServer(world: World) {
  api.send.UpdateStatus(`${world.settings.version.id} / ${world.name}を起動中`);
  await sleep(2);

  // リモート関連のプログレスバー
  // const array = [...Array(101)].map((_, i) => i);
  // for (let i = 0; i < array.length; i++) {
  //   api.send.UpdateStatus('データをダウンロード中', i);
  //   await sleep(0.1);
  // }

  // LEGACY: Eulaの同意（失敗した場合などのエラー処理も）
  // const options: Electron.MessageBoxOptions = {
  //     type: 'question',
  //     title: 'Server Starter 2',
  //     message: 'Eulaに同意しますか',
  //     buttons: ['はい', 'いいえ'],
  //     cancelId: -1,
  //     defaultId: 0
  // }
  // const res = dialog.showMessageBoxSync(options)
  // console.log(res)

  // Eulaの同意
  // const result = await api.invoke.AgreeEula();
  // console.log('eula:', result);

  // 二，三個の適当なプロセスもどき
  await sleep(2);
  api.send.UpdateStatus('適当なプロセス');
  await sleep(2);
  api.send.UpdateStatus('サーバーを起動するよ');
  await sleep(1);

  // サーバー起動をWindowに知らせる
  api.send.StartServer();

  // サーバーの起動
  // startServer(world)

  // 表示画面にコンソールの中身を順次転送
  for (let i = 0; i < demoConsoles.length; i++) {
    api.send.AddConsole(demoConsoles[i]);
    await sleep(0.25);
  }

  return undefined;
}

export function runCommand(command: string) {
  console.log(command);
  if (command == 'reboot') {
    // TODO: 再起動に関する実装を行う
    api.send.AddConsole('Reboot Server');
  } else {
    api.send.AddConsole(`/${command}`);
  }
}

const demoConsoles = [
  '[00:15:29] [ServerMain/INFO]: Building unoptimized datafixer',
  "[00:15:29] [ServerMain/INFO]: Environment: authHost='https://authserver.mojang.com', accountsHost='https://api.mojang.com', sessionHost='https://sessionserver.mojang.com', servicesHost='https://api.minecraftservices.com', name='PROD'",
  '[00:15:31] [ServerMain/INFO]: Loaded 7 recipes',
  '[00:15:31] [ServerMain/INFO]: Loaded 1179 advancements',
  '[00:15:32] [Server thread/INFO]: Starting minecraft server version 1.00.0',
  '[00:15:32] [Server thread/INFO]: Loading properties',
  '[00:15:32] [Server thread/INFO]: Default game type: SURVIVAL',
  '[00:15:32] [Server thread/INFO]: Generating keypair',
  '[00:15:32] [Server thread/INFO]: Starting Minecraft server on *:25565',
  '[00:15:32] [Server thread/INFO]: Using default channel type',
  '[00:15:32] [Server thread/INFO]: Preparing level "worlds/test/world"',
  '[00:15:33] [Server thread/INFO]: Preparing start region for dimension minecraft:overworld',
  '[00:15:35] [Worker-Main-1/INFO]: Preparing spawn area: 0%',
  '[00:15:35] [Worker-Main-1/INFO]: Preparing spawn area: 0%',
  '[00:15:35] [Worker-Main-5/INFO]: Preparing spawn area: 0%',
  '[00:15:35] [Worker-Main-3/INFO]: Preparing spawn area: 0%',
  '[00:15:35] [Worker-Main-6/INFO]: Preparing spawn area: 0%',
  '[00:15:35] [Worker-Main-3/INFO]: Preparing spawn area: 75%',
  '[00:15:35] [Server thread/INFO]: Time elapsed: 2616 ms',
  '[00:15:35] [Server thread/INFO]: Done (3.637s)! For help, type "help"',
  '[00:15:39] [User Authenticator #1/INFO]: UUID of player CivilTT is 7aa8d952-5617-4a8c-8f4f-8761999a1f1a',
  '[00:15:39] [Server thread/INFO]: CivilTT[/127.0.0.1:57745] logged in with entity id 163 at (-47.033365867584706, 27.0, -220.4505154045585)',
  '[00:15:39] [Server thread/INFO]: CivilTT joined the game',
  '[02:05:35] [Server thread/INFO]: CivilTT lost connection: Disconnected',
  '[02:05:35] [Server thread/INFO]: CivilTT left the game',
  '[02:05:41] [Server thread/INFO]: Stopping the server',
  '[02:05:41] [Server thread/INFO]: Stopping server',
  '[02:05:41] [Server thread/INFO]: Saving players',
  '[02:05:41] [Server thread/INFO]: Saving worlds',
  "[02:05:42] [Server thread/INFO]: Saving chunks for level 'ServerLevel[worlds/Saku/world]'/minecraft:overworld",
  "[02:05:43] [Server thread/INFO]: Saving chunks for level 'ServerLevel[worlds/Saku/world]'/minecraft:the_end",
  "[02:05:43] [Server thread/INFO]: Saving chunks for level 'ServerLevel[worlds/Saku/world]'/minecraft:the_nether",
  '[02:05:43] [Server thread/INFO]: ThreadedAnvilChunkStorage (world): All chunks are saved',
  '[02:05:43] [Server thread/INFO]: ThreadedAnvilChunkStorage (DIM1): All chunks are saved',
  '[02:05:43] [Server thread/INFO]: ThreadedAnvilChunkStorage (DIM-1): All chunks are saved',
  '[02:05:43] [Server thread/INFO]: ThreadedAnvilChunkStorage: All dimensions are saved',
];
