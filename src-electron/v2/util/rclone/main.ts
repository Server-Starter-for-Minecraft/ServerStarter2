import { Dropbox } from 'dropbox';
import { google } from 'googleapis';
import ini from 'ini';
import onedrive from 'onedrive-api';
import { userInfo } from 'os';
import {
  getSystemSettings,
  setSystemSettings,
} from 'app/src-electron/core/stores/system';
import { rcloneSetting } from 'app/src-electron/schema/remote';
import { SystemRemoteSetting } from 'app/src-electron/schema/system';
import { err, ok, Result } from '../base';
import { Bytes } from '../binary/bytes';
import { Path } from '../binary/path';
import { getSystemSettings } from 'app/src-electron/core/stores/system';
import { ChildProcess } from 'child_process';

type RemoteDrive =
  | {
      driveType: 'drive';
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
   * 起動時処理としてsettings.ssconfigを読み込んでrclone.confを生成する
   *
   */
  async makeConfigFile(): Promise<Result<void>> {
    const systemSetting = await getSystemSettings();
    const setting = systemSetting.remote;
    const configPath = this.cacheDirPath.child('rclone.conf');
    const configContent = setting
      .map((setting) => {
        return `[${setting.type}_${this.removePeriodOfMailAddress(setting.mailAddress)}]\n
          type = ${setting.type}\n
          token = ${setting.token}\n
          ${setting.driveId ? `drive_id = ${setting.driveId}\n` : ''}
          ${setting.driveType ? `drive_type = ${setting.driveType}\n` : ''}\n`;
      })
      .join('');
    await configPath.writeText(configContent);
    return ok();
  }

  async saveConfig(): Promise<Result<void>> {
    const configIni = await this.cacheDirPath.child('rclone.conf').readText()
    const config = configIni.isOk
    ? ini.parse(configIni.value())
    : null;
    if(config === null){return err.error('failed to load rclone.conf')}
    const settings: SystemRemoteSetting = Object.entries(config).map(
      ([key, value]: [string, any]) => {
        const [type, mailAddress] = key.split('_');

        const setting: rcloneSetting = {
          type: type as 'drive' | 'dropbox' | 'onedrive',
          mailAddress,
          token: value.token
        };

        // driveId, driveTypeが存在する場合のみ追加
        if (value.drive_id) {
          setting.driveId = value.drive_id;
        }
        if (value.drive_type) {
          setting.driveType = value.drive_type;
        }

        return setting;
      }
    );
    const systemSetting = await getSystemSettings();
    systemSetting.remote = settings;
    await setSystemSettings(systemSetting);
    return ok();
  }

  private removePeriodOfMailAddress(email: string): string {
    return email.replace(/[.@]/g, '');
  }
  /**
   * ドライブにアクセスできることを確認
   *
   * @param checkOnlyExpiration : trueの時はトークンの期限だけチェック falseの時は実際にurl叩いてチェック
   */
  async isAccessible(
    remote: RemoteDrive,
    checkOnlyExpiration: boolean
  ): Promise<boolean> {
    const configIni = await this.cacheDirPath.child('rclone.conf').readText()
    const config = configIni.isOk
    ? ini.parse(configIni.value())
    : null;
    if(config === null){return false}
    if (checkOnlyExpiration) {
      // トークンの期限だけチェック
      const mailKey = this.removePeriodOfMailAddress(remote.mailAddress)
      const remoteKey = `${remote.driveType}_${mailKey}`
      if(!config[remoteKey]){return false}
      const token = config[remoteKey].token;
      const tokenJson = JSON.parse(token)
      const expires = tokenJson.expiry;
      if (token === undefined || expires === undefined) return false;
      const now = new Date();
      return now < new Date(expires);
    } else {
      // 実際にurl叩いてチェック
      const mailKey = this.removePeriodOfMailAddress(remote.mailAddress)
      const remoteKey = `${remote.driveType}_${mailKey}`
      if(!config[remoteKey]){return false}
      const userInfo = await this.getUserInfo(
        remote.driveType,
        config[remoteKey].token
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
      const key = this.removePeriodOfMailAddress(userInfo.mailAddress)
      const configContent = `[
      ${driveType}_${key}]\n
      type = onedrive\n
      token = ${tokenJson.value()}\n
      drive_id = ${userInfo.driveId}\n
      drive_type = personal\n`;
      await this.register(`${driveType}_${key}`,configContent);
      return ok({
        driveType: driveType,
        mailAddress: userInfo.mailAddress,
      });
    } else {
      const key = this.removePeriodOfMailAddress(userInfo.mailAddress)
      const configContent = `[${driveType}_${key}]\ntype = ${driveType}\ntoken = ${tokenJson.value()}\n`;
      await this.register(`${driveType}_${key}`,configContent);
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
    if (driveType === 'drive') {
      const oAuth2Client = new google.auth.OAuth2();
      //googleはrcloneで取得できたトークンをJSON.parseしてそのまま渡す
      oAuth2Client.setCredentials(accessToken);
      console.log(accessToken)
      const drive = google.drive({ version: 'v3', auth: oAuth2Client });
      const about = await drive.about.get({ fields: 'user' });
      const mailAdderss = about.data?.user?.emailAddress;
      return typeof mailAdderss === 'string'
        ? ok({ mailAddress: mailAdderss })
        : err.error('failed to get mailAddress');

    } else if (driveType === 'dropbox') {
      //dropboxはJSON.parseしたもののaccess_tokenだけ渡す
      const dropbox = new Dropbox({ accessToken: accessToken.access_token });
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
      const mailAddress = userInfo.owner?.user?.displayName;
      //返り値に正しいmailAddress/driveIdが入っていることを確認してから返す？
      return typeof mailAddress === 'string' && typeof driveId === 'string'
        ? ok({
            mailAddress: userInfo.owner?.user?.displayName.toString(),
            driveId: driveId.toString(),
          })
        : err.error('failed to get mailAddress or drive ID');
    } else {
      return err(new Error('Invalid drive type'));
    }
  }

  /** 登録解除 */
  async unregister(remote: RemoteDrive): Promise<Result<void>> {
    // たぶんトークン消すだけ
    // もともと未登録だった場合は何もせずに成功
    const key = this.removePeriodOfMailAddress(remote.mailAddress)
    if (config[`${remote.driveType}_${key}`] === undefined) {
      return ok();
    }
    delete config[`${remote.driveType}_${key}`];
    await this.cacheDirPath
      .child('rclone.conf')
      .writeText(ini.stringify(config));
    return ok();
  }

  private async register(remoteKey: string, configContent: string): Promise<Result<void>>{
    const configIni = await this.cacheDirPath.child('rclone.conf').readText()
    const config = configIni.isOk
    ? ini.parse(configIni.value())
    : null;
    if(config === null){
      await this.cacheDirPath.child('rclone.conf').writeText(configContent)
      return ok()
    }
    if (config[remoteKey]){
      delete config[remoteKey];
      await this.cacheDirPath
      .child('rclone.conf')
      .writeText(ini.stringify(config));
    }
    await this.cacheDirPath.child('rclone.conf').appendText(configContent)
    return ok()
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
      const key = this.removePeriodOfMailAddress(userInfo.mailAddress)
      if (remote.driveType === 'onedrive') {
        const configContent = `[
      ${remote.driveType}_${key}]\n
      type = onedrive\n
      token = ${token}\n
      drive_id = ${userInfo.driveId}\n
      drive_type = personal\n`;
        await this.register(`${remote.driveType}_${key}`,configContent);
      } else {
        const configContent = `[${remote.driveType}_${key}]\ntype = ${remote.driveType}\ntoken = ${token}\n`;
        await this.register(`${remote.driveType}_${key}`,configContent);
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
      `${remote.drive.driveType}_${remote.drive.mailAddress}:${remote.path}`, //from
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
      `${remote.drive.driveType}_${remote.drive.mailAddress}:${remote.path}`, //from
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
  if(workPath.exists()){await workPath.remove()}
  await workPath.mkdir();

  /** RcloneSourceを作成 */
  const rcloneSource = new RcloneSource(workPath.child('cache'));

  const testDriveGoogle: RemoteDrive = {
    driveType: 'drive',
    mailAddress: 'serverstarter.contact@gmail.com',
  };
  const testDriveDropbox: RemoteDrive = {
    driveType: 'dropbox',
    mailAddress: 'serverstarter.contact@gmail.com',
  };
  const testDriveOneDrive: RemoteDrive = {
    driveType: 'onedrive',
    mailAddress: 'serverstarter serverstarter',
  }

  // TODO: 下記については，API Keyを`key.private.ts`としてexportする変数にKeyを入れて，それをここでimportして呼び出す
  // `key.private.ts`はgitignoreに追加してPushされないようにする
  const testDriveTokenGoogle = googleTokenForTest; /** ここで認証トークンを設定 環境変数 or GitHub Secret から取得する */
  const testDriveTokenDropbox = dropboxTokenForTest;
  const testDriveTokenOneDrive = onedriveTokenForTest;
  //await rcloneSource.makeConfigFile()

  test('認証トークンを設定できる_google', async () => {
    //一度登録解除してrclone.confから確実に削除
    await rcloneSource.unregister(testDriveGoogle)
    //消えている/元から存在しないことを確認

    // 最初はアクセスできない
    expect(await rcloneSource.isAccessible(testDriveGoogle, false)).toBe(false);
    expect(await rcloneSource.isAccessible(testDriveGoogle, true)).toBe(false);
    // 認証トークンを設定すればアクセスできる
    await rcloneSource.renewToken(testDriveGoogle, testDriveTokenGoogle);
    expect(await rcloneSource.isAccessible(testDriveGoogle, false)).toBe(true);
    expect(await rcloneSource.isAccessible(testDriveGoogle, true)).toBe(true);

    // 認証トークンを何度設定しても大丈夫
    await rcloneSource.renewToken(testDriveGoogle, testDriveTokenGoogle);
    expect(await rcloneSource.isAccessible(testDriveGoogle, false)).toBe(true);
    expect(await rcloneSource.isAccessible(testDriveGoogle, true)).toBe(true);
    await rcloneSource.unregister(testDriveGoogle)
  });
  test('認証トークンを設定できる_Dropbox', async () => {
    //一度登録解除してrclone.confから確実に削除
    await rcloneSource.unregister(testDriveDropbox)
    // 最初はアクセスできない
    expect(await rcloneSource.isAccessible(testDriveDropbox, false)).toBe(false);
    expect(await rcloneSource.isAccessible(testDriveDropbox, true)).toBe(false);
    // 認証トークンを設定すればアクセスできる
    await rcloneSource.renewToken(testDriveDropbox, testDriveTokenDropbox);
    expect(await rcloneSource.isAccessible(testDriveDropbox, false)).toBe(true);
    expect(await rcloneSource.isAccessible(testDriveDropbox, true)).toBe(true);

    // 認証トークンを何度設定しても大丈夫
    await rcloneSource.renewToken(testDriveDropbox, testDriveTokenDropbox);
    expect(await rcloneSource.isAccessible(testDriveDropbox, false)).toBe(true);
    expect(await rcloneSource.isAccessible(testDriveDropbox, true)).toBe(true);
    await rcloneSource.unregister(testDriveDropbox)
  });
  test.skip('認証トークンを設定できる_OneDrive', async () => {
    //一度登録解除してrclone.confから確実に削除
    await rcloneSource.unregister(testDriveOneDrive)
    // 最初はアクセスできない
    expect(await rcloneSource.isAccessible(testDriveOneDrive, false)).toBe(false);
    expect(await rcloneSource.isAccessible(testDriveOneDrive, true)).toBe(false);
    // 認証トークンを設定すればアクセスできる
    await rcloneSource.renewToken(testDriveOneDrive, testDriveTokenOneDrive);
    expect(await rcloneSource.isAccessible(testDriveOneDrive, false)).toBe(true);
    expect(await rcloneSource.isAccessible(testDriveOneDrive, true)).toBe(true);

    // 認証トークンを何度設定しても大丈夫
    await rcloneSource.renewToken(testDriveOneDrive, testDriveTokenOneDrive);
    expect(await rcloneSource.isAccessible(testDriveOneDrive, false)).toBe(true);
    expect(await rcloneSource.isAccessible(testDriveOneDrive, true)).toBe(true);
    await rcloneSource.unregister(testDriveOneDrive)
  });
  await workPath.remove()

  //await rcloneSource.saveConfig()
}
