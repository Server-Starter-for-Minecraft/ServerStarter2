import { BrowserWindow } from 'electron';
import { sleep } from '../util/sleep';
import { SystemWorldSettings, World, WorldID } from '../schema/world';
import { SystemSettings, WorldContainers } from '../schema/system';
import {
  dummySystemSettings,
  dummySystemWorldSettings,
  dummyWorldContainers,
  serverWorldContainer,
} from './const/systemSettings';
import { Version, VersionType } from '../schema/version';
import { Failable } from '../api/failable';
import { dummyVersionMap } from './const/versions';
import {
  ImageURI,
  PlayerUUID,
  WorldContainer,
  WorldName,
} from '../schema/brands';
import { dummyWorldAbbrs, worldMap } from './const/world';
import { Player } from '../schema/player';

const sleepTime = 500;

export const pickDirectory =
  (windowGetter: () => BrowserWindow | undefined) =>
  async (): Promise<Electron.OpenDialogReturnValue> => {
    await sleep(sleepTime);
    return { canceled: false, filePaths: ['C:\\Users\\test\\directory'] };
  };

export const deleteWorld = async (world: WorldID) => {
  await sleep(sleepTime);
  console.log(`[deleteWorld] world:${world}`);
};

export const saveWorldSettings = async (world: World) => {
  await sleep(sleepTime);
  console.log(`[saveWorldSettings] world:${JSON.stringify(world)}`);
  return world;
};

export const getSystemSettings = async (): Promise<SystemSettings> => {
  await sleep(sleepTime);
  console.log(
    `[getSystemSettings] settings:${JSON.stringify(dummySystemSettings)}`
  );
  return dummySystemSettings;
};

export const setSystemSettings = async (settings: SystemSettings) => {
  await sleep(sleepTime);
  console.log(`[setSystemSettings] settings:${settings}`);
};

export const getDefaultSettings = async (): Promise<SystemWorldSettings> => {
  await sleep(sleepTime);
  console.log(
    '\u001b[' +
      31 +
      'm' +
      'this API is Deprecated use getSystemSettings().world instead' +
      '\u001b[0m'
  );
  console.log(`[getDefaultSettings] settings:${dummySystemWorldSettings}`);
  return dummySystemWorldSettings;
};

export const getVersions = async (
  type: VersionType,
  useCache: boolean
): Promise<Failable<Version[]>> => {
  await sleep(sleepTime);
  console.log(`[getVersions] type:${type} useCache:${useCache}`);
  return dummyVersionMap[type];
};

export const getWorldContainers = async (): Promise<WorldContainers> => {
  await sleep(sleepTime);
  console.log(
    '\u001b[' +
      31 +
      'm' +
      'this API is Deprecated use getSystemSettings().container instead' +
      '\u001b[0m'
  );
  console.log(`[getWorldContainers] settings:${dummyWorldContainers}`);
  return dummyWorldContainers;
};

export const setWorldContainers = async (worldContainers: WorldContainers) => {
  await sleep(sleepTime);
  console.log(
    '\u001b[' +
      31 +
      'm' +
      'this API is Deprecated use setSystemSettings() instead' +
      '\u001b[0m'
  );
  console.log(`[setWorldContainers] settings:${worldContainers}`);
};

export const getWorldAbbrs = async (worldContainer: WorldContainer) => {
  await sleep(sleepTime);
  console.log(`[getWorldAbbrs] worldContainer:${worldContainer}`);
  if (worldContainer === serverWorldContainer) {
    return dummyWorldAbbrs;
  }
  return [];
};

export const getWorld = async (WorldId: WorldID) => {
  await sleep(sleepTime);
  console.log(`[getWorld] WorldID:${WorldId}`);
  return worldMap[WorldId];
};

export const validateNewWorldName = async (
  worldContainer: WorldContainer,
  worldName: string
) => {
  await sleep(sleepTime);
  console.log(
    `[validateNewWorldName] worldContainer:${worldContainer} worldName:${worldName}`
  );
  return worldName as WorldName;
};

export const getRunningWorld = async (WorldId: WorldID) => {
  await sleep(sleepTime);
  console.log(`[getRunningWorld] WorldId:${WorldId}`);
  return worldMap[WorldId];
};

export const SearchPlayer = async (
  uuidOrName: string
): Promise<Failable<Player>> => {
  await sleep(sleepTime);
  if (uuidOrName.match(/^[a-zA-Z0-9_]{2,16}$/gm)) {
    return {
      name: uuidOrName,
      uuid: `00000000-${uuidOrName}-0000000000000000` as PlayerUUID,
      avatar:
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAIBAMAAAA2IaO4AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAqUExURQAPLP3++Pb28+jo5b+QecaXfMmkjT8/PwCTINCqj9m+owJ3NTe6VGHBQ8rHOi0AAAAJcEhZcwAADsMAAA7DAcdvqGQAAAApSURBVBjTY0AAIUMlRQaVoGR1hohZUzcy5KxauZFh7qpVlxm0Vq1aBACCXAsTpdjxUAAAAABJRU5ErkJggg==' as ImageURI,
      avatar_overlay:
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAABXSURBVChTY2Tg1/nPQA6YUy2MX+PP6w4IBfnBsv9x6oi204JLNKWhKvr778d/pidvP0O5DAyPHwtAWRDg5OiOsAvZJBh48eLpf4Zv3z5jtxsIvn37/B8A3fAn0FlZxgwAAAAASUVORK5CYII=' as ImageURI,
    };
  }

  if (
    uuidOrName.match(/^[0-9_]{8}-[0-9_]{4}-[0-9_]{4}-[0-9_]{4}-[0-9_]{12}$/gm)
  ) {
    return {
      name: 'TestPlayer',
      uuid: uuidOrName as PlayerUUID,
      avatar:
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAIBAMAAAA2IaO4AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAqUExURQAPLP3++Pb28+jo5b+QecaXfMmkjT8/PwCTINCqj9m+owJ3NTe6VGHBQ8rHOi0AAAAJcEhZcwAADsMAAA7DAcdvqGQAAAApSURBVBjTY0AAIUMlRQaVoGR1hohZUzcy5KxauZFh7qpVlxm0Vq1aBACCXAsTpdjxUAAAAABJRU5ErkJggg==' as ImageURI,
      avatar_overlay:
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAABXSURBVChTY2Tg1/nPQA6YUy2MX+PP6w4IBfnBsv9x6oi204JLNKWhKvr778d/pidvP0O5DAyPHwtAWRDg5OiOsAvZJBh48eLpf4Zv3z5jtxsIvn37/B8A3fAn0FlZxgwAAAAASUVORK5CYII=' as ImageURI,
    };
  }
  return new Error(`Non existing player: ${uuidOrName}`);
};
