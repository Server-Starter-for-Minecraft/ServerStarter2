import { IAPI } from 'src-electron/api/types';
import { Failable } from '../api/failable';

export type BackCaller<A extends IAPI> = {
  send: {
    [key in keyof A['sendMainToWindow']]: A['sendMainToWindow'][key];
  };
  invoke: {
    [key in keyof A['invokeMainToWindow']]: A['invokeMainToWindow'][key] extends (
      ...args: infer P
    ) => Promise<infer R>
      ? (...args: P) => Promise<Failable<R>>
      : never;
  };
};

export type BackListener<A extends IAPI> = {
  on: {
    [key in keyof A['sendWindowToMain']]: A['sendWindowToMain'][key];
  };
  handle: {
    [key in keyof A['invokeWindowToMain']]: A['invokeWindowToMain'][key];
  };
};

export type FrontCaller<A extends IAPI> = {
  send: {
    [key in keyof A['sendWindowToMain']]: A['sendWindowToMain'][key];
  };
  invoke: {
    [key in keyof A['invokeWindowToMain']]: A['invokeWindowToMain'][key];
  };
};

export type FrontListener<A extends IAPI> = {
  on: {
    [key in keyof A['sendMainToWindow']]: A['sendMainToWindow'][key];
  };
  handle: {
    [key in keyof A['invokeMainToWindow']]: A['invokeMainToWindow'][key] extends (
      ...args: infer P
    ) => Promise<infer R>
      ? (...args: P) => Promise<Failable<R>>
      : never;
  };
};

export function linkIPC<A extends IAPI>(
  backapi: BackListener<A>,
  frontapi: FrontListener<A>
): { front: FrontCaller<A>; back: BackCaller<A> } {
  return {
    front: { send: backapi.on, invoke: backapi.handle },
    back: { send: frontapi.on, invoke: frontapi.handle },
  };
}
