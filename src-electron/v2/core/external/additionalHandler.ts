import { Result } from '../../util/base';
import { ReadableStreamer } from '../../util/binary/stream';

export type AdditionalMeta = {
  // 一意のバイナリを指し示すデータと任意のメタデータを持つ
  // 基本ハッシュ値は持つかと思う
};

/**
 * datapack / mod / plugin を管理するクラス
 *
 * 今回から datapack / mod / plugin はワールド単位ではなく、まとめて管理する。
 *
 * mod等のバイナリと一緒にメタデータを管理する
 */
export abstract class AdditionalHandler<T extends AdditionalMeta> {
  // フォルダ内のすべてのデータのmetaを返す
  // metaが破損している場合は修復
  // 修復日は1970.1.1として表現する
  abstract listMeta(): Promise<T[]>;

  // メタデータが指し示すバイナリを取得
  abstract getBin(meta: T): Result<ReadableStreamer, Error>;

  // メタデータを更新
  abstract updateMeta(meta: T): Promise<Result<void, Error>>;

  // メタデータをマージ
  // 可能な限りprimaryMetaを優先し、足りない情報をsecondaryMetaで補う
  // 別のバイナリを指すメタデータはマージできない
  abstract mergeMeta(
    primaryMeta: T,
    secondaryMeta: Partial<T>
  ): Result<void, Error>;

  // 新しくバイナリをインストール
  // メタデータの一部を指定してインストール後に完全なメタデータを返す
  abstract install(
    bin: ReadableStreamer,
    meta: Partial<T>
  ): Promise<Result<T, Error>>;

  // バイナリをアンインストール
  abstract uninstall(meta: Partial<T>): Promise<Result<void, Error>>;
}
