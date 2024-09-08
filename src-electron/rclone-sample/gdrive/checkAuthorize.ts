import { google } from 'googleapis';
import { Path } from 'src-electron/v2/util/binary/path';
import ini from 'ini';

/** In Source Testing */
if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;

  test('checkAuthorizedAccount', async () => {
    const configPath = new Path('src-electron/rclone-sample/rclone.conf');
    const config = await configPath.readText();
    if (config.isOk) {
      const tokenSection=ini.parse(config.value())
      console.log(tokenSection)
      if (tokenSection) {
        const token = JSON.parse(tokenSection.gdrive.token);
        // OAuth2クライアントを初期化
        const oAuth2Client = new google.auth.OAuth2();
        oAuth2Client.setCredentials(token);
        // Google Drive APIクライアントを初期化
        const drive = google.drive({ version: 'v3', auth: oAuth2Client });
        try {
          // 認証されたユーザー情報を取得
          const about = await drive.about.get({ fields: 'user' });
          const userInfo = about.data.user;

          // ユーザー情報を出力
          console.log('Authenticated user:', userInfo);

          expect(userInfo).toBeDefined();
          expect(userInfo?.emailAddress).toBe(
            'serverstarter.contact@gmail.com'
          );
        } catch (error) {
          console.error('Error verifying account:', error);
          throw error; // エラーが発生した場合はテストを失敗させる
        }
      }
    }
  });
}
