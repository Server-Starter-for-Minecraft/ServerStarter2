import { objEach } from '../obj/objmap';

export function decoratePromise<T, D extends object>(
  promise: Promise<T>,
  decoretor: D
): Promise<T> & D {
  const result = promise as Promise<T> & D;
  objEach(decoretor, (k, v) => (promise[k] = v));
  return result;
}
