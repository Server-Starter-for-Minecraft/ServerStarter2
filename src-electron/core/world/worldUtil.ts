import path from 'path';
import { isDeepStrictEqual } from 'util';
import {
  ImageURI as ImageURI1,
  PlayerUUID as PlayerUUID1,
  Timestamp,
  WorldContainer as WorldContainer1,
  WorldName as WorldName1,
} from 'app/src-electron/schema/brands';
import { CustomMapData } from 'app/src-electron/schema/filedata';
import { MemorySettings } from 'app/src-electron/schema/memory';
import { PlayerSetting } from 'app/src-electron/schema/player';
import { Version as Version1 } from 'app/src-electron/schema/version';
import {
  World as World1,
  WorldEdited,
  WorldID,
} from 'app/src-electron/schema/world';
import { errorMessage } from 'app/src-electron/util/error/construct';
import { isError, isValid } from 'app/src-electron/util/error/error';
import { orDefault } from 'app/src-electron/util/error/failable';
import {
  ImageURI,
  ImageURI as ImageURI2,
  OpLevel,
  Player as Player2,
  PlayerUUID as PlayerUUID2,
} from 'app/src-electron/v2/schema/player';
import { RuntimeSettings } from 'app/src-electron/v2/schema/runtime';
import {
  FabricVersion,
  ForgeVersion,
  MohistmcVersion,
  PapermcVersion,
  SpigotVersion,
  VanillaVersion,
  Version as Version2,
} from 'app/src-electron/v2/schema/version';
import {
  OpPlayer,
  World as World2,
  WorldContainer as WorldContainer2,
  WorldLocation,
  WorldName as WorldName2,
} from 'app/src-electron/v2/schema/world';

export function worldContainerV1V2(
  worldContainer: WorldContainer1
): WorldContainer2 {
  if (path.isAbsolute(worldContainer)) {
    return { containerType: 'local', path: worldContainer };
  } else {
    return { containerType: 'relative', path: worldContainer };
  }
}

export function worldNameV1V2(worldName: WorldName1): WorldName2 {
  return worldName as string as WorldName2;
}

export function worldLocationV1V2(
  worldContainer: WorldContainer1,
  worldName: WorldName1
): WorldLocation {
  return {
    worldName: worldNameV1V2(worldName),
    container: worldContainerV1V2(worldContainer),
  };
}

export function worldV1V2(world: World1): World2 {
  const runtime: RuntimeSettings = world.javaArguments
    ? { jvmarg: world.javaArguments }
    : {
        memory: [world.memory.size, world.memory.unit],
      };

  const players: OpPlayer[] | undefined = isError(world.players)
    ? undefined
    : world.players.map(playerV1V2);

  return {
    using: world.using ?? false,
    version: versionV1V2(world.version),
    properties: orDefault(world.properties, undefined),
    datapack: undefined,
    plugin: undefined,
    mod: undefined,
    avater_uri: world.avater_path as ImageURI2 | undefined,
    runtime,
    players,
    bannedPlayers: [], // TODO: 変換
    bannedIps: [], // TODO: 変換
    last: undefined, // TODO: 変換
  };
}

export function worldV2V1(
  id: WorldID,
  location: WorldLocation,
  world: World2
): World1 {
  const memory: MemorySettings =
    world.runtime && 'memory' in world.runtime
      ? { size: world.runtime.memory[0], unit: world.runtime.memory[1] }
      : { size: 2, unit: 'GB' };

  const javaArguments: string | undefined =
    world.runtime && 'jvmarg' in world.runtime
      ? world.runtime.jvmarg
      : undefined;

  const players = world.players?.map(
    ({ name, uuid, level, bypassesPlayerLimit }): PlayerSetting => ({
      name,
      uuid: uuid as string as PlayerUUID1,
      op: level === 0 ? undefined : { level, bypassesPlayerLimit },
    })
  );
  return {
    version: versionV2V1(world.version),
    using: world.using,
    last_date: world.last?.time as Timestamp | undefined,
    last_user: world.last?.user as PlayerUUID1 | undefined,
    last_id: undefined /** 未対応 */,
    memory,
    javaArguments,
    properties:
      world.properties ??
      errorMessage.unknown({ message: 'cannot load properties' }),
    players:
      players ?? errorMessage.unknown({ message: 'cannot load players' }),
    avater_path: world.avater_uri as ImageURI1 | undefined, // TODO: avater_path 対応
    ngrok_setting: {
      use_ngrok: false, // TODO: ngrok 対応 ,
    },
    name: location.worldName as string as WorldName1,
    container: location.container.path as WorldContainer1,
    id,
    additional: {
      datapacks: [],
      plugins: [],
      mods: [],
    }, // TODO: additional 対応 ,
  };
}

