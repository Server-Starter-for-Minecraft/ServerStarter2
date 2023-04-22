import { Failable } from 'app/src-electron/api/failable';
import { World, WorldSettings } from 'app/src-electron/api/scheme';

export async function getAllWorlds(): Promise<Failable<World[]>> {
  return [getDemoWorld()];
}

function getDemoWorld() {
  const demoWorldSettings: WorldSettings = {
    avater_path: 'https://cdn.quasar.dev/img/parallax2.jpg',
    version: { id: '1.3', type: 'vanilla', release: true },
  };
  const demoWorld: World = {
    name: 'vanilla13',
    settings: demoWorldSettings,
    datapacks: [],
    plugins: [],
    mods: [],
  };
  return demoWorld;
}
