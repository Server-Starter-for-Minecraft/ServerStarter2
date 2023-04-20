import { WorldSettings } from 'app/src-electron/api/scheme';
import {
  defaultServerProperties,
  stringifyServerProperties,
} from './settings/properties';
import { Path } from '../utils/path/path';

/** サーバー設定系ファイルをサーバーCWD直下に書き出す */
export async function unrollSettings(
  settings: WorldSettings,
  levelName: string,
  serverCwdPath: Path
) {
  // server.properties を書き出し
  const strprop = stringifyServerProperties({
    ...(settings.properties ?? defaultServerProperties),
    'level-name': levelName,
  });
  serverCwdPath.child('server.properties').writeText(strprop);
}
