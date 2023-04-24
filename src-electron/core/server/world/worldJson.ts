import { isFailure } from 'app/src-electron/api/failable';
import { Path } from '../../utils/path/path';
import { Remote, Version, versionTypes } from 'app/src-electron/api/schema';

export type WorldSettingJson = {
  version: Version;
  memory?: number;
  remote?: Remote;
};

export function getWorldJsonPath(cwd: Path) {
  return cwd.child('serverstarter.json');
}

export async function loadWorldJson(cwd: Path) {
  const jsonpath = getWorldJsonPath(cwd);
  if (!jsonpath.exists()) return new Error(`${jsonpath.str()} not exists.`);

  const json = await jsonpath.readJson<WorldSettingJson>();
  if (isFailure(json)) return json;

  if (json.version === undefined)
    return new Error(`"version" is missing in ${jsonpath.str()}.`);

  if (!versionTypes.includes(json.version.type))
    return new Error(
      `unexpected value version.type:${json.version.type} in ${jsonpath.str()}.`
    );

  return json;
}
