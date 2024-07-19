import { ChildProcess } from 'child_process';
import { ls, sync } from 'rclone.js';
import { getFileList } from './getFileList';
//const rclone = require('rclone.js');
/** @see https://rclone.js.org/ */

/** sync local and remote directory*/
const syncProcess: ChildProcess = sync(
  'src-electron/rclone-sample/sync',
  'gdrive:sync',
  {
    // Spawn options:
    env: {
      RCLONE_CONFIG: 'src-electron/rclone-sample/rclone.conf',
    },
  }
);

syncProcess.stdout?.on('data', (data) => {
  console.log(data.toString());
});

syncProcess.stderr?.on('data', (data) => {
  console.error(data.toString());
});

const lsProcess = ls('src-electron/rclone-sample/sync');

/** In Source Testing */
if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;
  test('syncTest', async () => {
    const beforeRemotelsProcess = ls('gdrive:sync', {
      env: {
        RCLONE_CONFIG: 'src-electron/rclone-sample/rclone.conf',
      },
    });

    const beforeRemoteFileList = await getFileList(beforeRemotelsProcess);

    const syncProcess: ChildProcess = sync(
      'src-electron/rclone-sample/sync',
      'gdrive:sync',
      {
        // Spawn options:
        env: {
          RCLONE_CONFIG: 'src-electron/rclone-sample/rclone.conf',
        },
      }
    );

    syncProcess.stdout?.on('data', (data) => {
      console.log(data.toString());
    });

    syncProcess.stderr?.on('data', (data) => {
      console.error(data.toString());
    });

    await new Promise<void>((r) => syncProcess.on('close', r));
    //同期したリモートとローカルのファイル一覧を取得
    const remotelsProcess = ls('gdrive:sync', {
      env: {
        RCLONE_CONFIG: 'src-electron/rclone-sample/rclone.conf',
      },
    });

    const remoteFileList = await getFileList(remotelsProcess);

    const locallsProcess = ls('src-electron/rclone-sample/sync');
    const localFileList = await getFileList(locallsProcess);

    expect(remoteFileList).toEqual(localFileList);
  });
}
