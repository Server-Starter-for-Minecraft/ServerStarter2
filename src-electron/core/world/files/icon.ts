import { LEVEL_NAME } from '../../const';
import { BytesData } from 'app/src-electron/util/bytesData';
import { ServerSettingFile } from './base';
import { ImageURI } from 'app/src-electron/schema/brands';
import { isError, isValid } from 'app/src-electron/util/error/error';
import { errorMessage } from 'app/src-electron/util/error/construct';

const ICON_PATH = LEVEL_NAME + '/icon.png';

export const serverIconFile: ServerSettingFile<ImageURI | undefined> = {
  async load(cwdPath) {
    const iconpath = serverIconFile.path(cwdPath);
    if (iconpath.exists()) {
      const data = await BytesData.fromPath(iconpath);
      if (isValid(data)) {
        return await data.encodeURI('image/png');
      }
      return errorMessage.data.path.loadingFailed({
        type: 'file',
        path: iconpath.path,
      });
    }
    return undefined;
  },
  async save(cwdPath, value) {
    if (value === undefined) return;
    const icondata = await BytesData.fromBase64URI(value);
    if (isError(icondata)) return icondata;

    const iconpath = serverIconFile.path(cwdPath);

    await iconpath.write(icondata);
  },
  path(cwdPath) {
    return cwdPath.child(ICON_PATH);
  },
};
