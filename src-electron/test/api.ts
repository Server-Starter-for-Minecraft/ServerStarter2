export interface API {
  sendBackToFront: {
    [key in string]: (...args: any[]) => void;
  };
  invokeBackToFront: {
    [key in string]: (...args: any[]) => Promise<any>;
  };
  sendFrontToBack: {
    [key in string]: (...args: any[]) => void;
  };
  invokeFrontToBack: {
    [key in string]: (...args: any[]) => Promise<any>;
  };
}

type Back<A extends API> = {
  send: {
    [key in keyof A['sendBackToFront']]: A['sendBackToFront'][key];
  };
  invoke: {
    [key in keyof A['invokeBackToFront']]: A['invokeBackToFront'][key];
  };
};

type BackListener<A extends API> = {
  on: {
    [key in keyof A['sendFrontToBack']]: A['sendFrontToBack'][key];
  };
  handle: {
    [key in keyof A['invokeFrontToBack']]: A['invokeFrontToBack'][key];
  };
};

type Front<A extends API> = {
  send: {
    [key in keyof A['sendFrontToBack']]: A['sendFrontToBack'][key];
  };
  invoke: {
    [key in keyof A['invokeFrontToBack']]: A['invokeFrontToBack'][key];
  };
};

type FrontListener<A extends API> = {
  on: {
    [key in keyof A['sendBackToFront']]: A['sendBackToFront'][key];
  };
  handle: {
    [key in keyof A['invokeBackToFront']]: A['invokeBackToFront'][key];
  };
};

function link<A extends API>(
  backapi: BackListener<A>,
  frontapi: FrontListener<A>
): { front: Front<A>; back: Back<A> } {
  return {
    front: { send: backapi.on, invoke: backapi.handle },
    back: { send: frontapi.on, invoke: frontapi.handle },
  };
}
