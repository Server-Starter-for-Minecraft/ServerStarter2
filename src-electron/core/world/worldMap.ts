import { Failable } from 'src-electron/api/failable';
import { WorldID } from 'src-electron/schema/world';
import { Path } from 'src-electron/util/path';
import { worldContainerToPath } from './worldContainer';
import { WorldContainer, WorldName } from 'src-electron/schema/brands';

export type WorldLoaction = { name: WorldName; container: WorldContainer };
const worldPathMap: Record<WorldID, WorldLoaction> = {};

export const WorldLocationMap = {
  get(id: WorldID): Failable<WorldLoaction> {
    return worldPathMap[id] ?? new Error(`missing world id:${id}`);
  },
  set(id: WorldID, path: WorldLoaction): void {
    worldPathMap[id] = path;
  },
  delete(id: WorldID): void {
    delete worldPathMap[id];
  },
};

export function wroldLocationToPath(location: WorldLoaction): Path {
  return worldContainerToPath(location.container).child(location.name);
}
