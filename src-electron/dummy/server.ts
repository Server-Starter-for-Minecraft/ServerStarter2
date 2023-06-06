import { WorldEdited, WorldID } from '../schema/world';
import { sleep } from '../util/sleep';
import { api } from './api';
import { startConsoles, stopConsoles } from './const/server_message';

const serverStopper: Record<WorldID, () => void> = {};

export async function runServer(world: WorldEdited) {

  api.send.UpdateStatus(world.id, '開始時処理');
  await sleep(200);

  await api.invoke.AgreeEula(world.id, '<Minecraft eula url here>');

  api.send.StartServer(world.id);

  await new Promise((resolve) => {
    serverStopper[world.id] = () => resolve(null);
    putStartConsole(world.id);
  });

  api.send.FinishServer(world.id);

  api.send.UpdateStatus(world.id, '終了時処理');
  await sleep(200);

  return world;
}

async function putStartConsole(world: WorldID) {
  for (const console of startConsoles) {
    if (serverStopper[world] === undefined) break;
    api.send.AddConsole(world, console);
    await sleep(50);
  }
}

async function putStopConsole(world: WorldID) {
  for (const console of startConsoles) {
    if (serverStopper[world] === undefined) break;
    api.send.AddConsole(world, console);
    await sleep(50);
  }
  serverStopper[world]();
  delete serverStopper[world];
}

export function runCommand(world: WorldID, command: string): void {
  console.log(`[runCommand] world:${world} command:${command}`);
  if (serverStopper[world] !== undefined) {
    api.send.AddConsole(world, command);
    if (command === 'stop') {
      putStopConsole(world);
    }
  }
}
