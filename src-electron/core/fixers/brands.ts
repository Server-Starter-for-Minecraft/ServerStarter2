import {
  ImageURI,
  PlayerUUID,
  UUID,
  WorldContainer,
  WorldName,
} from 'app/src-electron/schema/brands';
import {
  Fixer,
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
export const fixPlayerUUID = stringFixer<PlayerUUID>();

/** 画像のuri文字列 <img src={ここに挿入可能}> */
export const fixImageURI = stringFixer<ImageURI>();
