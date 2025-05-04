import { z } from 'zod';
import { PlayerUUID } from 'app/src-electron/schema/brands';
import { errorMessage } from 'app/src-electron/util/error/construct';
import { isError } from 'app/src-electron/util/error/error';
import { ServerSettingFile } from './base';

export const WhitelistRecord = z.object({
  uuid: PlayerUUID,
  name: z.string(),
});
export type WhitelistRecord = z.infer<typeof WhitelistRecord>;

export const Whitelist = z.array(WhitelistRecord);
export type Whitelist = z.infer<typeof Whitelist>;

export const WHILTELIST_FILE = 'whitelist.json';

export const serverWhitelistFile: ServerSettingFile<Whitelist> = {
  async load(cwdPath) {
    const filePath = cwdPath.child(WHILTELIST_FILE);

    // ファイルが存在しない場合空リストを返す
    if (!filePath.exists()) return [];

    const value = await filePath.readJson(Whitelist);

    if (isError(value)) return value;
    const fixed = Whitelist.safeParse(value);

    if (!fixed.success)
      return errorMessage.data.path.invalidContent.invalidWhitelistJson({
        type: 'file',
        path: filePath.path,
      });

    return fixed.data;
  },
  save(cwdPath, value) {
    return cwdPath.child(WHILTELIST_FILE).writeText(JSON.stringify(value));
  },
  path(cwdPath) {
    return cwdPath.child(WHILTELIST_FILE);
  },
};
