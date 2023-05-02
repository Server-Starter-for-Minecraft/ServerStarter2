import {
  ServerProperty,
  SystemWorldSettings,
  World,
} from 'src-electron/api/schema';
import {
  defaultServerProperties,
  mergeServerProperties,
  stringifyServerProperties,
} from './properties';
import { Path } from '../../util/path';
import { saveWorldJson } from '../world/worldJson';
import { systemSettings } from '../stores/system';

/** サーバー設定系ファイルをサーバーCWD直下に書き出す */
export async function unrollSettings(
  world: World,
  levelName: string,
  serverCwdPath: Path
) {
  // server.properties を書き出し
  const strprop = stringifyServerProperties({
    ...(world.properties ?? defaultServerProperties),
    'level-name': { type: 'string', value: levelName },
  });
  await serverCwdPath.child('server.properties').writeText(strprop);

  // jsonを書き出し
  await saveWorldJson(serverCwdPath, world.settings);
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
