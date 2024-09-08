import { ChildProcess } from 'child_process';
import { copy, ls, purge, delete as rcloneDelete, touch } from 'rclone.js';
import { Path } from 'src-electron/v2/util/binary/path';
import { getFileList } from './getFileList';

/** In Source Testing */
if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;
  /**ローカルとリモートで単一ファイルの送受信を行う機能のテスト */
  test('copyFileLocalToRemote', async () => {
    /** ローカルからリモートへのファイルの送信 */
    /**必要ファイルの生成 */
    const syncDirectory = new Path('src-electron/rclone-sample/sync');
    const copyFile = syncDirectory.child('hoge3');
    await copyFile.writeText('testtest');
    const copyProcess: ChildProcess = copy(
      'src-electron/rclone-sample/sync/hoge3',
      'onedrive:sync',
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

    const remotelsProcess = ls('onedrive:sync', {
      env: {
        RCLONE_CONFIG: 'src-electron/rclone-sample/rclone.conf',
      },
    });
    const remoteFileList = await getFileList(remotelsProcess);
    const regexPattern = /hoge3$/;
    const containsFile = remoteFileList.some((file) => regexPattern.test(file));
    expect(containsFile).toBe(true);
    /**送ったファイルを削除し、消えることを確認 */
    const deleteProcess: ChildProcess = rcloneDelete('onedrive:sync/hoge3', {
      env: {
        RCLONE_CONFIG: 'src-electron/rclone-sample/rclone.conf',
      },
    });
    await new Promise<void>((r) => deleteProcess.on('close', r));
    const deletedRemotelsProcess = ls('onedrive:sync');
    const deletedRemoteFileList = await getFileList(deletedRemotelsProcess);
    const containsDeletedFile = deletedRemoteFileList.some((file) =>
      regexPattern.test(file)
    );
    expect(containsDeletedFile).toBe(false);

    //使ったファイルを削除
    await syncDirectory.remove();
  }, 50000),
    /**リモートからローカルへのデータの受信 */
    test('copyFileRemoteToLocal', async () => {
      const touchProcess: ChildProcess = touch('onedrive:sync/hoge4');
      await new Promise<void>((r) => touchProcess.on('close', r));
      const copyProcess: ChildProcess = copy(
        'onedrive:sync/hoge4',
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
      //使ったファイルの削除
      const syncDirectory = new Path('src-electron/rclone-sample/sync');
      await syncDirectory.remove();
      const deleteRemoteDirectoryProcess = purge('onedrive:sync', {
        env: {
          RCLONE_CONFIG: 'src-electron/rclone-sample/rclone.conf',
        },
      });
      await new Promise<void>((r) =>
        deleteRemoteDirectoryProcess.on('close', r)
      );
    }, 50000);
}
