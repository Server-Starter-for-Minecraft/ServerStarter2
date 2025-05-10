import { Failable } from 'app/src-electron/schema/error';
import { isError } from 'app/src-electron/util/error/error';
import { Path } from '../../util/binary/path';
import { properties } from '../../util/format/properties';
import { versionLogger } from './version';

/** Minecraft eula に同意しているか確認 */
export async function getEulaAgreement(
  eulaPath: Path
): Promise<Failable<boolean | null>> {
  const logger = versionLogger().getEulaAgreement(eulaPath);

  const readRes = await eulaPath.readText();
  if (isError(readRes)) return readRes;

  const parsed = properties.parse(readRes);
  if (!('eula' in parsed)) {
    logger.debug('missing eula config in file');
    return null;
  }

  const eula = parsed.eula.toLowerCase();
  if (eula === 'true') return true;
  if (eula === 'false') return false;

  logger.debug(`"${eula}" in not valid eula config value`);
  return null;
}

/** Minecraft eula に同意するかを保存 */
export async function setEulaAgreement(
  eulaPath: Path,
  value: boolean
): Promise<Failable<void>> {
  return await eulaPath.writeText(
    properties.stringify({ eula: value ? 'true' : 'false' })
  );
}
