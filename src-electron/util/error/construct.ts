import { ErrorLevel, ErrorMessage } from 'app/src-electron/schema/error';
import { ErrorMessageTypes } from './schema';
import { ErrorMessageContent } from './schema/base';

type ErrorMessageConstructor<T extends object> = {
  [K in keyof T]: T[K] extends ErrorMessageContent<infer A>
    ? A extends undefined
      ? (level?: ErrorLevel) => ErrorMessage
      : (arg: A, level?: ErrorLevel) => ErrorMessage
    : ErrorMessageConstructor<T[K]>;
};

function getErrorMessageConstructor<T extends object>(
  key: string
): ErrorMessageConstructor<T> {
  function apply(
    arg?: object | any[] | ErrorLevel,
    level: ErrorLevel = 'error'
  ) {
    if (typeof arg === 'string') {
      return {
        type: arg,
        key,
        level,
      };
    }
    return {
      type: 'error',
      key,
      level,
      arg: arg,
    };
  }

  const obj = apply as unknown as ErrorMessageConstructor<T>;

  const handler: ProxyHandler<any> = {
    get: (_: object, k: string) => {
      return getErrorMessageConstructor(key ? `${key}.${k}` : k);
    },
  };
  return new Proxy(obj, handler);
}

export const errorMessage = getErrorMessageConstructor<ErrorMessageTypes>('');
