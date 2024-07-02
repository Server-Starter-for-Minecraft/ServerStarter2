import { ServerVersionFileProcess } from '../fileProcess/base';

export function getVanillaFp(): ServerVersionFileProcess {
  return {
    setVersionFile: (path, readyRuntime) => {},
    removeVersionFile: (path) => {},
  };
}
