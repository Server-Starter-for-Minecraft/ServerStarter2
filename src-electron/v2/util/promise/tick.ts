import { nextTick } from 'process';

export function tick() {
  return new Promise<void>((resolve) => {
    nextTick(resolve);
  });
}
