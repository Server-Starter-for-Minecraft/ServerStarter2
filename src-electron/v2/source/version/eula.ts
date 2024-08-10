import { Result } from '../../util/base';
import { Path } from '../../util/binary/path';

/** Minecraft eula に同意しているか確認 */
export function getEulaAgreement(eulaPath: Path): Promise<Result<boolean>> {
  throw new Error('TODO:');
}

/** Minecraft eula に同意しているか確認 */
export function setEulaAgreement(
  eulaPath: Path,
  value: boolean
): Promise<Result<void>> {
  throw new Error('TODO:');
}
