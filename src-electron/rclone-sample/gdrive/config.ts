import { ChildProcess } from 'child_process';
import { config } from 'rclone.js';

/** In Source Testing */
if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;
  test('makeGoogleConfig', async () => {
    const makeConfigProcess = config('create', 'gdriveMake', 'drive', {
      env: {
        RCLONE_CONFIG: 'src-electron/rclone-sample/rclone.conf',
      },
    });
    //await new Promise<void>((r) => makeConfigProcess.on('close', r));
  }, 50000);
}
