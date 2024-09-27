import { Dropbox } from 'dropbox';
import { google } from 'googleapis';
import ini from 'ini';
import onedrive from 'onedrive-api';
import { authorize } from 'rclone.js';
import { err, ok, Result } from '../base';
import { Bytes } from '../binary/bytes';
import { Path } from '../binary/path';

type RemoteDrive =
  | {
      driveType: 'google';
      mailAdress: string;
    }
  | {
      driveType: 'dropbox';
      mailAdress: string;
    }
  | {
      driveType: 'onedrive';
      mailAdress: string;
    };

type RemotePath = {
  drive: RemoteDrive;
  path: string;
};

class RcloneSource {
  constructor(
    /** 何か値をキャッシュする必要がある場合、このディレクトリの中を使うこと */
    private readonly cacheDirPath: Path
  ) {}

  /**
   * ドライブにアクセスできることを確認
   *
   * @param checkOnlyExpiration : trueの時はトークンの期限だけチェック falseの時は実際にurl叩いてチェック
   */
  async isAccessible(
    remote: RemoteDrive,
    checkOnlyExpiration: boolean
  ): Promise<boolean> {
    const config = ini.parse(
      await this.cacheDirPath.child('rclone.conf').readText()
    );
    if (checkOnlyExpiration) {
      // トークンの期限だけチェック
      const token = config[remote.mailAdress].token;
      const expires = config[remote.mailAdress].expiry;
      if (token === undefined || expires === undefined) return false;
      const now = new Date();
      return now < new Date(expires);
    } else {
      // 実際にurl叩いてチェック
    }
  }

  /**
   * アカウントをOAuthで新規登録
   * 登録済みの場合エラー
   */
  async registerNewRemoteWithOAuth(
    driveType: RemoteDrive['driveType']
  ): Promise<Result<RemoteDrive>> {
    const authorizeProcess = authorize(driveType,'--auth-no-open-browser');
    //標準出力からurlを取得
    const urlPromise = new Promise<string | null>((resolve, reject) => {
      authorizeProcess.stdout?.on('data', (data) => {
        console.log(data.toString());
        // URLマッチングのための正規表現
        const urlMatch = data.toString().match(/https?:\/\/[^\s]+/);

        if (urlMatch) {
          resolve(urlMatch[0]); // URLが見つかった場合は解決
        } else {
          reject('No URL found in output'); // URLが見つからない場合
        }
      });
    });
    //TODO: urlをelectronのブラウザで開く

    const tokenPromise = new Promise<string>((resolve) => {
      authorizeProcess.stdout?.on('data', (data) => {
        console.log(data.toString());
        const tokenMatch = data.toString().match(/({.*?})/);
        resolve(tokenMatch ? tokenMatch[0] : null);
      });
    });
    await new Promise<void>((r) => authorizeProcess.on('close', r));

    const tokenJson = await tokenPromise;
    const accessToken = JSON.parse(tokenJson);
    if (driveType === 'onedrive') {
      const driveInfo = await onedrive.items.listChildren({
        accessToken: accessToken,
        itemId: 'root',
      });

      const driveId = driveInfo.value[0]?.parentReference?.driveId;
      expect(driveId).toBeTruthy();

      const userInfo = await onedrive.items.customEndpoint({
        accessToken: accessToken,
        url: `/drives/${driveId}`,
        method: 'GET',
      });
      const displayName = userInfo.owner?.user?.displayName;
      expect(displayName).toBe('serverstarter serverstarter');

      //configの書き込み
      const configPath = new Path(this.cacheDirPath.child('rclone.conf'));
      const configContent = `[${driveType}_${displayName}]\ntype = onedrive\ntoken = ${tokenJson}\ndrive_id = ${driveId}\ndrive_type = personal\n`;
      await configPath.writeText(configContent);
      return ok({
        driveType: driveType,
        mailAdress: displayName,
      });
    } else {
      const configPath = new Path(this.cacheDirPath.child('rclone.conf'));

      if (driveType === 'google') {
        const oAuth2Client = new google.auth.OAuth2();
        oAuth2Client.setCredentials(accessToken);
        // Google Drive APIクライアントを初期化
        const drive = google.drive({ version: 'v3', auth: oAuth2Client });
        // 認証されたユーザー情報を取得
        const about = await drive.about.get({ fields: 'user' });
        const mailAdress = about.data.user.emailAddress;
        const configContent = `[${driveType}_${mailAdress}]]\ntype = ${driveType}\ntoken = ${tokenJson}\n`;
        await configPath.writeText(configContent);
        return ok({
          driveType: driveType,
          mailAdress: mailAdress,
        });
      } else {
        const dropbox = new Dropbox({ accessToken: accessToken });
        const response = dropbox.usersGetCurrentAccount();
        const mailAdress = (await response).result.email;
        const configContent = `[${driveType}_${mailAdress}]]\ntype = ${driveType}\ntoken = ${tokenJson}\n`;
        await configPath.writeText(configContent);
        return ok({
          driveType: driveType,
          mailAdress: mailAdress,
        });
      }
    }
  }

