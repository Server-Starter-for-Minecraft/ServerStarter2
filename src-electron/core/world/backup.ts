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
import { WorldLocalLocation } from './handler/localLocation';
import { DateFormatter } from 'app/src-electron/util/dateFormatter';

export function getBackUpPath(location: WorldLocalLocation) {
  const time = new Date(getCurrentTimestamp());
  const dateString = dateFormatter.format(time);
  const directory = location.path.parent().child(BACKUP_DIRECTORY_NAME);

  // {container}/#backups/{name}-YYYY-MM-DD-HH({i})
  let path = directory.child(`${location.name}-${dateString}.${BACKUP_EXT}`);
  let i = 1;
  while (path.exists()) {
    path = directory.child(`${location.name}-${dateString}(${i}).${BACKUP_EXT}`);
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
const dateFormatter = new DateFormatter(date => `${date.YYYY}-${date.MM}-${date.DD}-${date.HH}`)

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
