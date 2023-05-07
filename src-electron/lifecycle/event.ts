import { UUID } from '../schema/brands';
import { genUUID } from '../tools/uuid';
import { toEntries } from '../util/obj';

export type AppEventListener = (dispatch: () => void) => void | Promise<void>;

export type AppEvent = {
  (listener: AppEventListener, once: boolean): () => void;
  invoke: () => Promise<void>;
};

export const createAppEvent = (): AppEvent => {
  const listeners: Record<UUID, AppEventListener> = {};

  const dispatcher = (id: UUID) => () => {
    if (listeners[id] !== undefined) {
      delete listeners[id];
    }
  };

  const result = (listener: AppEventListener, once: boolean) => {
    const id = genUUID();
    const dispatch = dispatcher(id);
    listeners[id] = once
      ? async () => {
          await listener(dispatch);
          dispatch();
        }
      : listener;
    return dispatch;
  };

  const invoke = async () => {
    await Promise.all(
      toEntries(listeners).map(([id, listener]) => listener(dispatcher(id)))
    );
  };

  result.invoke = invoke;

  return result;
};
