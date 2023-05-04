import {
  ServerProperties,
  ServerProperty,
  SystemWorldSettings,
  World,
  WorldSettings,
} from 'src-electron/api/schema';
import {
  defaultServerProperties,
  mergeServerProperties,
  serverPropertiesHandler,
  stringifyServerProperties,
} from './properties';
import { Path } from '../../util/path';
import { saveWorldJson } from '../world/worldJson';
import { systemSettings } from '../stores/system';
import { asyncMap, objMap } from 'src-electron/util/objmap';
import { opsHandler } from './ops';
import { whitelistHandler } from './whitelist';
import { bannedIpsHandler } from './bannedIps';
import { bannedPlayersHandler } from './bannedPlayers';

const handlers = [
  serverPropertiesHandler,
  opsHandler,
  whitelistHandler,
  bannedIpsHandler,
  bannedPlayersHandler,
] as const;

/** TODO: server.properies/ops.json/whiltelist.jsonを削除 */
export async function removeServerSettingFiles(serverCwdPath: Path) {
  await asyncMap(handlers, (handler) => handler.remove(serverCwdPath));
}

/** server_settings.jsonをサーバーCWD直下に書き出す */
export async function saveWorldSettingsJson(world: World, serverCwdPath: Path) {
  const worldSettings: WorldSettings = {
    memory: world.memory,
    version: world.version,
    remote: world.remote_pull,
    last_date: world.last_date,
    last_user: world.last_user,
    using: world.using,
    properties: getPropertiesMap(world.properties),
  };

  // jsonを書き出し
  await saveWorldJson(serverCwdPath, worldSettings);
}

/** サーバー設定系ファイルをサーバーCWD直下に書き出す */
export async function unrollSettings(world: World, serverCwdPath: Path) {
  // server.properties を書き出し
  const strprop = stringifyServerProperties(
    world.properties ?? defaultServerProperties
  );
  await serverCwdPath.child('server.properties').writeText(strprop);

  const promisses = [
    serverPropertiesHandler.save(
      serverCwdPath,
      world.properties ?? defaultServerProperties
    ),
    // opsHandler.save(serverCwdPath, world.ops ?? []),
    // whitelistHandler.save(serverCwdPath, world.ops ?? []),
    // bannedIpsHandler.save(serverCwdPath, world.ops ?? []),
    // bannedPlayersHandler.save(serverCwdPath, world.ops ?? []),
  ] as const;

  world;
}

function getPropertiesMap(serverProperties: ServerProperties | undefined) {
  if (serverProperties === undefined) return undefined;
  return objMap(serverProperties, (k, v) => [k, v.value]);
}

// Javaの-Xmx,-Xmsのデフォルト値(Gb)
const DEFAULT_JAVA_HEAP_SIZE = 2;

// ワールド設定のデフォルト値を取得
export async function getDefaultSettings(): Promise<SystemWorldSettings> {
  const settings = systemSettings.get('world');

  let prop = settings?.properties;
  if (prop === undefined) prop = {};
  const undefLessProps = Object.fromEntries(
    Object.entries(prop)
      .map(([k, v]): [string, ServerProperty | undefined] => {
        if (v === undefined) return [k, v];
        if (v.type === undefined) return [k, undefined];
        if (v.value === undefined) return [k, undefined];
        // TODO: 怪しいアップキャスト
        return [k, v as ServerProperty];
      })
      .filter<[string, ServerProperty]>(
        (value): value is [string, ServerProperty] => value[0] !== undefined
      )
  );

  const properties = mergeServerProperties(
    defaultServerProperties,
    undefLessProps
  );

  const memory = settings?.memory ?? DEFAULT_JAVA_HEAP_SIZE;

  const setting = { properties, memory };

  // 保存
  await setDefaultSettings(setting);

  return setting;
}

// ワールド設定のデフォルト値を保存
export async function setDefaultSettings(
  worldSettings: SystemWorldSettings
): Promise<void> {
  systemSettings.set('world', worldSettings);
}
