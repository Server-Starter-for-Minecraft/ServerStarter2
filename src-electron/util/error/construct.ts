import { ErrorLevel, ErrorMessage } from 'app/src-electron/schema/error';
import { ErrorMessageTypes } from './schema';

type ErrorMessageConstructor = {
  [K in keyof ErrorMessageTypes]: (arg: ErrorMessageTypes[K]) => ErrorMessage;
};

export const errorMessage: ErrorMessageConstructor = new Proxy(
  {} as ErrorMessageConstructor,
  {
    get: <K extends keyof ErrorMessageTypes>(_: object, key: K) => {
      return (
        args: ErrorMessageTypes[K],
        level: ErrorLevel = 'error'
      ): ErrorMessage =>
        ({
          type: 'error',
          level,
          key,
          args,
        } as ErrorMessage);
    },
  }
);
