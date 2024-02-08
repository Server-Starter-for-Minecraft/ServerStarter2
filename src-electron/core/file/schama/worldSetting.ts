import { fixConst } from '../base/fixer/const';
import { MemorySettings$1, defaultMemorySettings$1 } from './world';
import { Version$1 } from './version';
import { Remote$1 } from './remote';
import { NgrokSetting$1, defaultNgrokSetting$1 } from './ngrok';
import { fixObject } from '../base/fixer/object';
import { fixBoolean, fixNumber, fixString } from '../base/fixer/primitive';
import { fixPlayerUUID, fixTimestamp, fixUUID } from '../base/fixer/brand';
import { PlayerUUID, Timestamp, UUID } from 'app/src-electron/schema/brands';

/**
 * ワールドのディレクトリ構成
 * vanilla : world { DIM-1 | DIM1}
 * plugin  : world | world_nether | world_end
 */
export type WorldDirectoryTypes$1 = 'vanilla' | 'plugin';
export const WorldDirectoryTypes$1 = fixConst<WorldDirectoryTypes$1>(
  'vanilla',
  'plugin'
);

/**
 * ワールドの設定
 * server_settings.jsonの内容
 */ export type WorldSettings$1 = {
  /** 使用メモリ量 */
  memory: MemorySettings$1;

  /** Javaの実行時引数 */
  javaArguments?: string;

  /** バージョン */
  version: Version$1;

  /** 同期先のリモートリポジトリ */
  remote?: Remote$1;

  /** 最終プレイ日
   *
   * 協定世界時 (UTC) 1970 年 1 月 1 日 00:00:00 からのミリ秒単位の経過時間を表す数値
   * new Dateの引数にすることで日付が得られる
   */
  last_date?: Timestamp;

  /** 最終プレイ者 */
  last_user?: PlayerUUID;

  /** 最終プレイ環境 */
  last_id?: UUID;

  /** 起動中フラグ */
  using?: boolean;

  /** ディレクトリ構成 "vanilla" | "plugin" */
  directoryType?: WorldDirectoryTypes$1;

  /** Ngrokによるポート開放不要化機能を利用するか */
  ngrok_setting: NgrokSetting$1;
};

export const WorldSettings$1 = fixObject<WorldSettings$1>({
  memory: MemorySettings$1.default(defaultMemorySettings$1),
  javaArguments: fixString.optional(),
  version: Version$1,
  remote: Remote$1.optional(),
  last_date: fixTimestamp.optional(),
  last_user: fixPlayerUUID.optional(),
  last_id: fixUUID.optional(),
  using: fixBoolean.optional(),
  directoryType: WorldDirectoryTypes$1.optional(),
  ngrok_setting: NgrokSetting$1.default(defaultNgrokSetting$1),
});
