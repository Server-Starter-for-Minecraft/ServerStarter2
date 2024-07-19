import { ChildProcess } from 'child_process';
import * as fs from 'fs';
import { copy, ls, delete as rcloneDelete } from 'rclone.js';
import * as readline from 'readline';
import { getFileList } from './getFileList';

async function copyFile(sourcePath: string, destPath: string) {
  const copyProcess: ChildProcess = copy(sourcePath, destPath, {
    env: {
      RCLONE_CONFIG: 'src-electron/rclone-sample/rclone.conf',
    },
  });
  copyProcess.stdout?.on('data', (data) => {
    console.log(data.toString());
  });
  copyProcess.stderr?.on('data', (data) => {
    console.error(data.toString());
  });
}

/** In Source Testing */
if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;
  /** ローカルからリモートへのファイルの送信 */
  test('copyFileLocalToRemote', async () => {
    const copyProcess: ChildProcess = copy(
      'src-electron/rclone-sample/sync/hoge3',
      'gdrive:sync',
      {
        env: {
          RCLONE_CONFIG: 'src-electron/rclone-sample/rclone.conf',
        },
      }
    );
    copyProcess.stdout?.on('data', (data) => {
      console.log(data.toString());
    });
    copyProcess.stderr?.on('data', (data) => {
      console.error(data.toString());
    });
    await new Promise<void>((r) => copyProcess.on('close', r));

    const remotelsProcess = ls('gdrive:sync', {
      env: {
        RCLONE_CONFIG: 'src-electron/rclone-sample/rclone.conf',
      },
    });
    const remoteFileList = await getFileList(remotelsProcess);
    const regexPattern = /hoge3$/;
    const containsFile = remoteFileList.some((file) => regexPattern.test(file));
    expect(containsFile).toBe(true);
    /**送ったファイルを削除し、消えることを確認 */
    const deleteProcess: ChildProcess = rcloneDelete('gdrive:sync/hoge3', {
      env: {
        RCLONE_CONFIG: 'src-electron/rclone-sample/rclone.conf',
      },
    });
    await new Promise<void>((r) => deleteProcess.on('close', r));
    const deletedRemotelsProcess = ls('gdrive:sync');
    const deletedRemoteFileList = await getFileList(deletedRemotelsProcess);
    const containsDeletedFile = deletedRemoteFileList.some((file) =>
      regexPattern.test(file)
    );
    expect(containsDeletedFile).toBe(false);
  }),
    /**リモートからローカルへのデータの受信 */
    test('copyFileRemoteToLocal', async () => {
      const copyProcess: ChildProcess = copy(
        'gdrive:sync/hoge4',
        'src-electron/rclone-sample/sync',
        {
          env: {
            RCLONE_CONFIG: 'src-electron/rclone-sample/rclone.conf',
          },
        }
      );
      copyProcess.stdout?.on('data', (data) => {
        console.log(data.toString());
      });
      copyProcess.stderr?.on('data', (data) => {
        console.error(data.toString());
      });
      await new Promise<void>((r) => copyProcess.on('close', r));

      const locallsProcess = ls('src-electron/rclone-sample/sync');
      const localFileList = await getFileList(locallsProcess);
      const regexPattern = /hoge4$/;
      const containsFile = localFileList.some((file) =>
        regexPattern.test(file)
      );
      expect(containsFile).toBe(true);

      /**ダウンロードしたデータを削除し、消えることを確認 */

      const deleteProcess: ChildProcess = rcloneDelete(
        'src-electron/rclone-sample/sync/hoge4'
      );
      await new Promise<void>((r) => deleteProcess.on('close', r));
      const deletedLocallsProcess = ls('src-electron/rclone-sample/sync');
      const deletedLocalFileList = await getFileList(deletedLocallsProcess);
      const containsDeletedFile = deletedLocalFileList.some((file) =>
        regexPattern.test(file)
      );
      expect(containsDeletedFile).toBe(false);
    });
}
