import { createI18n } from 'vue-i18n';
import { errorMessage } from 'app/src-electron/util/error/construct';
import { orDefault } from 'app/src-electron/util/error/failable';
import { VanillaVersion, Version } from '../../schema/version';
import { World, WorldLocation } from '../../schema/world';
import * as v1 from '../v1schema';

export const worldDataConverter = {
  V2ToV1(v2: World, id: v1.WorldID, location: WorldLocation): v1.World {
    const memory: v1.MemorySettings =
      v2.runtime && 'memory' in v2.runtime
        ? { size: v2.runtime.memory[0], unit: v2.runtime.memory[1] }
        : { size: 2, unit: 'GB' };

    const javaArguments: string | undefined =
      v2.runtime && 'jvmarg' in v2.runtime ? v2.runtime.jvmarg : undefined;

    const players = v2.players?.map(
      ({ name, uuid, level, bypassesPlayerLimit }): v1.PlayerSetting => ({
        name,
        uuid: uuid as string as v1.PlayerUUID,
        op: level === 0 ? undefined : { level, bypassesPlayerLimit },
      })
    );
    return {
      version: versionConverter.V2ToV1(v2.version),
      using: v2.using,
      remote: undefined /** 廃止 */,
      last_date: v2.last?.time as v1.Timestamp | undefined,
      last_user: v2.last?.user as v1.PlayerUUID | undefined,
      last_id: undefined /** 未対応 */,
      // TODO: v2ではmemoryとjavaArgumentsが共存しなくなったのでそれに対応
      memory,
      javaArguments,
      properties:
        v2.properties ??
        errorMessage.unknown({ message: 'cannot load properties' }), // TODO: 本当はv2Errorにすべき
      players:
        players ?? errorMessage.unknown({ message: 'cannot load players' }), // TODO: 本当はv2Errorにすべき
      avater_path: undefined, // TODO: avater_path 対応
      ngrok_setting: {
        use_ngrok: false,
      }, // TODO: ngrok 対応 ,
      name: location.worldName as string as v1.WorldName,
      container: location.container.path as v1.WorldContainer,
      id,
      additional: {
        datapacks: [],
        plugins: [],
        mods: [],
      }, // TODO: additional 対応 ,
    };
  },
  V1ToV2(v1: v1.World): World {
    return {
      using: v1.using ?? false,
      version: versionConverter.V1ToV2(v1.version),
      properties: orDefault(v1.properties, undefined),
      datapack: undefined,
      plugin: undefined,
      mod: undefined,
      runtime: { memory: [2, 'GB'] }, // TODO: 変換
      players: [], // TODO: 変換
      bannedPlayers: [], // TODO: 変換
      bannedIps: [], // TODO: 変換
      last: undefined, // TODO: 変換
    };
  },
};

export const versionConverter = {
  V2ToV1(v2: Version): v1.Version {
    // TODO: 変換
    return {
      type: 'vanilla',
      id: '1.20.4',
      release: true,
    };
  },
  V1ToV2(v1: v1.Version): Version {
    // TODO: 変換
    return VanillaVersion.parse({
      type: 'vanilla',
      id: '1.20.4',
      release: true,
    });
  },
};
