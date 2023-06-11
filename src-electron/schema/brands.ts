import { Brand } from '../util/brand';

export type UUID = Brand<string, 'UUID'>;

/** ワールドコンテナの名前文字列 */
export type WorldContainer = Brand<string, 'WorldContainer'>;

/** ワールドの名前文字列 */
export type WorldName = Brand<string, 'WorldName'>;

/** プレイヤーのUUID文字列 */
export type PlayerUUID = Brand<UUID, 'PlayerUUID'>;

/** 画像のuri文字列 <img src={ここに挿入可能}> */
export type ImageURI = Brand<string, 'ImageURI'>;
