import { WorldEdited, WorldID } from '../schema/world';
import { api } from './api';

const serverStopper: Record<WorldID, () => void> = {};

export async function runServer(world: WorldEdited) {
  api.send.UpdateStatus(world.id, 'MESSAGE');
  await api.invoke.AgreeEula(world.id, '<Minecraft eula url here>');
  api.send.StartServer(world.id);

  await new Promise((resolve) => {
    serverStopper[world.id] = () => resolve;
  });

  api.send.FinishServer(world.id);

  return world;
}

export function runCommand(world: WorldID, command: string): void {
  console.log(`[runCommand] world:${world} command:${command}`);
  if (serverStopper[world] !== undefined) {
    api.send.AddConsole(world, command);
    if (command === 'stop') {
      serverStopper[world]();
      delete serverStopper[world];
    }
  }
}
