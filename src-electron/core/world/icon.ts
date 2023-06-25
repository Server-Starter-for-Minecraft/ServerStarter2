import { Path } from 'app/src-electron/util/path';
import { LEVEL_NAME } from '../const';
import { BytesData } from 'app/src-electron/util/bytesData';
import { Failable, isFailure, isSuccess } from 'app/src-electron/api/failable';

export async function getIconURI(cwd: Path) {
  let iconURI: string | undefined = undefined;
  const iconpath = cwd.child(LEVEL_NAME + '/icon.png');
  if (iconpath.exists()) {
    const data = await BytesData.fromPath(iconpath);
    if (isSuccess(data)) {
      iconURI = await data.encodeURI('image/png');
    }
  }
  return iconURI;
}

export async function setIconURI(
  cwd: Path,
  uri: string
): Promise<Failable<undefined>> {
  const icondata = await BytesData.fromBase64URI(uri);
  if (isFailure(icondata)) return icondata;

  const iconpath = cwd.child(LEVEL_NAME + '/icon.png');

  iconpath.write(icondata);
}
