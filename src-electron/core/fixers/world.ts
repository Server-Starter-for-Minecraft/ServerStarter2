import {
  FoldSettings,
  SystemWorldSettings,
  WorldAbbr,
  WorldBase,
  WorldID,
} from 'app/src-electron/schema/world';
import {
  Fixer,
  arrayFixer,
  booleanFixer,
  defaultFixer,
  extendFixer,
  numberFixer,
  objectFixer,
  optionalFixer,
  stringFixer,
} from 'app/src-electron/util/detaFixer/fixer';
import {
  fixPlayerUUID,
  fixUUID,
  fixWorldContainer,
  fixWorldName,
} from './brands';
import { fixVersion } from './version';
import { fixRemote } from './remote';
import { fixPlayerSetting } from './player';
import { fixMemorySettings } from './memory';
import { DEFAULT_MEMORY, DEFAULT_SERVER_PROPERTIES } from '../const';
import { fixServerProperties } from './serverproperty';

export const fixWorldID = fixUUID as Fixer<WorldID>;

/** 取得が速い代わりに情報が少ないワールド */
export const fixWorldAbbr = objectFixer<WorldAbbr>(
  {
    /** ICONのパス (たぶんフロントからローカルのファイル読めないのでB64形式でエンコードされた物になるか) */
    /** ワールド名 */
    name: fixWorldName,

    /** ディレクトリ */
    container: fixWorldContainer,

    /** ワールドのID (ServerStarterが起動するごとに変わる) */
    id: fixWorldID,
  },
  false
);

/** ワールドごとの設定 */
export const fixWorldBase = extendFixer<WorldBase, WorldAbbr>(
  fixWorldAbbr,
  {
    /** バージョン */
    version: fixVersion,

    /** 起動中フラグ */
    using: optionalFixer(booleanFixer()),

    /** 同期先のリモート */
    remote: optionalFixer(fixRemote),

    /** 最終プレイ日
     *
     * 協定世界時 (UTC) 1970 年 1 月 1 日 00:00:00 からのミリ秒単位の経過時間を表す数値
     * new Dateの引数にすることで日付が得られる
     */
    last_date: optionalFixer(numberFixer()),

    /** 最終プレイ者 */
    last_user: optionalFixer(fixPlayerUUID),

    /** 使用メモリ量 */
    memory: defaultFixer(fixMemorySettings, DEFAULT_MEMORY),

    /** Javaの実行時引数 */
    javaArguments: optionalFixer(stringFixer()),

    /** server.propertiesの内容 */
    properties: fixServerProperties,

    /** プレイヤーの設定 */
    players: arrayFixer(fixPlayerSetting, true),

    /** アイコンのURI */
    avater_path: optionalFixer(stringFixer()),
  },
  false
);

/** serverstarterのシステム設定内のワールド設定 */
export const fixSystemWorldSettings = objectFixer<SystemWorldSettings>(
  {
    /** Javaの実行時引数 */
    javaArguments: optionalFixer(stringFixer()),

    memory: defaultFixer(fixMemorySettings, DEFAULT_MEMORY),

    properties: defaultFixer(fixServerProperties, DEFAULT_SERVER_PROPERTIES),
  },
  true
);

/** サーバーCWD直下の設定系ファイルの情報 */
export const fixFoldSettings = objectFixer<FoldSettings>(
  {
    properties: fixServerProperties,
    players: arrayFixer(fixPlayerSetting, true),
  },
  false
);
