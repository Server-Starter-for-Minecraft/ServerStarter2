/**
 * 複数のエラーと正常値を同時に保持する型
 */
export type WithError<T> = { value: T; errors: Error[] };

export function withError<T>(value: T, errors?: Error[]): WithError<T> {
  return { value, errors: errors ?? [] };
}
