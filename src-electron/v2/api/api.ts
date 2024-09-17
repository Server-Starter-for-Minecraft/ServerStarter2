import * as nodePath from 'path';
import { z } from 'zod';
import { API } from 'app/src-electron/api/api';
import { worldContainerToPath } from 'app/src-electron/core/world/worldContainer';
import { BackListener } from 'app/src-electron/ipc/link';
import { errorMessage } from 'app/src-electron/util/error/construct';
import { withError } from 'app/src-electron/util/error/witherror';
import { WorldHandler } from '../core/world/world';
import { OsPlatform } from '../schema/os';
import { WorldLocation } from '../schema/world';
import { RuntimeContainer } from '../source/runtime/runtime';
import { VersionContainer } from '../source/version/version';
import { WorldSource } from '../source/world/world';
import { err, ok, Result } from '../util/base';
import { Path } from '../util/binary/path';
import { genUUID } from '../util/random/uuid';
import { worldDataConverter } from './converter/world';
import * as v1 from './v1schema';

const worldSource = new WorldSource();
const versionContainer = new VersionContainer(new Path(''));
const runtimeContainer = new RuntimeContainer(new Path(''), async () =>
  err.error('TODO:')
);
const osPlatform = OsPlatform.parse('windows-x64');

const WorldLocationId = z.string().brand('WorldLocationId');
type WorldLocationId = z.infer<typeof WorldLocationId>;

type WorldDef = {
  id: v1.WorldID;
  handler: WorldHandler;
  location: WorldLocation;
};

class WorldHandlers {
  private readonly worldIdToHandler: Map<v1.WorldID, WorldDef>;
  private readonly worldLocationToHandler: Map<WorldLocationId, WorldDef>;

  constructor(
    private readonly worldSource: WorldSource,
    private readonly versionContainer: VersionContainer,
    private readonly runtimeContainer: RuntimeContainer,
    private readonly osPlatform: OsPlatform
  ) {
    this.worldIdToHandler = new Map();
    this.worldLocationToHandler = new Map();
  }

  // WorldLocationから一意の文字列を出力
  private encodeWorldLocation(worldLocation: WorldLocation): WorldLocationId {
    return WorldLocationId.parse(
      `${worldLocation.container.containerType}::${worldLocation.container.path}::${worldLocation.worldName}`
    );
  }

  private generateNextWorldId(): v1.WorldID {
    return genUUID() as v1.WorldID;
  }

  async createWorldHandler(worldLocation: WorldLocation) {
    if (this.getByWorldLocation(worldLocation).isOk)
      return err.error('WORLD ALREADY EXISTS');

    const worldHandler = await WorldHandler.create(
      this.worldSource,
      this.versionContainer,
      this.runtimeContainer,
      this.osPlatform,
      worldLocation
    );

    if (worldHandler.isErr) return worldHandler;
    const worldLocationId = this.encodeWorldLocation(worldLocation);

    const worldId = this.generateNextWorldId();
    const worldDef: WorldDef = {
      id: worldId,
      location: worldLocation,
      handler: worldHandler.value(),
    };

    this.worldIdToHandler.set(worldId, worldDef);
    this.worldLocationToHandler.set(worldLocationId, worldDef);

    return ok(worldDef);
  }

  getByWorldId(worldId: v1.WorldID): Result<WorldDef> {
    const result = this.worldIdToHandler.get(worldId);
    return result === undefined ? err.error('WORLD_IS_MISSSING') : ok(result);
  }

  getByWorldLocation(worldLocation: WorldLocation): Result<WorldDef> {
    const result = this.worldLocationToHandler.get(
      this.encodeWorldLocation(worldLocation)
    );
    return result === undefined ? err.error('WORLD_IS_MISSSING') : ok(result);
  }
}

const worldHandlers = new WorldHandlers(
  worldSource,
  versionContainer,
  runtimeContainer,
  osPlatform
);

export const APIV2: BackListener<API> = {
  on: {
    Command(world: v1.WorldID, command: string) {
      worldHandlers
        .getByWorldId(world)
        .onOk(({ handler }) => ok(handler.runCommand(command)));
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
      console.log(worldContainer, nodePath.isAbsolute(worldContainer));
      const locations = await worldSource.listWorldLocations(
        nodePath.isAbsolute(worldContainer)
          ? { containerType: 'local', path: worldContainer }
          : { containerType: 'relative', path: worldContainer }
      );

      const abbrs = await Promise.all(
        locations.map(async (location): Promise<Result<v1.WorldAbbr>> => {
          let world = worldHandlers.getByWorldLocation(location);
          if (world.isErr)
            world = await worldHandlers.createWorldHandler(location);

          return world.onOk(({ id }) =>
            ok({
              container: worldContainer,
              id,
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

    async GetWorld(
      WorldId: v1.WorldID
    ): Promise<v1.WithError<v1.Failable<v1.World>>> {
      const world = worldHandlers.getByWorldId(WorldId);
      if (world.isErr)
        return withError(
          errorMessage.unknown({ message: 'WORLD BINDED TO ID NOT EXISTS' })
        );
      const { location, handler } = world.value();
      console.log('GetWorld', location, (await handler.getMeta()).value());
      return withError(
        worldDataConverter.V2ToV1(
          (await handler.getMeta()).value(),
          WorldId,
          location
        )
      );
    },
    async SetWorld(
      world: v1.WorldEdited
    ): Promise<v1.WithError<v1.Failable<v1.World>>> {
      return withError(world);
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
    async ValidateNewWorldName(
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