  /** 登録解除 */
  async unregister(remote: RemoteDrive): Promise<Result<void>> {
    // たぶんトークン消すだけ
    // もともと未登録だった場合は何もせずに成功
    const config = ini.parse(
      await this.cacheDirPath.child('rclone.conf').readText()
    );
    if (config[remote.mailAdress] === undefined) {
      return ok(undefined);
    }
    delete config[remote.mailAdress];
    await this.cacheDirPath.child('rclone.conf').writeText(ini.stringify(config));
    return ok(undefined);
  }

  /**
   * OAuth経由で認証 (リフレッシュトークンが切れたときに発火)
   *
   * @param showAuthWindow 直接ブラウザを開かずに、認証用url受け取ってユーザー提供 実際はここでelectronの新しいウィンドウを立ち上げることになる
   *
   * どのアカウントを選択するかはユーザー次第なので、正しくないアカウントが選択されたらfalseを返す
   */
  async renewTokenWithOAuth(
    remote: RemoteDrive,
    showAuthWindow: (url: string) => void
  ): Promise<Result<boolean>> {}

  /**
   * 認証トークンを手動設定
   *
   * 主にテスト用 (テストでブラウザを開くわけにもいかないので)
   * @param token
   */
  async renewToken(
    remote: RemoteDrive,
    token: string
  ): Promise<Result<boolean>> {
    //  与えられたトークンが与えられたアカウントにアクセスできることを確認すること
  }

  /**
   * remote -> local (強制上書き)
   * トークンが無効ならエラー
   */
  async pull(remote: RemotePath, path: Path): Promise<Result<void>> {}

  /**
   * local -> remote (強制上書き)
   * トークンが無効ならエラー
   * */
  async push(remote: RemotePath, path: Path): Promise<Result<void>> {}

  /**
   * remote -> local
   * ファイル単体 取得
   * トークンが無効ならエラー
   */
  async getFile(remote: RemotePath): Promise<Result<Bytes>> {}

  /**
   * ファイル単体 作成/更新
   * トークンが無効ならエラー
   */
  async putFile(remote: RemotePath, data: Bytes): Promise<Result<void>> {}

  /**
   * ディレクトリ内のファイル列挙
   * トークンが無効ならエラー
   */
  async listFile(remote: RemotePath): Promise<Result<RemotePath[]>> {}
}

/** In Source Testing */
if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;
  const { Path } = await import('src-electron/v2/util/binary/path');
  const path = await import('path');

  // 一時使用フォルダを初期化
  const workPath = new Path(__dirname).child(
    'work',
    path.basename(__filename, '.ts')
  );
  workPath.mkdir();

  /** RcloneSourceを作成 */
  const rcloneSource = new RcloneSource(workPath.child('cache'));

  const testDrive: RemoteDrive = {
    driveType: 'google',
    mailAdress: 'serverstarter.contact@gmail.com',
  };

  // TODO: 下記については，API Keyを`key.private.ts`としてexportする変数にKeyを入れて，それをここでimportして呼び出す
  // `key.private.ts`はgitignoreに追加してPushされないようにする
  const testDriveToken =
    ''; /** ここで認証トークンを設定 環境変数 or GitHub Secret から取得する */

  test('認証トークンを設定できる', async () => {
    // 最初はアクセスできない
    expect(await rcloneSource.isAccessible(testDrive, false)).toBe(false);
    expect(await rcloneSource.isAccessible(testDrive, true)).toBe(false);

    // 認証トークンを設定すればアクセスできる
    rcloneSource.renewToken(testDrive, testDriveToken);
    expect(await rcloneSource.isAccessible(testDrive, false)).toBe(true);
    expect(await rcloneSource.isAccessible(testDrive, true)).toBe(true);

    // 認証トークンを何度設定しても大丈夫
    rcloneSource.renewToken(testDrive, testDriveToken);
    expect(await rcloneSource.isAccessible(testDrive, false)).toBe(true);
    expect(await rcloneSource.isAccessible(testDrive, true)).toBe(true);
  });
}
