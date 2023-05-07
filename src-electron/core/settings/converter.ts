import { objMap } from 'src-electron/util/objmap';
import { deepcopy } from 'src-electron/util/deepcopy';
import { World, WorldID, WorldSettings } from 'src-electron/schema/world';
import {
  ServerProperties,
  ServerPropertiesMap,
} from 'src-electron/schema/serverproperty';
import { defaultServerProperties } from './files/properties';
import { WorldContainer, WorldName } from 'app/src-electron/schema/brands';

type WorldSettingsPlus = {
  id: WorldID;
  name: WorldName;
  container: WorldContainer;
  avater_path: string | undefined;
  settings: WorldSettings;
};

export function worldSettingsToWorld({
  id,
  name,
  container,
  avater_path,
  settings,
}: WorldSettingsPlus): World {
  const result: World = {
    id,
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
    players: settings.players,
  };

  return deepcopy(result);
}

export function worldToWorldSettings(world: World): WorldSettingsPlus {
  const result = {
    id: world.id,
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
