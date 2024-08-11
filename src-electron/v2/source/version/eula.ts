import { err, ok, Result } from '../../util/base';
import { Path } from '../../util/binary/path';
import { properties } from '../../util/format/properties';

/** Minecraft eula に同意しているか確認 */
export async function getEulaAgreement(
  eulaPath: Path
): Promise<Result<boolean>> {
  return (await eulaPath.readText()).onOk((x) => {
    const parsed = properties.parse(x);
    if (!('eula' in parsed)) return err.error('missing eula config in file');
    const eula = parsed.eula.toLowerCase();
    if (eula === 'true') return ok(true);
    if (eula === 'false') return ok(false);
    return err.error(`"${eula}" in not valid eula config value`);
  });
}

/** Minecraft eula に同意するかを保存 */
export async function setEulaAgreement(
  eulaPath: Path,
  value: boolean
): Promise<Result<void>> {
  return await eulaPath.writeText(
    properties.stringify({ eula: value ? 'true' : 'false' })
  );
}
