import { API } from 'app/src-electron/api/api';

export type Back<A extends API> = {
  send: {
    [key in keyof A['sendMainToWindow']]: A['sendMainToWindow'][key];
  };
  invoke: {
    [key in keyof A['invokeMainToWindow']]: A['invokeMainToWindow'][key];
  };
};

export type BackListener<A extends API> = {
  on: {
    [key in keyof A['sendWindowToMain']]: A['sendWindowToMain'][key];
  };
  handle: {
    [key in keyof A['invokeWindowToMain']]: A['invokeWindowToMain'][key];
  };
};

export type Front<A extends API> = {
  send: {
    [key in keyof A['sendWindowToMain']]: A['sendWindowToMain'][key];
  };
  invoke: {
    [key in keyof A['invokeWindowToMain']]: A['invokeWindowToMain'][key];
  };
};

export type FrontListener<A extends API> = {
  on: {
    [key in keyof A['sendMainToWindow']]: A['sendMainToWindow'][key];
  };
  handle: {
    [key in keyof A['invokeMainToWindow']]: A['invokeMainToWindow'][key];
  };
};

export function linkIPC<A extends API>(
  backapi: BackListener<A>,
  frontapi: FrontListener<A>
): { front: Front<A>; back: Back<A> } {
  return {
    front: { send: backapi.on, invoke: backapi.handle },
    back: { send: frontapi.on, invoke: frontapi.handle },
  };
}
