import { ErrorMessage } from '../schema/error';

// フロントとの互換性のために保持
export const isSuccess = <S>(value: ErrorMessage | S): value is S =>
  !isFailure(value);

export const isFailure = <S>(value: ErrorMessage | S): value is ErrorMessage =>
  Boolean(value) && (value as ErrorMessage).type === 'error';
