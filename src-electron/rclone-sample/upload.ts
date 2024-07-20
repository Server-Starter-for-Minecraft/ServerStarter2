import { ChildProcess } from 'child_process';
import { copy, ls, delete as rcloneDelete, sync } from 'rclone.js';
import { getFileList } from './getFileList';

//const rclone = require('rclone.js');
/** @see https://rclone.js.org/ */

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
  }, 50000);
  test('conflictTest', async () => {
    /**コンフリクトを起こすファイルを判別する正規表現 */
    const regexPattern = /hoge3$/;
    /**リモートとローカルを同期 */
    const syncProcess: ChildProcess = sync(
      'src-electron/rclone-sample/sync',
      'gdrive:sync_conflict',
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
    /**同期後のリモートのファイル一覧を取得 */
    const beforeRemotelsProcess = ls('gdrive:sync_conflict', {
      env: {
        RCLONE_CONFIG: 'src-electron/rclone-sample/rclone.conf',
      },
    });

    const beforeRemoteFileList = await getFileList(beforeRemotelsProcess);
    /**コンフリクトを引き起こす */
    /**コンフリクトを引き起こすためのファイルを削除 */
    const deleteProcess = rcloneDelete('gdrive:sync_conflict/hoge3', {
      env: {
        RCLONE_CONFIG: 'src-electron/rclone-sample/rclone.conf',
      },
    });
    await new Promise<void>((r) => deleteProcess.on('close', r));
    /**消えていることを確認 */
    const deletedRemotelsProcess = ls('gdrive:sync_conflict', {
      env: {
        RCLONE_CONFIG: 'src-electron/rclone-sample/rclone.conf',
      },
    });
    const deletedRemoteFileList = await getFileList(deletedRemotelsProcess);
    const containsDeletedFile = deletedRemoteFileList.some((file) =>
      regexPattern.test(file)
    );
    expect(containsDeletedFile).toBe(false);

    /**コンフリクト用のファイルをアップロード */
    const copyProcess: ChildProcess = copy(
      'src-electron/rclone-sample/conflict/hoge3',
      'gdrive:sync_conflict',
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
    /**同期したファイルリストを取得 */
    const uploadedRemotelsProcess = ls('gdrive:sync_conflict', {
      env: {
        RCLONE_CONFIG: 'src-electron/rclone-sample/rclone.conf',
      },
    });
    const remoteFileList = await getFileList(uploadedRemotelsProcess);
    const containsFile = remoteFileList.some((file) => regexPattern.test(file));
    expect(containsFile).toBe(true);

    /**コンフリクトが起こっていローカルとリモートを再度同期 */
    const conflictSyncProcess: ChildProcess = sync(
      'src-electron/rclone-sample/sync',
      'gdrive:sync_conflict',
      {
        // Spawn options:
        env: {
          RCLONE_CONFIG: 'src-electron/rclone-sample/rclone.conf',
        },
      }
    );

    conflictSyncProcess.stdout?.on('data', (data) => {
      console.log(data.toString());
    });

    conflictSyncProcess.stderr?.on('data', (data) => {
      console.error(data.toString());
    });

    await new Promise<void>((r) => conflictSyncProcess.on('close', r));
    const conflictlsProcess = ls('src-electron/rclone-sample/sync');

    const conflictRemoteFileList = await getFileList(conflictlsProcess);
    const conflictContainsFile = conflictRemoteFileList.some((file) =>
      regexPattern.test(file)
    );
    expect(conflictContainsFile).toBe(true);

    /**最初の動機とコンフリクト後の同期でリモートの内容が変わっていないことを確認 */
    expect(conflictRemoteFileList).toEqual(beforeRemoteFileList);
  }, 50000);
}
