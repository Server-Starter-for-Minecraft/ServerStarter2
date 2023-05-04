import { objMap } from 'src-electron/util/objmap';
import { defaultServerProperties } from './properties';
import { deepcopy } from 'src-electron/util/deepcopy';
import { World, WorldSettings } from 'app/src-electron/schema/world';
import {
  ServerProperties,
  ServerPropertiesMap,
} from 'app/src-electron/schema/serverproperty';
import { fixSystemSettings } from '../stores/system';
import { fix } from 'app/src-electron/util/fix';
import { WorldPlayers } from 'app/src-electron/schema/player';

type WorldSettingsPlus = {
  name: string;
  container: string;
  avater_path: string | undefined;
  settings: WorldSettings;
};

export function worldSettingsToWorld({
  name,
  container,
  avater_path,
  settings,
}: WorldSettingsPlus): World {
  const result = {
    name,
    container,
    avater_path,
    version: settings.version,
    using: settings.using,
    remote_pull: settings.remote,
    remote_push: settings.remote,
    last_date: settings.last_date,
    last_user: settings.last_user,
    memory: settings.memory,
    properties: getServerProperties(settings.properties),
    additional: {},
    players: fix<WorldPlayers>(settings.players, {
      groups: [],
      players: [],
      removed: [],
    }),
  };
  return deepcopy(result);
}

export function worldToWorldSettings(world: World): WorldSettingsPlus {
  const result = {
    name: world.name,
    container: world.container,
    avater_path: world.avater_path,
    settings: {
      memory: world.memory,
      version: world.version,
      remote: world.remote_pull,
      last_date: world.last_date,
      last_user: world.last_user,
      using: world.using,
      properties: getPropertiesMap(world.properties),
      players: world.players,
    },
  };
  return deepcopy(result);
}

function getServerProperties(
  map: ServerPropertiesMap | undefined
): ServerProperties {
  return objMap(map ?? {}, (k, value) => {
    const defaultProp = defaultServerProperties[k];
    if (defaultProp) {
      if (typeof value === defaultProp.type) {
        return [k, { ...defaultProp, value }];
      }
      return [k, { ...defaultProp }];
    }
    return [k, { type: typeof value, value }];
  }) as ServerProperties;
}

function getPropertiesMap(serverProperties: ServerProperties | undefined) {
  if (serverProperties === undefined) return undefined;
  return objMap(serverProperties, (k, v) => [k, v.value]);
}
