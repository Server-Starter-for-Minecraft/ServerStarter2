import {
  arrayFixer,
  booleanFixer,
  literalFixer,
  objectFixer,
  optionalFixer,
  stringFixer,
} from 'app/src-electron/util/detaFixer/fixer';
import { fixImageURI, fixPlayerUUID } from './brands';
import {
  OpSetting,
  Player,
  PlayerGroup,
  PlayerSetting,
} from 'app/src-electron/schema/player';

/** システムのプレイヤー設定 */
export const fixPlayer = objectFixer<Player>(
  {
    /** プレイヤー名 */
    name: stringFixer(),

    /** プレイヤーのUUID */
    uuid: fixPlayerUUID,

    /** プレイヤースキンの顔部分の画像 */
    avatar: fixImageURI,

    /** プレイヤースキンの顔部分の外側レイヤーの画像 */
    avatar_overlay: fixImageURI,
  },
  false
);

/** システムのプレイヤーグループ設定 */
export const fixPlayerGroup = objectFixer<PlayerGroup>(
  {
    /** グループ名 */
    name: stringFixer(),
    /** 所属するプレイヤーのUUIDのリスト */
    players: arrayFixer(fixPlayerUUID, true),
  },
  false
);

/** ワールドごとのプレイヤーOPの権限レベル */
export const fixOpLevel = literalFixer([1, 2, 3, 4]);

export const fixOpSetting = objectFixer<OpSetting>(
  {
    level: fixOpLevel,
    bypassesPlayerLimit: booleanFixer(false),
  },
  false
);

/** ワールドごとのプレイヤー設定 */
export const fixPlayerSetting = objectFixer<PlayerSetting>(
  {
    /** プレイヤーのUUID */
    uuid: fixPlayerUUID,
    /** プレイヤー名 */
    name: stringFixer(),
    /** プレイヤーのop権限レベル */
    op: optionalFixer(fixOpSetting),
  },
  false
);
