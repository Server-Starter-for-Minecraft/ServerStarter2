import { WorldSettings } from 'app/src-electron/api/scheme';
import { serverCwdPath } from './const';
import {
  defaultServerProperties,
  stringifyServerProperties,
} from './settings/properties';

/** サーバー設定系ファイルをサーバーCWD直下に書き出す */
export async function unrollSettings(
  settings: WorldSettings,
  levelName: string
) {
  // server.properties を書き出し
  const strprop = stringifyServerProperties({
    ...(settings.properties ?? defaultServerProperties),
    'level-name': levelName,
  });
  serverCwdPath.child('server.properties').writeText(strprop);
}
