import { OpLevel } from 'src-electron/schema/player';
import { z } from 'zod';
import { PlayerUUID } from 'app/src-electron/schema/brands';
import { errorMessage } from 'app/src-electron/util/error/construct';
import { isError } from 'app/src-electron/util/error/error';
import { ServerSettingFile } from './base';

export const OpRecord = z.object({
  uuid: PlayerUUID,
  name: z.string(),
  level: OpLevel,
  bypassesPlayerLimit: z.boolean().default(false),
});
export type OpRecord = z.infer<typeof OpRecord>;

export const Ops = z.array(OpRecord);
export type Ops = z.infer<typeof Ops>;

const OPS_FILE = 'ops.json';

export const serverOpsFile: ServerSettingFile<Ops> = {
  async load(cwdPath) {
    const filePath = cwdPath.child(OPS_FILE);

    // ファイルが存在しない場合空リストを返す
    if (!filePath.exists()) return [];

    const value = await filePath.readJson<Ops>();
    if (isError(value)) return value;

    const fixed = Ops.safeParse(value);
    if (!fixed.success)
      return errorMessage.data.path.invalidContent.invalidOpsJson({
        type: 'file',
        path: filePath.path,
      });

    return fixed.data;
  },
  save(cwdPath, value) {
    return cwdPath.child(OPS_FILE).writeText(JSON.stringify(value));
  },
  path(cwdPath) {
    return cwdPath.child(OPS_FILE);
  },
};
