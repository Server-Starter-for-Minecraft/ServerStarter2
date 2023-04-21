import { IAPI } from 'app/src-electron/api/types';

export type BackCaller<A extends IAPI> = {
  send: {
    [key in keyof A['sendMainToWindow']]: A['sendMainToWindow'][key];
  };
  invoke: {
    [key in keyof A['invokeMainToWindow']]: A['invokeMainToWindow'][key];
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
    [key in keyof A['invokeMainToWindow']]: A['invokeMainToWindow'][key];
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
