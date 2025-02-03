import { WorldEdited, WorldID } from '../schema/world';
import { sleep } from '../util/promise/sleep';
import { api } from './api';
import { startConsoles, stopConsoles } from './const/server_message';

const serverStopper: Record<WorldID, () => void> = {};

export async function runServer(world: WorldID) {
  api.send.UpdateStatus(world, '開始時処理');
  await sleep(200);

  await api.invoke.AgreeEula(world, '<Minecraft eula url here>');

  api.send.StartServer(world);

  await new Promise((resolve) => {
    serverStopper[world] = () => resolve(null);
    putStartConsole(world);
  });

  api.send.FinishServer(world);

  api.send.UpdateStatus(world, '終了時処理');
  await sleep(200);

  return world;
}

async function putStartConsole(world: WorldID) {
  for (const console of startConsoles) {
    if (serverStopper[world] === undefined) break;
    api.send.AddConsole(world, console, false);
    await sleep(50);
  }
}

async function putStopConsole(world: WorldID) {
  for (const console of stopConsoles) {
    if (serverStopper[world] === undefined) break;
    api.send.AddConsole(world, console, false);
    await sleep(50);
  }
  serverStopper[world]();
  delete serverStopper[world];
}

export function runCommand(world: WorldID, command: string): void {
  if (serverStopper[world] !== undefined) {
    api.send.AddConsole(world, command, false);
    if (command === 'stop') {
      putStopConsole(world);
    }
  }
}
