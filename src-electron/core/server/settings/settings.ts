import { WorldSettings } from 'src-electron/api/schema';
import {
  defaultServerProperties,
  mergeServerProperties,
  stringifyServerProperties,
} from './properties';
import { Path } from '../../utils/path/path';
import { serverStarterSetting } from '../../setting';

/** サーバー設定系ファイルをサーバーCWD直下に書き出す */
export async function unrollSettings(
  settings: WorldSettings,
  levelName: string,
  serverCwdPath: Path
) {
  // server.properties を書き出し
  const strprop = stringifyServerProperties({
    ...(settings.properties ?? defaultServerProperties),
    'level-name': { type: 'string', value: levelName },
  });
  serverCwdPath.child('server.properties').writeText(strprop);
}

// Javaの-Xmx,-Xmsのデフォルト値(Gb)
const DEFAULT_JAVA_HEAP_SIZE = 2;

// ワールド設定のデフォルト値を取得
export async function getDefaultSettings(): Promise<WorldSettings> {
  const settings = serverStarterSetting.get('default_settings');

  const properties = mergeServerProperties(
    defaultServerProperties,
    settings?.properties ?? {}
  );

  const memory = settings?.memory ?? DEFAULT_JAVA_HEAP_SIZE;

  const setting = { properties, memory };

  // 保存
  await setDefaultSettings(setting);

  return setting;
}

// ワールド設定のデフォルト値を保存
export async function setDefaultSettings(
  worldSettings: WorldSettings
): Promise<void> {
  serverStarterSetting.set('default_settings', worldSettings);
}
