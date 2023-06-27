import {
  FoldSettings,
  SystemWorldSettings,
  World,
  WorldAbbr,
  WorldAdditional,
  WorldBase,
  WorldEdited,
  WorldEditedAdditional,
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
import { fixFileData, fixFileOrNewData, fixNewData } from './filedata';

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

    /** アイコンのURI */
    avater_path: optionalFixer(stringFixer()),
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
  },
  false
);

export const fixWorldAdditional = objectFixer<WorldAdditional>(
  {
    /** 導入済みデータパック */
    datapacks: arrayFixer(fixFileData, true),

    /** 導入済みプラグイン */
    plugins: arrayFixer(fixFileData, true),

    /** 導入済みMOD */
    mods: arrayFixer(fixFileData, true),
  },
  true
);

export const fixWorld = extendFixer<World, WorldBase>(
  fixWorldBase,
  {
    /** 導入済み */
    additional: fixWorldAdditional,
  },
  false
);

fixFileData;
export const fixWorldEditedAdditional = objectFixer<WorldEditedAdditional>(
  {
    /** 導入済みデータパック */
    datapacks: arrayFixer(fixFileOrNewData, true),

    /** 導入済みプラグイン */
    plugins: arrayFixer(fixFileOrNewData, true),

    /** 導入済みMOD */
    mods: arrayFixer(fixFileOrNewData, true),
  },
  true
);

export const fixWorldEdited = extendFixer<WorldEdited, WorldBase>(
  fixWorldBase,
  {
    /** カスタムマップを導入する場合 */
    custom_map: optionalFixer(fixNewData),

    /** データの取得元のリモート(同期はしない)
     * リモート版カスタムマップ的な感じ
     * 新規ワールドで既存リモートを読み込むときくらいにしか使わないと思う
     * {
     *   remote_source:A
     *   remote:B
     * }
     * とした場合 Aからワールドのデータを取得して Bと同期する
     */
    remote_source: optionalFixer(fixRemote),

    /** 導入済み */
    additional: fixWorldEditedAdditional,
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
