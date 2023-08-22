import {
  Timestamp,
  WorldContainer,
  WorldName,
} from 'app/src-electron/schema/brands';
import { getCurrentTimestamp } from 'app/src-electron/util/timestamp';
import { worldContainerToPath } from './worldContainer';
import {
  BACKUP_DIRECTORY_NAME,
  BACKUP_EXT,
  WORLDNAME_REGEX_STR,
} from '../const';
import { Path } from 'app/src-electron/util/path';
import { BackupData } from 'app/src-electron/schema/filedata';
import { errorMessage } from 'app/src-electron/util/error/construct';
import { Failable } from 'app/src-electron/schema/error';

export function getBackUpPath(container: WorldContainer, name: WorldName) {
  const time = new Date(getCurrentTimestamp());
  const dateString = formatDate(time);
  const directory = worldContainerToPath(container).child(
    BACKUP_DIRECTORY_NAME
  );

  // {container}/#backups/{name}-YYYY-MM-DD-HH({i})
  let path = directory.child(`${name}-${dateString}.${BACKUP_EXT}`);
  let i = 0;
  while (path.exists()) {
    path = directory.child(`${name}-${dateString}(${i}).${BACKUP_EXT}`);
    i++;
  }
  return path;
}

export async function parseBackUpPath(
  path: Path
): Promise<Failable<BackupData>> {
  const ext = path.extname();
  if (ext !== '.' + BACKUP_EXT)
    return errorMessage.data.path.invalidExt({
      expectedExt: BACKUP_EXT,
      path: path.str(),
    });
  const name = path.stemname();
  const match = name.match(
    new RegExp(
      `^(${WORLDNAME_REGEX_STR})-(\\d{4})-(\\d{2})-(\\d{2})-(\\d{2})(\\(\\d+\\))?$`
    )
  );
  if (match === null)
    return {
      kind: 'backup',
      name: name,
      path: path.str(),
    };
  return {
    kind: 'backup',
    name: match[1],
    time: deformatDate(
      match[2],
      match[3],
      match[4],
      match[5]
    ).getTime() as Timestamp,
    path: path.str(),
  };
}

/** YYYY-MM-DD-HH */
function formatDate(date: Date) {
  function paddedNumber(n: number, digit: number) {
    return n.toString().padStart(digit, '0');
  }
  const YYYY = paddedNumber(date.getFullYear(), 4);
  const MM = paddedNumber(date.getMonth() + 1, 2);
  const DD = paddedNumber(date.getDate(), 2);
  const HH = paddedNumber(date.getHours(), 2);

  return `${YYYY}-${MM}-${DD}-${HH}`;
}

/** YYYY-MM-DD-HH */
function deformatDate(yyyy: string, mm: string, dd: string, hh: string) {
  return new Date(
    Number.parseInt(yyyy),
    // monthIndex は [0,11]
    Number.parseInt(mm) - 1,
    Number.parseInt(dd),
    Number.parseInt(hh)
  );
}
