import { WorldContainer, WorldName } from 'app/src-electron/schema/brands';
import { getCurrentTimestamp } from 'app/src-electron/util/timestamp';
import { worldContainerToPath } from './worldContainer';
import { BACKUP_DIRECTORY_NAME, BACKUP_EXT } from '../const';

export function getBackUpPath(container: WorldContainer, name: WorldName) {
  const time = new Date(getCurrentTimestamp());
  const dateString = formatDate(time);
  const directory = worldContainerToPath(container).child(
    BACKUP_DIRECTORY_NAME
  );

  // {container}/#backups/{name}-YYYY-MM-DD({i})
  let path = directory.child(`${name}-${dateString}.${BACKUP_EXT}`);
  let i = 0;
  while (path.exists()) {
    path = directory.child(`${name}-${dateString}(${i}).${BACKUP_EXT}`);
    i++;
  }
  return path;
}

/** YYYY-MM-DD */
function formatDate(date: Date) {
  function paddedNumber(n: number, digit: number) {
    return n.toString().padStart(digit, '0');
  }
  const YYYY = paddedNumber(date.getFullYear(), 4);
  const MM = paddedNumber(date.getMonth(), 2);
  const DD = paddedNumber(date.getDate(), 2);

  return `${YYYY}-${MM}-${DD}`;
}
