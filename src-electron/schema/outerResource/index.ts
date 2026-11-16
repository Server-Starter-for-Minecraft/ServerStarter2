import { DonationResource } from './donation';

/**
 * フロントエンドへ渡す外部リソースの一覧
 *
 * 外部リソースを追加する場合は，ここに解決後の型を追加し，
 * `src-electron/source/outerResource/registry.ts` に定義を登録する
 */
export type OuterResources = {
  /** 寄付サービスの一覧 */
  donation: DonationResource;
};
