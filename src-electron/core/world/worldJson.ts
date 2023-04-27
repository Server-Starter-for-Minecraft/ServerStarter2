import { isFailure } from 'src-electron/api/failable';
import { Path } from '../../util/path';
import {
  Remote,
  Version,
  WorldSettings,
  versionTypes,
} from 'src-electron/api/schema';

export const server_settings_file_name = 'server_settings.json';

export function getWorldJsonPath(cwd: Path) {
  return cwd.child(server_settings_file_name);
}

export async function loadWorldJson(cwd: Path) {
  const jsonpath = getWorldJsonPath(cwd);
  if (!jsonpath.exists()) return new Error(`${jsonpath.str()} not exists.`);

  const json = await jsonpath.readJson<WorldSettings>();
  if (isFailure(json)) return json;

  if (json.version === undefined)
    return new Error(`"version" is missing in ${jsonpath.str()}.`);

  if (!versionTypes.includes(json.version.type))
    return new Error(
      `unexpected value version.type:${json.version.type} in ${jsonpath.str()}.`
    );

  return json;
}

export async function saveWorldJson(cwd: Path, json: WorldSettings) {
  const jsonpath = getWorldJsonPath(cwd);
  await jsonpath.writeText(JSON.stringify(json));
}
