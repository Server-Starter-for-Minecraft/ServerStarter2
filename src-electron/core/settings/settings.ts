import {
  defaultServerProperties,
  mergeServerProperties,
  serverPropertiesHandler,
} from './files/properties';
import { Path } from '../../util/path';
import { saveWorldJson } from './worldJson';
import { systemSettings } from '../stores/system';
import { asyncMap, objMap } from 'src-electron/util/objmap';
import { opsHandler } from './files/ops';
import { whitelistHandler } from './files/whitelist';
import {
  FoldSettings,
  SystemWorldSettings,
  World,
  WorldSettings,
} from 'src-electron/schema/world';
import {
  ServerProperties,
  ServerProperty,
} from 'src-electron/schema/serverproperty';
import { constructOpsAndWhitelist, constructPleyerSettings } from './players';
import { orDefault } from 'app/src-electron/api/failable';

const handlers = [
  serverPropertiesHandler,
  opsHandler,
  whitelistHandler,
  // BAN系のファイルは参照しない
  // bannedIpsHandler,
  // bannedPlayersHandler,
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
    players: world.players,
    javaArguments: world.javaArguments,
    properties: world.properties,
  };

  // jsonを書き出し
  await saveWorldJson(serverCwdPath, worldSettings);
}

/** サーバー設定系ファイルをサーバーCWD直下に書き出す */
export async function unfoldSettings(
  serverCwdPath: Path,
  { properties, players }: FoldSettings
): Promise<void> {
  // ops.json/whitelist.jsonの中身を算出
  const { ops, whitelist } = constructOpsAndWhitelist(players);

  // 設定ファイルを保存
  const promisses = [
    // server.properties
    serverPropertiesHandler.save(serverCwdPath, properties),
    // ops.json
    opsHandler.save(serverCwdPath, ops),
    // whitelist.json
    whitelistHandler.save(serverCwdPath, whitelist),
    // bannedIpsHandler.save(serverCwdPath, world.ops ?? []),
    // bannedPlayersHandler.save(serverCwdPath, world.ops ?? []),
  ] as const;

  await Promise.all(promisses);
}

/** サーバー設定系ファイルをサーバーCWD直下から読み込む */
export async function foldSettings(serverCwdPath: Path): Promise<FoldSettings> {
  // 設定ファイルを読みこみ
  const promisses = [
    // server.properties
    serverPropertiesHandler.load(serverCwdPath),
    // ops.json
    opsHandler.load(serverCwdPath),
    // whitelist.json
    whitelistHandler.load(serverCwdPath),
    // bannedIpsHandler.save(serverCwdPath, world.ops ?? []),
    // bannedPlayersHandler.save(serverCwdPath, world.ops ?? []),
  ] as const;

  const [properties, ops, whitelist] = await Promise.all(promisses);

  const players = constructPleyerSettings({
    ops: orDefault(ops, []),
    whitelist: orDefault(whitelist, []),
  });

  return {
    properties: orDefault(properties, {}),
    players,
  };
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
