import { ChildProcess } from 'child_process';
import { ls } from 'rclone.js';

/** In Source Testing */
if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;
  test('remotelsTest', async () => {
    const remotelsProcess = ls('gdrive:sync', {
      env: {
        RCLONE_CONFIG: 'src-electron/rclone-sample/rclone.conf',
      },
    });
    remotelsProcess.stdout?.on('data', (data) => {
      console.log(data.toString());
    });

    remotelsProcess.stderr?.on('data', (data) => {
      console.error(data.toString());
    });
    await new Promise<void>(r => remotelsProcess.on('close',r))
  });

  test('locallsTest', async () => {
    const locallsProcess = ls('src-electron/rclone-sample/sync');
    console.log(locallsProcess.stdout)
    locallsProcess.stdout?.on('data', (data) => {
      console.log(data.toString());
    });

    locallsProcess.stderr?.on('data', (data) => {
      console.error(data.toString());
    });
    await new Promise<void>(r => locallsProcess.on('close',r))
  });
}
