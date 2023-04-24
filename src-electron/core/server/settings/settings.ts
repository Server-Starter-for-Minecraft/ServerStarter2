import { WorldSettings } from 'app/src-electron/api/schema';
import {
  defaultServerProperties,
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

export async function getDefaultSettings(): Promise<WorldSettings> {
  return serverStarterSetting.get('default_settings');
}
