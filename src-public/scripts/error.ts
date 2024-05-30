import { ErrorMessage } from 'app/src-electron/schema/error';

// バックエンドにも同じものがあるが、フロントエンド用にこちらでも定義

export const isValid = <S>(value: ErrorMessage | S): value is S =>
  !isError(value);

export const isError = <S>(value: ErrorMessage | S): value is ErrorMessage =>
  Boolean(value) && (value as ErrorMessage).type === 'error';
