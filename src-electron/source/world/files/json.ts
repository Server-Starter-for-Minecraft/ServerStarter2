import { z } from 'zod';
import { PlayerUUID, Timestamp, UUID } from 'app/src-electron/schema/brands';
import { MemorySettings } from 'app/src-electron/schema/memory';
import { NgrokSetting } from 'app/src-electron/schema/ngrok';
import { Remote } from 'app/src-electron/schema/remote';
import { Version } from 'app/src-electron/schema/version';
import { errorMessage } from 'app/src-electron/util/error/construct';
import { isError } from 'app/src-electron/util/error/error';
import { worldLoggers } from '../base';
import { ServerSettingFile } from './base';

const logger = worldLoggers().json;

/**
 * ワールドのディレクトリ構成
 * vanilla : world { DIM-1 | DIM1}
 * plugin  : world | world_nether | world_end
 */
export const WorldDirectoryTypes = z.union([
  z.literal('vanilla'),
  z.literal('plugin'),
]);
export type WorldDirectoryTypes = z.infer<typeof WorldDirectoryTypes>;

/**
 * ワールドの設定
 * server_settings.jsonの内容
 */
export const WorldSettings = z.object({
  /** 使用メモリ量 */
  memory: MemorySettings,

  /** Javaの実行時引数 */
  javaArguments: z.string().optional(),

  /** バージョン */
  version: Version,

  /** 同期先のリモートリポジトリ */
  remote: Remote.optional(),

  /** 最終プレイ日
   *
   * 協定世界時 (UTC) 1970 年 1 月 1 日 00:00:00 からのミリ秒単位の経過時間を表す数値
   * new Dateの引数にすることで日付が得られる
   */
  last_date: Timestamp.optional(),

  /** 最終プレイ者 */
  last_user: PlayerUUID.optional(),

  /** 最終プレイ環境 */
  last_id: UUID.optional(),

  /** 起動中フラグ */
  using: z.boolean().optional(),

  /** ディレクトリ構成 "vanilla" | "plugin" */
  directoryType: WorldDirectoryTypes.optional(),

  /** Ngrokによるポート開放不要化機能を利用するか */
  ngrok_setting: NgrokSetting,
});
export type WorldSettings = z.infer<typeof WorldSettings>;

export const WORLD_SETTINGS_PATH = 'server_settings.json';

export const serverJsonFile: ServerSettingFile<WorldSettings> = {
  async load(cwdPath) {
    const jsonPath = cwdPath.child(WORLD_SETTINGS_PATH);

    const data = await jsonPath.readJson(WorldSettings);
    if (isError(data)) {
      logger.load(cwdPath.path).error(data);
      return errorMessage.data.path.invalidContent.invalidWorldSettingJson({
        type: 'file',
        path: jsonPath.path,
      });
    }

    return data;
  },
  async save(cwdPath, value) {
    const jsonPath = cwdPath.child(WORLD_SETTINGS_PATH);
    return await jsonPath.writeJson(value);
  },
  path(cwdPath) {
    return cwdPath.child(WORLD_SETTINGS_PATH);
  },
};
