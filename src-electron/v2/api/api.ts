import { API } from 'app/src-electron/api/api';
import { BackListener } from 'app/src-electron/ipc/link';
import { errorMessage } from 'app/src-electron/util/error/construct';
import { WorldHandler } from '../core/world/world';
import { WorldContainer } from '../schema/world';
import { WorldSource } from '../source/world/world';
import { ok, Result } from '../util/base';
import { InfinitMap } from '../util/helper/infinitMap';
import { genUUID } from '../util/random/uuid';
import * as v1 from './v1schema';

declare const worldSource: WorldSource;

const APIV2: BackListener<API> = {
  on: {
    Command(world: v1.WorldID, command: string) {
      worldIdToHandler.get(world).runCommand(command);
    },
    OpenBrowser: function (url: string): void {
      throw new Error('Function not implemented.');
    },
    OpenFolder: function (
      path: string,
      autocreate: boolean
    ): Promise<v1.Failable<void>> {
      throw new Error('Function not implemented.');
    },
    ReadyWindow: function (): void {
      throw new Error('Function not implemented.');
    },
  },
  handle: {
    Reboot: function (world: v1.WorldID): Promise<void> {
      throw new Error('Function not implemented.');
    },
    GetStaticResouce: function (): Promise<v1.StaticResouce> {
      throw new Error('Function not implemented.');
    },
    GetSystemSettings: function (): Promise<v1.SystemSettings> {
      throw new Error('Function not implemented.');
    },
    SetSystemSettings: function (
      settings: v1.SystemSettings
    ): Promise<v1.SystemSettings> {
      throw new Error('Function not implemented.');
    },
    async GetWorldAbbrs(
      worldContainer: v1.WorldContainer
    ): Promise<v1.WithError<v1.WorldAbbr[]>> {
      const locations = await worldSource.listWorldLocations({
        containerType: 'local',
        path: worldContainer,
      });
      const abbrs = await Promise.all(
        locations.map(async (location): Promise<Result<v1.WorldAbbr>> => {
          const world = await WorldHandler.create(worldSource, location);
          return world.onOk((world) =>
            ok({
              container: worldContainer,
              id: worldHandlerToId.get(world),
              name: location.worldName as string as v1.WorldName,
            })
          );
        })
      );
      const errors: v1.ErrorMessage[] = abbrs
        .filter((x) => x.isErr)
        .map((x) => errorMessage.unknown({ message: x.error().message }));
      const value = abbrs.filter((x) => x.isOk).map((x) => x.value());
      return {
        errors,
        value,
      };
    },
    GetWorld: function (
      WorldId: v1.WorldID
    ): Promise<v1.WithError<v1.Failable<v1.World>>> {
      throw new Error('Function not implemented.');
    },
    SetWorld: function (
      world: v1.WorldEdited
    ): Promise<v1.WithError<v1.Failable<v1.World>>> {
      throw new Error('Function not implemented.');
    },
    NewWorld: function (): Promise<v1.WithError<v1.Failable<v1.World>>> {
      throw new Error('Function not implemented.');
    },
    CreateWorld: function (
      world: v1.WorldEdited
    ): Promise<v1.WithError<v1.Failable<v1.World>>> {
      throw new Error('Function not implemented.');
    },
    DeleteWorld: function (
      world: v1.WorldID
    ): Promise<v1.WithError<v1.Failable<undefined>>> {
      throw new Error('Function not implemented.');
    },
    RunWorld: function (
      world: v1.WorldID
    ): Promise<v1.WithError<v1.Failable<v1.World>>> {
      throw new Error('Function not implemented.');
    },
    DuplicateWorld: function (
      world: v1.WorldID,
      name?: v1.WorldName
    ): Promise<v1.WithError<v1.Failable<v1.World>>> {
      throw new Error('Function not implemented.');
    },
    BackupWorld: function (
      world: v1.WorldID
    ): Promise<v1.WithError<v1.Failable<v1.BackupData>>> {
      throw new Error('Function not implemented.');
    },
    RestoreWorld: function (
      world: v1.WorldID,
      backup: v1.BackupData
    ): Promise<v1.WithError<v1.Failable<v1.World>>> {
      throw new Error('Function not implemented.');
    },
    FetchLatestWorldLog: function (
      world: v1.WorldID
    ): Promise<v1.Failable<string[]>> {
      throw new Error('Function not implemented.');
    },
    GetWorldPaths: function (
      world: v1.WorldID,
      type: 'world' | 'datapacks' | 'plugins' | 'mods'
    ): Promise<v1.Failable<string>> {
      throw new Error('Function not implemented.');
    },
    GetPlayer: function (
      nameOrUuid: string,
      mode: 'uuid' | 'name' | 'auto'
    ): Promise<v1.Failable<v1.Player>> {
      throw new Error('Function not implemented.');
    },
    GetCacheContents: undefined,
    GetVersions: function (
      type: v1.VersionType,
      useCache: boolean
    ): Promise<v1.Failable<v1.AllVersion<v1.VersionType>>> {
      throw new Error('Function not implemented.');
    },
    GetLocalSaveData: function (): Promise<
      v1.WithError<v1.Failable<v1.CustomMapData[]>>
    > {
      throw new Error('Function not implemented.');
    },
    ValidateNewWorldName: function (
      worldContainer: v1.WorldContainer,
      worldName: string
    ): Promise<v1.Failable<v1.WorldName>> {
      throw new Error('Function not implemented.');
    },
    ValidateNewRemoteWorldName: function (
      remoteFolder: v1.RemoteFolder,
      name: string
    ): Promise<v1.Failable<v1.RemoteWorldName>> {
      throw new Error('Function not implemented.');
    },
    ValidateRemoteSetting: function (
      remote: v1.RemoteSetting
    ): Promise<v1.Failable<v1.RemoteSetting>> {
      throw new Error('Function not implemented.');
    },
    GetRemoteWorlds: function (
      remote: v1.RemoteFolder
    ): Promise<v1.WithError<v1.Failable<v1.RemoteWorld[]>>> {
      throw new Error('Function not implemented.');
    },
    DeleteRemoteWorld: function (
      remote: v1.Remote
    ): Promise<v1.Failable<undefined>> {
      throw new Error('Function not implemented.');
    },
    GetGlobalIP: function (): Promise<v1.Failable<string>> {
      throw new Error('Function not implemented.');
    },
    PickDialog: undefined,
  },
};

const worldHandlerToId = InfinitMap.objectKeyPrimitiveValue<
  WorldHandler,
  v1.WorldID
>((hander) => {
  const id = genUUID() as v1.WorldID;
  worldIdToHandler.set(id, hander);
  return id;
});
const worldIdToHandler = InfinitMap.primitiveKeyStrongValue<
  v1.WorldID,
  WorldHandler
>(() => {
  throw new Error('');
});
