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
import { WorldContainer, WorldName } from '../schema/brands';
import { dummyWorldAbbrs, worldMap } from './const/world';

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
  console.log(`[getSystemSettings] settings:${JSON.stringify(dummySystemSettings)}`);
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
