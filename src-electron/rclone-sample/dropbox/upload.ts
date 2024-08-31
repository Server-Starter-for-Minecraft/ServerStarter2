import { ChildProcess } from 'child_process';
import { copy, ls, purge, delete as rcloneDelete, sync } from 'rclone.js';
import { Path } from 'src-electron/util/path';
import { getFileList } from './getFileList';

//const rclone = require('rclone.js');
/** @see https://rclone.js.org/ */

/** In Source Testing */
if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;
  /**ローカルからリモートへの同期を行うテスト
   * ローカルにファイルを生成し、リモートと同期することでリモートとローカルのディレクトリ構成が一致していることを確認する
   */
  test('syncTest', async () => {
    const syncDirectory = new Path('src-electron/rclone-sample/sync');
    const filesToTest = [
      { name: 'test1.txt', content: 'Content for file 1' },
      { name: 'test2.txt', content: 'Content for file 2' },
      { name: 'test3.txt', content: 'Content for file 3' },
    ];
    await Promise.all(
      filesToTest.map((file) =>
        syncDirectory.child(file.name).writeText(file.content)
      )
    );
    // ファイルが生成されているか確認
    for (const file of filesToTest) {
      const filePath = syncDirectory.child(file.name);
      expect(filePath.exists()).toBe(true);

      // 内容が正しいかも確認
      const content = await filePath.readText();
      expect(content).toBe(file.content);
    }

    const syncProcess: ChildProcess = sync(
      'src-electron/rclone-sample/sync', //from
      'dropbox:sync', //to
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
    const remotelsProcess = ls('dropbox:sync', {
      env: {
        RCLONE_CONFIG: 'src-electron/rclone-sample/rclone.conf',
      },
    });

    const remoteFileList = await getFileList(remotelsProcess);

    const locallsProcess = ls('src-electron/rclone-sample/sync');
    const localFileList = await getFileList(locallsProcess);

    expect(remoteFileList).toEqual(localFileList);
    //dropbox:syncの削除
    const deleteRemoteDirectoryProcess = purge('dropbox:sync', {
      env: {
        RCLONE_CONFIG: 'src-electron/rclone-sample/rclone.conf',
      },
    });
    await new Promise<void>((r) => deleteRemoteDirectoryProcess.on('close', r));
    //消えていることの確認
    const deletedlsProcess = ls('dropbox:', {
      env: {
        RCLONE_CONFIG: 'src-electron/rclone-sample/rclone.conf',
      },
    });
    const deletedRemoteFileList = await getFileList(deletedlsProcess);
    expect(deletedRemoteFileList.some(file => file.includes(' sync/'))).toBe(false);
  }, 50000);
  /**コンフリクトが起こった際の動機の挙動に関するテスト
   * 一度ローカルと同期したリモートを一部書き換えて再度同期を行う
   * rclone.syncでは２つ目に指定したディレクトリを1つ目に指定したディレクトリで置き換えるという挙動をする
   * このことをテストで確認
   * 確認はローカル→リモート方向で行っている
   */
  test('conflictTest', async () => {
    /**コンフリクトを起こすファイルを判別する正規表現 */
    const regexPattern = /hoge3$/;
    /**ファイルの生成 */
    const syncDirectory = new Path('src-electron/rclone-sample/sync');
    const filesToTest = [
      { name: 'test1.txt', content: 'Content for file 1' },
      { name: 'test2.txt', content: 'Content for file 2' },
      { name: 'hoge3', content: 'Content for file 3' },
    ];
    await Promise.all(
      filesToTest.map((file) =>
        syncDirectory.child(file.name).writeText(file.content)
      )
    );
    // ファイルが生成されているか確認
    for (const file of filesToTest) {
      const filePath = syncDirectory.child(file.name);
      expect(filePath.exists()).toBe(true);

      // 内容が正しいかも確認
      const content = await filePath.readText();
      expect(content).toBe(file.content);
    }

    /**リモートとローカルを同期 */
    const syncProcess: ChildProcess = sync(
      'src-electron/rclone-sample/sync', //from
      'dropbox:sync_conflict', //to
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
    const beforeRemotelsProcess = ls('dropbox:sync_conflict', {
      env: {
        RCLONE_CONFIG: 'src-electron/rclone-sample/rclone.conf',
      },
    });

    const beforeRemoteFileList = await getFileList(beforeRemotelsProcess);
    /**コンフリクトを引き起こす */
    /**コンフリクトを引き起こすためのファイルを削除 */
    const deleteProcess = rcloneDelete('dropbox:sync_conflict/hoge3', {
      env: {
        RCLONE_CONFIG: 'src-electron/rclone-sample/rclone.conf',
      },
    });
    await new Promise<void>((r) => deleteProcess.on('close', r));
    /**消えていることを確認 */
    const deletedRemotelsProcess = ls('dropbox:sync_conflict', {
      env: {
        RCLONE_CONFIG: 'src-electron/rclone-sample/rclone.conf',
      },
    });
    const deletedRemoteFileList = await getFileList(deletedRemotelsProcess);
    const containsDeletedFile = deletedRemoteFileList.some((file) =>
      regexPattern.test(file)
    );
    expect(containsDeletedFile).toBe(false);

    /**コンフリクト用ファイルを生成 */
    const conflictDirectory = new Path('src-electron/rclone-sample/conflict');
    const conflictFile = conflictDirectory.child('hoge3');
    await conflictFile.writeText('hogehogehogehogeconflict');

    /**生成したファイルが存在することを確認 */
    expect(conflictFile.exists()).toBe(true);
    /**内容が正しいことも確認 */
    const content = await conflictFile.readText();
    expect(content).toBe('hogehogehogehogeconflict');

    /**コンフリクト用のファイルをアップロード */
    const copyProcess: ChildProcess = copy(
      'src-electron/rclone-sample/conflict/hoge3',
      'dropbox:sync_conflict',
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
    const uploadedRemotelsProcess = ls('dropbox:sync_conflict', {
      env: {
        RCLONE_CONFIG: 'src-electron/rclone-sample/rclone.conf',
      },
    });
    const remoteFileList = await getFileList(uploadedRemotelsProcess);
    const containsFile = remoteFileList.some((file) => regexPattern.test(file));
    expect(containsFile).toBe(true);

    /**コンフリクトが起こっているローカルとリモートを再度同期 */
    const conflictSyncProcess: ChildProcess = sync(
      'src-electron/rclone-sample/sync',
      'dropbox:sync_conflict',
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

    /**最初の同期とコンフリクト後の同期でリモートの内容が変わっていないことを確認 */
    expect(conflictRemoteFileList).toEqual(beforeRemoteFileList);
    /**使用したファイル群を削除 */
    await syncDirectory.remove();
    await conflictDirectory.remove();

    //dropbox:syncの削除
    const deleteRemoteDirectoryProcess = purge('dropbox:sync_conflict', {
      env: {
        RCLONE_CONFIG: 'src-electron/rclone-sample/rclone.conf',
      },
    });
    await new Promise<void>((r) => deleteRemoteDirectoryProcess.on('close', r));
    //消えていることの確認
    const deletedlsProcess = ls('dropbox:', {
      env: {
        RCLONE_CONFIG: 'src-electron/rclone-sample/rclone.conf',
      },
    });
    const deletedRemoteDirectoryList = await getFileList(deletedlsProcess);
    expect(deletedRemoteDirectoryList.some(file => file.includes(' sync_conflict/'))).toBe(false);
  }, 500000);
}
