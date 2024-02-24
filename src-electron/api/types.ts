export interface IAPI {
  sendMainToWindow: {
    [key in string]: (...args: any[]) => void;
  };
  invokeMainToWindow: {
    [key in string]: (...args: any[]) => Promise<any>;
  };
  sendWindowToMain: {
    [key in string]: (...args: any[]) => void;
  };
  invokeWindowToMain: {
    [key in string]: (...args: any[]) => Promise<any>;
  };
}

type Func<A extends any[], R> = (..._: A) => R;
type Merge<T extends object> = { [K in keyof T]: T[K] };

export type FrontSend<C extends string, F extends Func<any, void>> = F & {
  __channel__: C;
};

export type FrontInvoke<
  C extends string,
  F extends Func<any, Promise<any>>
> = F & {
  __channel__: C;
};

export type FrontOn<C extends string, F extends Func<any, void>> = ((
  listener: (event: Electron.IpcRendererEvent, ...args: Parameters<F>) => void
) => void) & {
  __channel__: C;
};

export type FrontHandle<C extends string, F extends Func<any, void>> = ((
  listener: (
    event: Electron.IpcRendererEvent,
    ...args: Parameters<F>
  ) => ReturnType<F>
) => void) & {
  __channel__: C;
};

export type IFrontAPI<T extends IAPI> = Merge<
  {
    [K in keyof T['sendMainToWindow'] as `on${K & string}`]: FrontOn<
      K & string,
      T['sendMainToWindow'][K]
    >;
  } & {
    [K in keyof T['sendWindowToMain'] as `send${K & string}`]: FrontSend<
      K & string,
      T['sendWindowToMain'][K]
    >;
  } & {
    [K in keyof T['invokeMainToWindow'] as `handle${K & string}`]: FrontHandle<
      K & string,
      T['invokeMainToWindow'][K]
    >;
  } & {
    [K in keyof T['invokeWindowToMain'] as `invoke${K & string}`]: FrontInvoke<
      K & string,
      T['invokeWindowToMain'][K]
    >;
  }
>;

export type BackSend<C extends string, F extends Func<any, void>> = F & {
  __channel__: C;
};

export type BackInvoke<
  C extends string,
  F extends Func<any, Promise<any>>
> = F & {
  __channel__: C;
};

export type BackOn<C extends string, F extends Func<any, void>> = ((
  listener: (event: Electron.IpcMainEvent, ...args: Parameters<F>) => void
) => void) & {
  __channel__: C;
};

export type BackHandle<C extends string, F extends Func<any, void>> = ((
  listener: (
    event: Electron.IpcMainInvokeEvent,
    ...args: Parameters<F>
  ) => ReturnType<F>
) => void) & {
  __channel__: C;
};

export type IBackAPI<T extends IAPI> = Merge<
  {
    [K in keyof T['sendWindowToMain'] as `on${K & string}`]: BackOn<
      K & string,
      T['sendWindowToMain'][K]
    >;
  } & {
    [K in keyof T['sendMainToWindow'] as `send${K & string}`]: BackSend<
      K & string,
      T['sendMainToWindow'][K]
    >;
  } & {
    [K in keyof T['invokeWindowToMain'] as `handle${K & string}`]: BackHandle<
      K & string,
      T['invokeWindowToMain'][K]
    >;
  } & {
    [K in keyof T['invokeMainToWindow'] as `invoke${K & string}`]: BackInvoke<
      K & string,
      T['invokeMainToWindow'][K]
    >;
  }
>;
