import { Failable } from 'app/src-electron/api/failable';
import { WorldID } from 'app/src-electron/schema/world';
import { Path } from 'app/src-electron/util/path';
import { worldContainerToPath } from './worldContainer';

export type WorldLoaction = { name: string; container: string };
const worldPathMap: Record<WorldID, WorldLoaction> = {};

export const WorldPathMap = {
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
