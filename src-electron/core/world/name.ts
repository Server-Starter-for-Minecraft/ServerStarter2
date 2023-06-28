import { WorldContainer, WorldName } from 'src-electron/schema/brands';
import { worldContainerToPath } from './worldContainer';
import { WORLDNAME_REGEX } from '../const';
import { Failable } from 'app/src-electron/util/error/failable';
import { errorMessage } from 'app/src-electron/util/error/construct';

export async function validateNewWorldName(
  worldContainer: WorldContainer,
  worldName: string
): Promise<Failable<WorldName>> {
  console.log(worldContainer, worldName);
  const match = worldName.match(WORLDNAME_REGEX);
  if (match === null)
    return errorMessage.invalidValue({
      key: 'worldName',
      attr: {
        name: worldName,
        reason: 'notMatchRegex',
      },
    });

  const path = worldContainerToPath(worldContainer).child(worldName);

  if (path.exists())
    return errorMessage.invalidValue({
      key: 'worldName',
      attr: {
        name: worldName,
        reason: 'alreadyUsed',
      },
    });

    return worldName as WorldName;
}
