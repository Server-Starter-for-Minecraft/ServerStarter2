import onedrive from 'onedrive-api';
import { authorize } from 'rclone.js';
import { Path } from 'src-electron/v2/util/binary/path';

/** In Source Testing */
if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;
  /**rcloneを用いたonedriveのOauth認証を行う */
  test('onedriveAuthorizeTest', async () => {
    const authorizeProcess = authorize('onedrive');
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

    // onedrive-apiを使用してdrive_idを取得
    const accessToken = tokenObj.access_token;
    const driveInfo = await onedrive.items.listChildren({
      accessToken: accessToken,
      itemId: 'root',
    });

    const driveId = driveInfo.value[0]?.parentReference?.driveId;
    expect(driveId).toBeTruthy();
    console.log('Drive ID:', driveId);

    const userInfo = await onedrive.items.customEndpoint({
      accessToken: accessToken,
      url: `/drives/${driveId}`,
      method: 'GET',
    });
    const displayName = userInfo.owner?.user?.displayName;
    expect(displayName).toBe('serverstarter serverstarter');
    console.log('Display name :', displayName);

    //configの書き込み
    const configPath = new Path('src-electron/rclone-sample/rclone.conf');
    const configContent = `[onedrive]\ntype = onedrive\ntoken = ${token}\ndrive_id = ${driveId}\ndrive_type = personal\n`;

    // ファイルが存在しているかチェック
    if (configPath.exists()) {
      const fileContent = await configPath.readText();

      if (fileContent.isOk) {
        // [onedrive]セクションが含まれているかチェック
        const onedriveSectionRegex =
          /\[onedrive\]\ntype = onedrive\ntoken = [\s\S]*?(?=\n\[|\n*$)/;
        const updatedContent = onedriveSectionRegex.test(fileContent.value())
          ? fileContent.value().replace(onedriveSectionRegex, configContent) // 既存セクションの置き換え
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
  }, 50000);
}
