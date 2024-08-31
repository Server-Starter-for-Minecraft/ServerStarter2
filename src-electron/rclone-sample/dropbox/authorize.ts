import { isValid } from 'app/src-electron/util/error/error';
import { Path } from 'app/src-electron/util/path';
import { ChildProcess } from 'child_process';
import * as fs from 'fs';
import { authorize } from 'rclone.js';


/** In Source Testing */
if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;
  /**rcloneを用いたdropboxのOauth認証を行う */
  test('dropboxAuthorizeTest', async () => {
    const authorizeProcess = authorize('dropbox');
    const tokenPromise = new Promise<string>((resolve) => {
      authorizeProcess.stdout?.on('data', (data) => {
        console.log(data.toString());
        const tokenMatch = data.toString().match(/({.*?})/);
        resolve(tokenMatch ? tokenMatch[0] : null);
      });
    });
    await new Promise<void>((r) => authorizeProcess.on('close', r));

    // 取得できたトークンに関するテスト
    const token = await tokenPromise;
    const tokenObj = JSON.parse(token);
    expect(tokenObj).toHaveProperty('access_token');
    expect(tokenObj).toHaveProperty('token_type');
    expect(tokenObj).toHaveProperty('refresh_token');
    expect(tokenObj).toHaveProperty('expiry');
    console.log('Token:', token);
    //configの書き込み
    const configPath = new Path('src-electron/rclone-sample/rclone.conf');
    const configContent = `[dropbox]\ntype = dropbox\ntoken = ${token}\n`;

    // ファイルが存在しているかチェック
    if (configPath.exists()) {
      const fileContent = await configPath.readText();

      if (isValid(fileContent)) {
        // [dropbox]セクションが含まれているかチェック
        const dropboxSectionRegex = /\[dropbox\]\ntype = dropbox\ntoken = .*\n?/;

        const updatedContent = dropboxSectionRegex.test(fileContent)
          ?fileContent.replace(dropboxSectionRegex, configContent) // 既存セクションの置き換え
          : `${fileContent}\n${configContent}`; // 改行して追記

        // 新しい内容を書き込む
        await configPath.writeText(updatedContent);
      } else {
        console.error('Failed to read the configuration file.');
      }
    } else {
      // ファイルが存在しない場合、新規作成
      await configPath.writeText(configContent);
    }
    console.log('rclone.conf updated');
  },50000);
}
