import {
  ImageURI,
  PlayerUUID,
  Timestamp,
  UUID,
  WorldContainer,
  WorldName,
} from 'app/src-electron/schema/brands';
import {
  FAIL,
  Fixer,
  numberFixer,
  regexFixer,
  stringFixer,
} from 'app/src-electron/util/detaFixer/fixer';

export const fixUUID = regexFixer<UUID>(
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/
);

/** ワールドコンテナの名前文字列 */
export const fixWorldContainer = stringFixer<WorldContainer>();

/** ワールドの名前文字列 */
export const fixWorldName = stringFixer<WorldName>();

/** プレイヤーのUUID文字列 */
export const fixPlayerUUID = fixUUID as Fixer<PlayerUUID | FAIL>;

/** 画像のuri文字列 <img src={ここに挿入可能}> */
export const fixImageURI = stringFixer<ImageURI>();

/** 1970年1月1日00:00:00 UTCからの経過時間(ミリ秒) */
export const fixTimestamp = numberFixer<Timestamp>();