export function versionV1V2(world: Version1): Version2 {
  switch (world.type) {
    case 'vanilla':
      return VanillaVersion.parse(world);
    case 'fabric':
      return FabricVersion.parse(world);
    case 'forge':
      return ForgeVersion.parse(world);
    case 'mohistmc':
      return MohistmcVersion.parse(world);
    case 'papermc':
      return PapermcVersion.parse(world);
    case 'spigot':
      return SpigotVersion.parse(world);
  }
}

export function versionV2V1(world: Version2): Version1 {
  switch (world.type) {
    case 'vanilla':
      return VanillaVersion.parse(world);
    case 'fabric':
      return FabricVersion.parse(world);
    case 'forge':
      return ForgeVersion.parse(world);
    case 'mohistmc':
      return MohistmcVersion.parse(world);
    case 'papermc':
      return PapermcVersion.parse(world);
    case 'spigot':
      return SpigotVersion.parse(world);
    case 'unknown':
      return VanillaVersion.parse({
        type: 'vanilla',
        id: '1.20.4',
        release: true,
      }); // ダミーデータ
  }
}

export function playerV1V2(player: PlayerSetting): OpPlayer {
  return OpPlayer.parse({
    name: player.name,
    uuid: player.uuid,
    level: player.op?.level ?? 0,
    bypassesPlayerLimit: player.op?.bypassesPlayerLimit ?? false,
  });
}

/** ワールド更新の差分を取得 */
export function worldDiff(old: World2, edited: WorldEdited): WorldDiffV2[] {
  const diffs: WorldDiffV2[] = [];
  if (edited.custom_map) {
    throw new Error('未実装');
  }

  if (isValid(edited.properties)) {
    for (const { key, values } of objDiff(
      edited.properties,
      old.properties ?? {}
    )) {
      diffs.push({ type: 'property:modify', key, value: values[1] });
    }
  }

  const nextVersion = versionV1V2(edited.version);
  if (serializeVersion2(old.version) !== serializeVersion2(nextVersion)) {
    diffs.push({ type: 'version', version: nextVersion });
  }

  // edited.ngrok_setting TODO:

  const nextRuntime: RuntimeSettings = edited.javaArguments
    ? {
        jvmarg: edited.javaArguments,
      }
    : {
        memory: [edited.memory.size, edited.memory.unit],
      };
  if (isDeepStrictEqual(old.runtime, nextRuntime)) {
    diffs.push({
      type: 'runtime',
      runtime: nextRuntime,
    });
  }

  if (edited.avater_path !== old.avater_uri) {
    diffs.push({
      type: 'avater',
      avater_uri: edited.avater_path as ImageURI | undefined,
    });
  }

  if (isValid(edited.players)) {
    const editedPlayers = edited.players.map(playerV1V2);
    const playerMap = new Map(editedPlayers.map((x) => [x.uuid, x]));
    for (const p1 of old.players ?? []) {
      const p2 = playerMap.get(p1.uuid);
      if (p2) {
        playerMap.delete(p1.uuid);
        if (p1.bypassesPlayerLimit !== p2.bypassesPlayerLimit) {
          diffs.push({
            type: 'player:modify:bypassesPlayerLimit',
            bypassesPlayerLimit: p2.bypassesPlayerLimit,
          });
        }
        if (p1.name !== p2.name) {
          diffs.push({
            type: 'player:modify:name',
            name: p2.name,
          });
        }
        if (p1.level !== p2.level) {
          diffs.push({
            type: 'player:modify:level',
            level: p2.level,
          });
        }
      } else {
        diffs.push({ type: 'player:remove', uuid: p1.uuid });
      }
    }
  }

  return diffs;
}

export type WorldDiffV2 =
  // | { type: 'custom_map';  } TODO
  | { type: 'version'; version: Version2 }
  | { type: 'avater'; avater_uri: ImageURI | undefined }
  | { type: 'runtime'; runtime: RuntimeSettings }
  | { type: 'player:add'; player: OpPlayer }
  | { type: 'player:remove'; uuid: PlayerUUID2 }
  | { type: 'player:modify:bypassesPlayerLimit'; bypassesPlayerLimit: boolean }
  | { type: 'player:modify:level'; level: OpLevel }
  | { type: 'player:modify:name'; name: string }
  | {
      type: 'property:modify';
      key: string;
      value: string | number | boolean | undefined;
    };

function serializeVersion2(versionId: Version2): string {
  switch (versionId.type) {
    case 'vanilla':
      return `${versionId.type}:${versionId.id}`;
    case 'unknown':
      return `${versionId.type}`;
    case 'forge':
      return `${versionId.type}:${versionId.id}:${versionId.forge_version}`;
    case 'fabric':
      return `${versionId.type}:${versionId.id}:${versionId.loader}:${versionId.installer}`;
    case 'spigot':
      return `${versionId.type}:${versionId.id}`;
    case 'papermc':
      return `${versionId.type}:${versionId.id}:${versionId.build}`;
    case 'mohistmc':
      return `${versionId.type}:${versionId.id}:${versionId.number}`;
  }
}
