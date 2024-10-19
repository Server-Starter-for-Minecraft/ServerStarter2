import { Dropbox } from 'dropbox';
import { google } from 'googleapis';
import ini from 'ini';
import onedrive from 'onedrive-api';
import { userInfo } from 'os';
import { authorize, sync, copy } from 'rclone.js';
import { err, ok, Result } from '../base';
import { Bytes } from '../binary/bytes';
import { Path } from '../binary/path';
import { getSystemSettings } from 'app/src-electron/core/stores/system';
import { ChildProcess } from 'child_process';

type RemoteDrive =
  | {
      driveType: 'google';
      mailAddress: string;
    }
  | {
      driveType: 'dropbox';
      mailAddress: string;
    }
  | {
      driveType: 'onedrive';
      mailAddress: string;
    };
type userInfo = {
  mailAddress: string;
  driveId?: string;
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
      const token = config[remote.mailAddress].token;
      const expires = config[remote.mailAddress].expiry;
      if (token === undefined || expires === undefined) return false;
      const now = new Date();
      return now < new Date(expires);
    } else {
      // 実際にurl叩いてチェック
      const userInfo = await this.getUserInfo(
        remote.driveType,
        config[`${remote.driveType}_${remote.mailAddress}`].token
      );
      return userInfo.isErr
        ? false
        : userInfo.value().mailAddress === remote.mailAddress;
    }
  }

  /**
   * アカウントをOAuthで新規登録
   * 登録済みの場合エラー
   */
  async registerNewRemoteWithOAuth(
    driveType: RemoteDrive['driveType'],
    showAuthWindow: (url: string) => void
  ): Promise<Result<RemoteDrive>> {
    const tokenJson = await this.getTokenWithOAuth(driveType, showAuthWindow);
    if (tokenJson.isErr) {
      return err(new Error('failed to get token'));
    }
    const userInfoResult = await this.getUserInfo(driveType, tokenJson.value());
    if (userInfoResult.isErr) {
      return err(new Error('failed to get mailAdderss'));
    }
    const userInfo = userInfoResult.value();
    const configPath = new Path(this.cacheDirPath.child('rclone.conf'));
    /**TODO: 登録済みのdriveTyope,mailAdressと登録したいdriveType,mailAdressが被ったら弾く */
    if (driveType === 'onedrive') {
      //configの書き込み
      const configContent = `[
      ${driveType}_${userInfo.mailAddress}]\n
      type = onedrive\n
      token = ${tokenJson.value()}\n
      drive_id = ${userInfo.driveId}\n
      drive_type = personal\n`;
      await configPath.writeText(configContent);
      return ok({
        driveType: driveType,
        mailAddress: userInfo.mailAddress,
      });
    } else {
      const configContent = `[${driveType}_${
        userInfo.mailAddress
      }]]\ntype = ${driveType}\ntoken = ${tokenJson.value()}\n`;
      await configPath.writeText(configContent);
      return ok({
        driveType: driveType,
        mailAddress: userInfo.mailAddress,
      });
    }
  }

  private async getTokenWithOAuth(
    driveType: RemoteDrive['driveType'],
    showAuthWindow: (url: string) => void
  ): Promise<Result<string>> {
    const authorizeProcess = authorize(driveType, '--auth-no-open-browser');
    //標準出力からurlを取得
    const urlPromise = new Promise<string | null>((resolve, reject) => {
      authorizeProcess.stdout?.on('data', (data) => {
        //console.log(data.toString());
        // URLマッチングのための正規表現
        const urlMatch = data.toString().match(/https?:\/\/[^\s]+/);

        if (urlMatch) {
          resolve(urlMatch[0]); // URLが見つかった場合は解決
        } else {
          reject('No URL found in output'); // URLが見つからない場合
        }
      });
    });
    /**TODO: ここでelectronからブラウザを立ち上げたい */
    showAuthWindow(await urlPromise)
    const tokenPromise = new Promise<string>((resolve) => {
      authorizeProcess.stdout?.on('data', (data) => {
        //console.log(data.toString());
        const tokenMatch = data.toString().match(/({.*?})/);
        resolve(tokenMatch ? tokenMatch[0] : null);
      });
    });
    await new Promise<void>((r) => authorizeProcess.on('close', r));

    const tokenJson = await tokenPromise;
    return ok(tokenJson);
  }

  /**トークンからメールアドレスか表示名を取得 */
  private async getUserInfo(
    driveType: RemoteDrive['driveType'],
    tokenJson: string
  ): Promise<Result<userInfo>> {
    const accessToken = JSON.parse(tokenJson);
    if (driveType === 'google') {
      const oAuth2Client = new google.auth.OAuth2();
      oAuth2Client.setCredentials(accessToken);
      const drive = google.drive({ version: 'v3', auth: oAuth2Client });
      const about = await drive.about.get({ fields: 'user' });
      return ok({ mailAddress: about.data.user.emailAddress });
    } else if (driveType === 'dropbox') {
      const dropbox = new Dropbox({ accessToken: accessToken });
      const response = await dropbox.usersGetCurrentAccount();
      return ok({ mailAddress: response.result.email });
    } else if (driveType === 'onedrive') {
      const driveInfo = await onedrive.items.listChildren({
        accessToken: accessToken,
        itemId: 'root',
      });
      const driveId = driveInfo.value[0]?.parentReference?.driveId;
      const userInfo = await onedrive.items.customEndpoint({
        accessToken: accessToken,
        url: `/drives/${driveId}`,
        method: 'GET',
      });
      return ok({
        mailAddress: userInfo.owner?.user?.displayName,
        driveId: driveId,
      });
    } else {
      return err(new Error('Invalid drive type'));
    }
  }

  /** 登録解除 */
  async unregister(remote: RemoteDrive): Promise<Result<void>> {
    // たぶんトークン消すだけ
    // もともと未登録だった場合は何もせずに成功
    const config = ini.parse(
      await this.cacheDirPath.child('rclone.conf').readText()
    );
    if (config[remote.mailAddress] === undefined) {
      return ok();
    }
    delete config[remote.mailAddress];
    await this.cacheDirPath
      .child('rclone.conf')
      .writeText(ini.stringify(config));
    return ok();
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
  ): Promise<Result<boolean>> {
    const tokenJson = await this.getTokenWithOAuth(
      remote.driveType,
      showAuthWindow
    );
    if (tokenJson.isErr) {
      return err(new Error('failed to get token'));
    }
    const userInfoResult = await this.getUserInfo(
      remote.driveType,
      tokenJson.value()
    );
    if (userInfoResult.isErr) {
      return err(new Error('failed to get username'));
    }
    const result = this.renewToken(remote, tokenJson.value());
    return result;
  }

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
    const userInfoResult = await this.getUserInfo(remote.driveType, token);
    if (userInfoResult.isErr) {
      return err.error('failed to get user info');
    }
    const userInfo = userInfoResult.value();
    if (userInfo.mailAddress === remote.mailAddress) {
      /**トークンをrclone.confに書き込む */
      this.unregister(remote);
      const configPath = new Path(this.cacheDirPath.child('rclone.conf'));
      if (remote.driveType === 'onedrive') {
        const configContent = `[
      ${remote.driveType}_${userInfo.mailAddress}]\n
      type = onedrive\n
      token = ${token}\n
      drive_id = ${userInfo.driveId}\n
      drive_type = personal\n`;
        await configPath.writeText(configContent);
      } else {
        const configContent = `[${remote.driveType}_${userInfo.mailAddress}]]\ntype = ${remote.driveType}\ntoken = ${token}\n`;
        await configPath.writeText(configContent);
      }
      return ok(true);
    } else {
      return err(new Error('different account is used.'));
    }
  }

  /**
   * remote -> local (強制上書き)
   * トークンが無効ならエラー
   */
  async pull(remote: RemotePath, path: Path): Promise<Result<void>> {
    const isAccessible = await this.isAccessible(remote.drive, false);
    if (!isAccessible) {
      return err(new Error('token is invalid'));
    }
    const syncProcess: ChildProcess = sync(
      `${remote.drive.driveType}_${remote.drive.mailAddress}:${remote.path}`,//from
      path, //to
      {
        // Spawn options:
        env: {
          RCLONE_CONFIG: this.cacheDirPath.child('rclone.conf').toStr(),
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
    return ok()
  }

  /**
   * local -> remote (強制上書き)
   * トークンが無効ならエラー
   * */
  async push(remote: RemotePath, path: Path): Promise<Result<void>> {
    // トークンが有効かどうかチェック
    const isAccessible = await this.isAccessible(remote.drive, false);
    if (!isAccessible) {
      return err(new Error('token is invalid'));
    }
    const syncProcess: ChildProcess = sync(
      path, //from
      `${remote.drive.driveType}_${remote.drive.mailAddress}:${remote.path}`,//to
      {
        // Spawn options:
        env: {
          RCLONE_CONFIG: this.cacheDirPath.child('rclone.conf').toStr(),
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
    return ok()
  }

  /**
   * remote -> local
   * ファイル単体 取得
   * トークンが無効ならエラー
   */
  async getFile(remote: RemotePath): Promise<Result<Bytes>> {
    const isAccessible = await this.isAccessible(remote.drive, false);
    if (!isAccessible) {
      return err(new Error('token is invalid'));
    }
    const uploadProcess: ChildProcess = copy(
      `${remote.drive.driveType}_${remote.drive.mailAddress}:${remote.path}`,//from
      this.cacheDirPath.child('downloadedFile').toStr(),
      {
        env: {
          RCLONE_CONFIG: this.cacheDirPath.child('rclone.conf').toStr(),
        },
      }
    );
    uploadProcess.stdout?.on('data', (data) => {
      console.log(data.toString());
    });
    uploadProcess.stderr?.on('data', (data) => {
      console.error(data.toString());
    });
    await new Promise<void>((r) => uploadProcess.on('close', r));
    //ダウンロードしたデータをBytesDataに変換して返す
    const downloadedFile = this.cacheDirPath.child('downloadedFile')
    const downloadedFileBytes = (await downloadedFile.into(Bytes)).value();
    return ok(downloadedFileBytes)
  }

  /**
   * ファイル単体 作成/更新
   * トークンが無効ならエラー
   */
  async putFile(remote: RemotePath, data: Bytes): Promise<Result<void>> {
    const isAccessible = await this.isAccessible(remote.drive, false);
    if (!isAccessible) {
      return err(new Error('token is invalid'));
    }
    const uploadFile = this.cacheDirPath.child('uploadFile')
    await data.into(uploadFile)
    const uploadProcess: ChildProcess = copy(
      uploadFile.toStr(),//from
      `${remote.drive.driveType}_${remote.drive.mailAddress}:${remote.path}`,//to
      {
        env: {
          RCLONE_CONFIG: this.cacheDirPath.child('rclone.conf').toStr(),
        },
      }
    );
    uploadProcess.stdout?.on('data', (data) => {
      console.log(data.toString());
    });
    uploadProcess.stderr?.on('data', (data) => {
      console.error(data.toString());
    });
    await new Promise<void>((r) => uploadProcess.on('close', r));
    return ok()
  }

  /**
   * ディレクトリ内のファイル列挙
   * トークンが無効ならエラー
   */
  async listFile(remote: RemotePath): Promise<Result<RemotePath[]>> {

  }
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
    mailAddress: 'serverstarter.contact@gmail.com',
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
