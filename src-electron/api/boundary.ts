/**
 * IPC で受け取った値（または IPC へ処理を転送する関数）を，API の型定義（`api.ts`）の型として扱う
 *
 * IPC の通信では値の型情報が失われるため，受け取った値は型が付いていない。
 * 送り手は同じアプリのバックエンド・フロントエンドで，API の型定義に従って送るため，
 * 受け取った値を検証せずに API の型として扱う（型アサーションは IPC の境界であるこの関数の中だけで行う）
 *
 * @param value IPC で受け取った値，または IPC へ処理を転送する関数
 * @returns API の型定義の型として扱う値
 */
export function fromIPC<T>(value: unknown): T {
  return value as T;
}
