import { WorldContainer, WorldName } from 'src-electron/schema/brands';
import { errorMessage } from 'app/src-electron/util/error/construct';
import { Failable } from 'app/src-electron/util/error/failable';
import { worldContainerToPath } from './worldContainer';

export async function validateNewWorldName(
  worldContainer: WorldContainer,
  worldName: string
): Promise<Failable<WorldName>> {
  const validName = WorldName.safeParse(worldName);
  if (!validName.success)
    return errorMessage.value.worldName.notMatchRegex({
      value: worldName,
    });

  const path = worldContainerToPath(worldContainer).child(worldName);

  if (await path.exists())
    return errorMessage.value.worldName.alreadyUsed({
      value: worldName,
    });

  return validName.data;
}
