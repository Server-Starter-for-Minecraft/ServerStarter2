// 独自ルールのテスト（no-internal-mock）で，プロジェクト内のモジュールとして参照するファイル
export function fn() {
  return 1;
}

export const store = { save: () => 1 };

export class InternalClass {
  run() {
    return 1;
  }
}
