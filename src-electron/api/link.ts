import { ArgumentsType } from 'vitest';
import { IAPI } from './api';

export class SendEvent<T extends (...args: any[]) => void> {
  listener?: T;

  set(listener: T) {
    this.listener = listener;
  }

  call(...args: ArgumentsType<T>) {
    if (this.listener) {
      return this.listener(...args);
    } else {
      throw new Error();
    }
  }
}

export class InvokeEvent<T extends (...args: any[]) => any> {
  listener?: T;

  set(listener: T): void {
    this.listener = listener;
  }

  call(...args: ArgumentsType<T>): ReturnType<T> {
    if (this.listener) {
      return this.listener(...args);
    } else {
      throw new Error();
    }
  }
}

type FrontAPI<A extends IAPI> = {
  handle: A['invokeMainToWindow'];
  invoke: {
    [K in keyof A['invokeWindowToMain']]: InvokeEvent<
      A['invokeMainToWindow'][K]
    >;
  };
  on: A['sendMainToWindow'];
  send: {
    [K in keyof A['sendWindowToMain']]: SendEvent<A['sendWindowToMain'][K]>;
  };
};

type BackAPI<A extends IAPI> = {
  handle: A['invokeWindowToMain'];
  invoke: {
    [K in keyof A['invokeMainToWindow']]: InvokeEvent<
      A['invokeWindowToMain'][K]
    >;
  };
  on: A['sendWindowToMain'];
  send: {
    [K in keyof A['sendMainToWindow']]: SendEvent<A['sendMainToWindow'][K]>;
  };
};

/** フロントエンドとバックエンドの処理をリンクする */
export function link<A extends IAPI>(front: FrontAPI<A>, back: BackAPI<A>) {
  Object.keys(front.invoke).forEach((k: keyof IAPI['invokeWindowToMain']) => {
    // TODO: めっちゃ怪しいキャスト
    front.invoke[k].set(back.handle[k] as any);
  });

  Object.keys(front.handle).forEach((k: keyof IAPI['invokeMainToWindow']) => {
    // TODO: めっちゃ怪しいキャスト
    back.invoke[k].set(front.handle[k] as any);
  });

  Object.keys(front.send).forEach((k: keyof IAPI['sendWindowToMain']) => {
    // TODO: めっちゃ怪しいキャスト
    front.send[k].set(back.on[k] as any);
  });

  Object.keys(front.on).forEach((k: keyof IAPI['sendMainToWindow']) => {
    // TODO: めっちゃ怪しいキャスト
    back.send[k].set(front.on[k] as any);
  });
}
