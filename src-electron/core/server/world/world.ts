import { Failable } from 'app/src-electron/api/failable';
import { World, WorldSettings } from 'app/src-electron/api/schema';
import { userDataPath } from '../../userDataPath';

export async function getWorlds(
  worldContainer: string
): Promise<Failable<World[]>> {
  return [getDemoWorld()];
}

function getDemoWorld() {
  const demoWorldSettings: WorldSettings = {
    avater_path: 'https://cdn.quasar.dev/img/parallax2.jpg',
    version: {
      id: '1.19.2',
      type: 'vanilla',
      release: true,
    },
  };
  const demoWorld: World = {
    name: 'vanilla19',
    container: userDataPath.child('servers').str(),
    settings: demoWorldSettings,
    datapacks: [],
    plugins: [],
    mods: [],
  };
  return demoWorld;
}
