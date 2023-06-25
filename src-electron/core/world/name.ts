import { WorldContainer, WorldName } from 'src-electron/schema/brands';
import { worldContainerToPath } from './worldContainer';
import { WORLDNAME_REGEX } from '../const';
import { Failable } from 'src-electron/api/failable';

export async function validateNewWorldName(
  worldContainer: WorldContainer,
  worldName: string
): Promise<Failable<WorldName>> {
  const match = worldName.match(WORLDNAME_REGEX);
  if (match === null)
    return new Error(
      `${worldName} is not a valid WorldName. WorldName must match regex ${WORLDNAME_REGEX}`
    );
  const path = worldContainerToPath(worldContainer).child(worldName);

  if (path.exists()) return new Error(`${path.str()} is alerady exists.`);

  return worldName as WorldName;
}
