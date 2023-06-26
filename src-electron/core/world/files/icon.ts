import { LEVEL_NAME } from '../../const';
import { BytesData } from 'app/src-electron/util/bytesData';
import { isFailure, isSuccess } from 'app/src-electron/api/failable';
import { ServerSettingFile } from './base';
import { ImageURI } from 'app/src-electron/schema/brands';

const ICON_PATH = LEVEL_NAME + '/icon.png';

export const serverIconFile: ServerSettingFile<ImageURI> = {
  async load(cwdPath) {
    const iconpath = cwdPath.child(ICON_PATH);
    if (iconpath.exists()) {
      const data = await BytesData.fromPath(iconpath);
      if (isSuccess(data)) {
        return await data.encodeURI('image/png');
      }
    }
    return new Error(`failed to load ${iconpath.path}`);
  },
  async save(cwdPath, value) {
    const icondata = await BytesData.fromBase64URI(value);
    if (isFailure(icondata)) return icondata;

    const iconpath = cwdPath.child(ICON_PATH);

    await iconpath.write(icondata);
  },
};
