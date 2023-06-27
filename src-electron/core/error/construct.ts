import { ErrorMessage } from 'app/src-electron/schema/error';
import { ErrorMessageTypes } from './schema';

type ErrorMessageConstructor = {
  [K in keyof ErrorMessageTypes]: (arg: ErrorMessageTypes[K]) => ErrorMessage;
};

export const errorMessage: ErrorMessageConstructor = new Proxy(
  {} as ErrorMessageConstructor,
  {
    get: <K extends keyof ErrorMessageTypes>(_: object, key: K) => {
      return (args: ErrorMessageTypes[K]): ErrorMessage => ({
        type: 'error',
        key,
        args,
      });
    },
  }
);

export function isErrorMessage(value: any): value is ErrorMessage {
  return value.type === 'error';
}

export function isValidValue<T>(value: T | ErrorMessage): value is T {
  return !isErrorMessage(value);
}
