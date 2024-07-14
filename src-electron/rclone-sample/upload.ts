import { ChildProcess } from 'child_process';
import { ls, sync } from 'rclone.js';

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

async function getFileList(lsProcess: ChildProcess) {
  const fileList: string[] = [];
  return new Promise<string[]>((resolve, reject) => {
    lsProcess.stdout?.on('data', (data) => {
      console.log(data.toString());
      const lines = data.toString().split('\n');
      fileList.push(...lines.filter((line) => line.trim() !== ''));
    });

    lsProcess.stderr?.on('data', (data) => {
      console.error('Error reading file list:', data.toString());
      reject(new Error(data.toString()));
    });

    lsProcess.on('close', (code) => {
      if (code === 0) {
        resolve(fileList.sort());
      } else {
        reject(new Error(`ls process exited with code ${code}`));
      }
    });
  });
}

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
