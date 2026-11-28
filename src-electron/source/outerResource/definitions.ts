import { keys } from 'app/src-public/scripts/obj/obj';
import { OuterResources } from 'app/src-electron/schema/outerResource';
import type { OuterResourceDefinition } from './definition';
import { donationDefinition } from './resources/donation';
import { serverPropertiesDefinition } from './resources/serverProperties';

/**
 * アプリで使う外部リソースの定義の一覧
 *
 * 外部リソースを追加する場合は，`OuterResources` 型に解決後の型を追加したうえで，ここに定義を登録する。
 * 読み込み（`registry.ts`）・JSON Schema の生成（`distribution.ts`）・配布元の契約テストはこの一覧から作る
 */
export const outerResourceDefinitions: {
  // 配布ファイルの型は外部リソースごとに異なり，定義の中で閉じているため，一覧では区別しない
  [K in keyof OuterResources]: OuterResourceDefinition<
    unknown,
    OuterResources[K]
  >;
} = {
  donation: donationDefinition,
  serverProperties: serverPropertiesDefinition,
};

/** 外部リソースの名前の一覧 */
export const outerResourceKeys = keys(outerResourceDefinitions);
