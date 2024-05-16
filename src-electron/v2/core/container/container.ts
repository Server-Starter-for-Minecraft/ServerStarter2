import { BinHandler } from '../../util/binHandler';

export type BackUpMeta = {
  hash: string;
};

/**
 * 旧 WorldContainer
 *
 * 今回はリモートに対応すべくabstractにしてある
 */
export abstract class Container {
  // バックアップを管理するハンドラ
  abstract backup: BinHandler<BackUpMeta>;

  extract<>
}
