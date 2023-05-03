import {
  ServerProperties,
  ServerPropertiesMap,
  World,
  WorldSettings,
} from 'app/src-electron/api/schema';
import { objMap } from 'app/src-electron/util/objmap';
import { defaultServerProperties } from './properties';

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
  return {
    name,
    container,
    avater_path,
    version: settings.version,
    using: settings.using,
    remote: settings.remote,
    last_date: settings.last_date,
    last_user: settings.last_user,
    memory: settings.memory,
    properties: getServerProperties(settings.properties),
    additional: {},
  };
}

export function worldToWorldSettings(world: World): WorldSettingsPlus {
  return {
    name: world.name,
    container: world.container,
    avater_path: world.avater_path,
    settings: {
      memory: world.memory,
      version: world.version,
      remote: world.remote,
      last_date: world.last_date,
      last_user: world.last_user,
      using: world.using,
      properties: getPropertiesMap(world.properties),
    },
  };
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
