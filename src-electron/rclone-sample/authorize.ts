import { ChildProcess } from 'child_process';
import * as fs from 'fs';
import { authorize } from 'rclone.js';

/** In Source Testing */
if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;
  test('googleAuthorizeTest', async () => {
    const authorizeProcess = authorize('drive');
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
    const configPath = 'src-electron/rclone-sample/rclone.conf';
    const configContent = `[gdrive]\ntype = drive\nscope = drive\ntoken = ${token}\n`;
    fs.writeFileSync(configPath, configContent);
    console.log('rclone.conf updated');
  });
}
