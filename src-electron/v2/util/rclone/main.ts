import { ChildProcess } from 'child_process';
import dayjs from 'dayjs';
import { Dropbox } from 'dropbox';
import { google } from 'googleapis';
import ini from 'ini';
import onedrive from 'onedrive-api';
import { userInfo } from 'os';
import { authorize, copy, ls, purge, sync, delete as rcloneDelete } from 'rclone.js';
import { z } from 'zod';
import {
  getSystemSettings,
  setSystemSettings,
} from 'app/src-electron/core/stores/system';
import { rcloneSetting } from 'app/src-electron/schema/remote';
import { SystemRemoteSetting } from 'app/src-electron/schema/system';
import { openBrowser } from 'app/src-electron/tools/shell';
import { err, ok, Result } from '../base';
import { Bytes } from '../binary/bytes';
import { Path } from '../binary/path';
import {
  dropboxTokenForTest,
  googleTokenForTest,
  onedriveTokenForTest,
} from './token.private';
import { Ini } from '../binary/ini';
import { Json } from '../binary/json';

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

const brand = <T extends string>(tag: T) => z.string().brand<T>();
const tokenValidator = z.object({
    access_token: brand('accessToken'),
    token_type: z.enum(['Bearer', 'bearer']),
    refresh_token: brand('refreshToken'),
    expiry: z.string().refine(
      (date) => dayjs(date).isValid(), // dayjsで日付検証
      {
        message: 'expiry must be a valid date string',
      }
    ),
  }
);

const configValidator= z.record(
  z.string(),
  z.object({
    type: z.enum(['drive', 'dropbox', 'onedrive']),
    token: tokenValidator,
    drive_id: z.string().optional(),
    drive_type: z.string().optional(),
  }),
);

type TokenType = z.infer<typeof tokenValidator>;
type ConfigType = z.infer<typeof configValidator>
const iniConfig = new Ini(configValidator);
const jsonToken = new Json(tokenValidator);

const mergeConfig = (config1: ConfigType, config2: ConfigType): ConfigType => {
  return { ...config1, ...config2 };
};

async function showAuthWindow(url: string): Promise<void> {
  try {
    await openBrowser(url);
  } catch (error) {
    err.error('Failed to open URL.');
  }
}
function removePeriodOfMailAddress(email: string): string {
  return email.replace(/[.@]/g, '');
}
/**
 * iniParserに任意の文字列をsectionやpropertyで使用しても安全な文字列に変換する機能があったためラップ
 *ini.safe(`${remote.driveType}_${remote.mailAddress}`)を返す
 * */
function getRemoteKey(remote: RemoteDrive): string {
  return `${remote.driveType}_${removePeriodOfMailAddress(remote.mailAddress)}`;
}

class RcloneSource {
  constructor(
    /** 何か値をキャッシュする必要がある場合、このディレクトリの中を使うこと */
    private readonly cacheDirPath: Path
  ) {}
  private get configPath() {
    return this.cacheDirPath.child('rclone.conf');
  }
  /**
   * 起動時処理としてsettings.ssconfigを読み込んでrclone.confを生成する
   *
   */
  async makeConfigFile(): Promise<Result<void>> {
    const systemSetting = await getSystemSettings();
    const setting = systemSetting.remote;
    const configPath = this.configPath;
    const configContent = setting
      .map((setting) => {
        return `[${setting.type}_${removePeriodOfMailAddress(setting.mailAddress)}]\n
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
    const configIni = await this.cacheDirPath.child('rclone.conf').readText();
    const config = configIni.isOk ? ini.parse(configIni.value()) : null;
    if (config === null) {
      return err.error('failed to load rclone.conf');
    }
    const settings: SystemRemoteSetting = Object.entries(config).map(
      ([key, value]: [string, any]) => {
        const [type, mailAddress] = key.split('_');

        const setting: rcloneSetting = {
          type: type as 'drive' | 'dropbox' | 'onedrive',
          mailAddress,
          token: value.token,
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
  /**
   * ドライブにアクセスできることを確認
   *
   * @param checkOnlyExpiration : trueの時はトークンの期限だけチェック falseの時は実際にurl叩いてチェック
   */
  async isAccessible(
    remote: RemoteDrive,
    checkOnlyExpiration: boolean
  ): Promise<boolean> {
    const configIni = await this.configPath.readText();
    const config = configIni.isOk ? await Bytes.fromString(configIni.value()).into(iniConfig) : null;
    if (config === null) {
      return false;
    }
    const remoteKey = getRemoteKey(remote);
    const configVal = config.value()
    if (!configVal[remoteKey]) {
      return false;
    }
    if (checkOnlyExpiration) {
      // トークンの期限だけチェック
      const expires = configVal[remoteKey].token.expiry;
      if (expires === undefined) return false;
      const now = dayjs();
      const expiryDate = dayjs(expires);
      return expiryDate.isValid() ? now.isBefore(expiryDate) : false
    } else {
      // 実際にurl叩いてチェック
      const userInfo = await this.getUserInfo(
        remote.driveType,
        configVal[remoteKey].token
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
    const token = tokenJson.value()
    const userInfoResult = await this.getUserInfo(driveType, tokenJson.value());
    if (userInfoResult.isErr) {
      return err(new Error('failed to get mailAdderss'));
    }
    const userInfo = userInfoResult.value();
    /**TODO: 登録済みのdriveType,mailAdressと登録したいdriveType,mailAdressが被ったら弾く
     * 現状は勝手に置き換えられるようになっている
     */
    const remote = {
      driveType: driveType,
      mailAddress: userInfo.mailAddress,
    }
    if (driveType === 'onedrive') {
      //configの書き込み
      const remoteKey = getRemoteKey(remote)
      const configContent:ConfigType ={
        [remoteKey]: {
          type: driveType,
          token: token,
          drive_id: userInfo.driveId,
          drive_type: 'personal',
        }}

      await this.register(configContent);
      return ok(remote);
    } else {
      const remoteKey = getRemoteKey(remote)
      const config:ConfigType = {
        [remoteKey]: {
          type: driveType,
          token: token
        }
      }
      await this.register(config);
      return ok(remote);
    }}


  private async getTokenWithOAuth(
    driveType: RemoteDrive['driveType'],
    showAuthWindow: (url: string) => void
  ): Promise<Result<TokenType>> {
    const authorizeProcess = authorize(driveType, '--auth-no-open-browser');
    //標準出力からurlを取得
    const urlPromise = new Promise<string | null>((resolve, reject) => {
      //urlは標準エラー出力に出ている
      authorizeProcess.stderr?.on('data', (data) => {
        // URLマッチングのための正規表現
        console.log(data.toString())
        const urlMatch = data.toString().match(/https?:\/\/[^\s]+/);

        if (urlMatch) {
          resolve(urlMatch[0]); // URLが見つかった場合は解決
        } else {
          reject('No URL found in output'); // URLが見つからない場合
        }
      });
    });
    const url = await urlPromise.catch(() => null);
    //TODO: showAuthWindowが動かない、テスト時は手動でurlを開いて実行
    url === null
      ? err.error('URLの取得に失敗しました')
      : await showAuthWindow(url);
    const tokenPromise = new Promise<string>((resolve) => {
      authorizeProcess.stdout?.on('data', (data) => {
        const tokenMatch = data.toString().match(/({.*?})/);
        resolve(tokenMatch ? tokenMatch[0] : null);
      });
    });
    await new Promise<void>((r) => authorizeProcess.on('close', r));

    const tokenJson = await tokenPromise;
    const token = await Bytes.fromString(tokenJson).into(jsonToken)

    return token;
  }

  /**トークンからメールアドレスか表示名を取得 */
  private async getUserInfo(
    driveType: RemoteDrive['driveType'],
    accessToken: TokenType
  ): Promise<Result<userInfo>> {
    if (driveType === 'drive') {
      const oAuth2Client = new google.auth.OAuth2();
      //googleはrcloneで取得できたトークンをJSON.parseしてそのまま渡す
      oAuth2Client.setCredentials(accessToken);
      //console.log(accessToken);
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
        accessToken: accessToken.access_token,
        itemId: 'root',
      });
      const driveId = driveInfo.value[0]?.parentReference?.driveId;
      const userInfo = await onedrive.items.customEndpoint({
        accessToken: accessToken.access_token,
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
      return err.error('Invalid drive type');
    }
  }

  /** 登録解除 */
  async unregister(remote: RemoteDrive): Promise<Result<void>> {
    // たぶんトークン消すだけ
    // もともと未登録だった場合は何もせずに成功
    const configIni = await this.configPath.readText();
    const config = configIni.isOk ? (await Bytes.fromString(configIni.value()).into(iniConfig)).value() : null;
    if (config === null) {
      //rclone.confがない時と読み込みに失敗した時で区別
      return this.configPath.exists() ? err.error('failed to load rclone.conf') : ok()
    }
    const remoteKey = getRemoteKey(remote)
    if (config[remoteKey] === undefined) {
      return ok();
    }
    delete config[remoteKey];
    const configBytes = await iniConfig.stringify(config).into(Bytes)
    return configBytes.isErr
    ? err.error('failed to unregister')
    : await this.configPath.writeText(configBytes.value().toStr('utf8').value()).then(() => ok());
  }

  private async register(
    configToRegister: ConfigType
  ): Promise<Result<void>> {
    // configPathが存在するかチェック
    if (await this.configPath.exists()) {
      const configIni = await this.configPath.readText();
      //configPathが空ファイルだった場合、新しい設定を保存
      if(configIni === null){
        const configBytes = await iniConfig.stringify(configToRegister).into(Bytes);

        return configBytes.isErr
        ? err.error('failed to register')
        : await this.configPath.writeText(configBytes.value().toStr('utf8').value()).then(() => ok());
      }
      // 読み込みが成功した場合のみパース
      const config = configIni.isOk
        ? (await Bytes.fromString(configIni.value()).into(iniConfig)).value()
        : null;

      // 読み込み失敗時エラーを返す
      if (config === null) {
        return err.error('failed to load rclone.conf');
      }

      // 設定をマージし、文字列化して保存
      const mergedConfig = { ...config, ...configToRegister };
      const configBytes = await iniConfig.stringify(mergedConfig).into(Bytes);

      return configBytes.isErr
        ? err.error('failed to register')
        : await this.configPath.writeText(configBytes.value().toStr('utf8').value()).then(() => ok());

    } else {
      // configPathが存在しない場合、新しい設定を保存
      const configBytes = await iniConfig.stringify(configToRegister).into(Bytes);

      return configBytes.isErr
        ? err.error('failed to register')
        : await this.configPath.writeText(configBytes.value().toStr('utf8').value()).then(() => ok());
    }
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
    token: TokenType
  ): Promise<Result<boolean>> {
    //  与えられたトークンが与えられたアカウントにアクセスできることを確認すること
    const userInfoResult = await this.getUserInfo(remote.driveType, token);
    if (userInfoResult.isErr) {
      return err.error('failed to get user info');
    }
    const userInfo = userInfoResult.value();
    if (userInfo.mailAddress === remote.mailAddress) {
      /**トークンをrclone.confに書き込む */
      const remoteKey = getRemoteKey(remote);
      if (remote.driveType === 'onedrive') {
        const config:ConfigType ={
          [remoteKey]: {
            type: remote.driveType,
            token: token,
            drive_id: userInfo.driveId,
            drive_type: 'personal',
          }}

        await this.register(config);
      } else {
        const config:ConfigType = {
          [remoteKey]: {
            type: remote.driveType,
            token: token
          }
        }
        await this.register(config);
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
    const remoteKey = getRemoteKey(remote.drive);
    const syncProcess: ChildProcess = sync(
      `${remoteKey}:${remote.path}`, //from
      path.path, //to
      {
        // Spawn options:
        env: {
          RCLONE_CONFIG: this.configPath.path,
        },
      }
    );

    syncProcess.stdout?.on('data', (data) => {
      //console.log(data.toString());
    });

    syncProcess.stderr?.on('data', (data) => {
      //console.error(data.toString());
    });

    await new Promise<void>((r) => syncProcess.on('close', r));
    return ok();
  }

  /**
   * local -> remote (強制上書き)
   * トークンが無効ならエラー
   * */
  async push(remote: RemotePath, path: Path): Promise<Result<void>> {
    // トークンが有効かどうかチェック
    const isAccessible = await this.isAccessible(remote.drive, false);
    if (!isAccessible) {
      return err.error('token is invalid');
    }
    const remoteKey = getRemoteKey(remote.drive);
    const syncProcess: ChildProcess = sync(
      path.path, //from
      `${remoteKey}:${remote.path}`, //to
      {
        // Spawn options:
        env: {
          RCLONE_CONFIG: this.configPath.path,
        },
      }
    );

    syncProcess.stdout?.on('data', (data) => {
      //console.log(data.toString());
    });

    syncProcess.stderr?.on('data', (data) => {
      //console.error(data.toString());
    });

    await new Promise<void>((r) => syncProcess.on('close', r));
    return ok();
  }

  /**
   * remote -> local
   * ファイル単体 取得
   * トークンが無効ならエラー
   */
  async getFile(remote: RemotePath): Promise<Result<Bytes>> {
    const isAccessible = await this.isAccessible(remote.drive, false);
    if (!isAccessible) {
      return err.error('token is invalid');
    }
    const remoteKey = getRemoteKey(remote.drive);
    const targetPath = this.cacheDirPath.child(`${remote.path}`).parent();
    console.log(targetPath.path);
    const getProcess: ChildProcess = copy(
      `${remoteKey}:${remote.path}`, //from
      targetPath.path,
      {
        env: {
          RCLONE_CONFIG: this.configPath.path,
        },
      }
    );
    getProcess.stdout?.on('data', (data) => {
      console.log(data.toString());
    });
    getProcess.stderr?.on('data', (data) => {
      console.error(data.toString());
    });
    await new Promise<void>((r) => getProcess.on('close', r));
    //ダウンロードしたデータをBytesDataに変換して返す
    const downloadedFile = this.cacheDirPath.child(`${remote.path}`);
    console.log((await downloadedFile.readText()).value());
    const downloadedFileBytes = (await downloadedFile.into(Bytes)).value();
    return ok(downloadedFileBytes);
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
    const uploadFile = this.cacheDirPath.child('upload').child(remote.path);
    const remotePath = new Path(remote.path).parent();
    //console.log(remotePath.path);
    const dataString = await data.toStr();
    if (dataString.isErr === true) {
      return err.error('failed to write uploadFile');
    } else {
      await uploadFile.writeText(dataString.value());
    }
    const remoteKey = getRemoteKey(remote.drive);
    const uploadProcess: ChildProcess = copy(
      uploadFile.path, //from
      `${remoteKey}:${remotePath.path}`, //to
      {
        env: {
          RCLONE_CONFIG:this.configPath.path,
        },
      }
    );
    uploadProcess.stdout?.on('data', (data) => {
      console.log(data.toString());
    });
    uploadProcess.stderr?.on('data', (data) => {
      console.error(data.toString());
      return err.error('upload failed');
    });
    await new Promise<void>((r) => uploadProcess.on('close', r));
    await uploadFile.remove();
    return ok();
  }

  /**
   *リモートのファイル単体削除
   *トークンが無効ならエラー
   */
  async deleteFile(remote: RemotePath): Promise<Result<void>>{
    const isAccessible = await this.isAccessible(remote.drive, false);
    if (!isAccessible) {
      return err(new Error('token is invalid'));
    }
    //console.log(remotePath.path);
    const remoteKey = getRemoteKey(remote.drive);
    const deleteProcess: ChildProcess = rcloneDelete(
      `${remoteKey}:${remote.path}`, //to
      {
        env: {
          RCLONE_CONFIG:this.configPath.path,
        },
      }
    );
    deleteProcess.stdout?.on('data', (data) => {
      console.log(data.toString());
    });
    deleteProcess.stderr?.on('data', (data) => {
      console.error(data.toString());
      return err.error('delete failed');
    });
    await new Promise<void>((r) => deleteProcess.on('close', r));
    return ok();
  }
  /**
   * ディレクトリ内のファイル列挙
   * トークンが無効ならエラー
   */
  async listFile(remote: RemotePath): Promise<Result<RemotePath[]>> {
    const remoteKey =getRemoteKey(remote.drive);
    const lsProcess = ls(`${remoteKey}:${remote.path}`, {
      env: {
        RCLONE_CONFIG: this.configPath.path,
      },
    });
    const fileList: string[] = [];
    const fileLists = await new Promise<string[]>((resolve, reject) => {
      lsProcess.stdout?.on('data', (data) => {
        //console.log(data.toString());
        const lines = data.toString().split('\n');
        fileList.push(...lines.filter((line) => line.trim() !== ''));
      });

      lsProcess.stderr?.on('data', (data) => {
        //console.log(data.toString())
        reject(new Error('Error reading file list:', data.toString()));
      });

      lsProcess.on('close', (code) => {
        if (code === 0) {
          resolve(fileList.sort());
        } else {
          reject(new Error(`ls process exited with code ${code}`));
        }
      });
    });
    const remotePaths: RemotePath[] = fileLists.map((file) => {
      const fileName = file.trim().replace(/^\d+\s+/, ''); // ファイル名のみ抽出
      return {
        drive: remote.drive,
        path: `${remote.path}/${fileName}`,
      };
    });
    return ok(remotePaths);
  }

  /**
   * 渡されたRemoteParhを消す
   * @param remote
   */
  async deleteRemoteDirectory(remote: RemotePath): Promise<Result<void>> {
    // トークンが有効かどうかチェック
    const isAccessible = await this.isAccessible(remote.drive, false);
    if (!isAccessible) {
      return err.error('token is invalid');
    }
    const remoteKey = getRemoteKey(remote.drive);
    const purgeProcess: ChildProcess = purge(`${remoteKey}:${remote.path}`, {
      // Spawn options:
      env: {
        RCLONE_CONFIG: this.configPath.path,
      },
    });

    purgeProcess.stdout?.on('data', (data) => {
      //console.log(data.toString());
    });

    purgeProcess.stderr?.on('data', (data) => {
      //console.error(data.toString());
    });

    await new Promise<void>((r) => purgeProcess.on('close', r));
    return ok();
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
    path.basename(__filename, '.ts'),
    'cache',
  );
  if (workPath.exists()) {
    await workPath.remove();
  }
  await workPath.mkdir();

  /** RcloneSourceを作成 */
  const rcloneSource = new RcloneSource(workPath);

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
  };

  // TODO: 下記については，API Keyを`key.private.ts`としてexportする変数にKeyを入れて，それをここでimportして呼び出す
  // `key.private.ts`はgitignoreに追加してPushされないようにする
  const parsedDriveTokenGoogle =await Bytes.fromString(googleTokenForTest).into(jsonToken);
  const testDriveTokenGoogle = parsedDriveTokenGoogle.value() /** ここで認証トークンを設定 環境変数 or GitHub Secret から取得する */
  const parsedDriveTokenDropbox = await Bytes.fromString(dropboxTokenForTest).into(jsonToken);
  const testDriveTokenDropbox = parsedDriveTokenDropbox.value()
  const parsedDriveTokenOneDrive = await Bytes.fromString(onedriveTokenForTest).into(jsonToken);
  const testDriveTokenOneDrive = parsedDriveTokenOneDrive.value()
  //await rcloneSource.makeConfigFile()
  describe('setTokenFromExternal', async() =>{
    const testCases: TestCase[] = [
      {
        explain: 'google',
        drive: testDriveGoogle,
        token: testDriveTokenGoogle,
      },
      {
        explain: 'dropbox',
        drive: testDriveDropbox,
        token: testDriveTokenDropbox ,
      },
      {
        explain: 'onedrive',
        drive: testDriveOneDrive,
        token: testDriveTokenOneDrive ,
      },
    ]
    test.each(testCases)('$explain', async (testCase) => {
      //一度登録解除してrclone.confから確実に削除
    await rcloneSource.unregister(testCase.drive);
    //消えている/元から存在しないことを確認

    // 最初はアクセスできない
    expect(await rcloneSource.isAccessible(testCase.drive, false)).toBe(false);
    expect(await rcloneSource.isAccessible(testCase.drive, true)).toBe(false);
    // 認証トークンを設定すればアクセスできる
    await rcloneSource.renewToken(testCase.drive, testCase.token);
    expect(await rcloneSource.isAccessible(testCase.drive, false)).toBe(true);
    expect(await rcloneSource.isAccessible(testCase.drive, true)).toBe(true);

    // 認証トークンを何度設定しても大丈夫
    await rcloneSource.renewToken(testCase.drive, testCase.token);
    expect(await rcloneSource.isAccessible(testCase.drive, false)).toBe(true);
    expect(await rcloneSource.isAccessible(testCase.drive, true)).toBe(true);
    await rcloneSource.unregister(testCase.drive);
    })

    type TestCase={
      explain: string,
      drive: RemoteDrive,
      token: TokenType
    }
  },50000)
  //OAuthを使った認証テスト

  describe('registerWithOAuth', async () => {
    const testCases: TestCase[] = [
      {
        explain: 'google',
        drive: testDriveGoogle,
      },
      {
        explain: 'dropbox',
        drive: testDriveDropbox,
      },
      {
        explain: 'onedrive',
        drive: testDriveOneDrive,
      },
    ]
    test.skip.each(testCases)('$explain', async (testCase) => {
          //トークンを取得
    const promiseDrive = await rcloneSource.registerNewRemoteWithOAuth(
      testCase.drive.driveType,
      showAuthWindow
    );
    expect(promiseDrive.isOk).toBe(true);
    const newDrive = promiseDrive.value();
    //rclone.confに書き込まれていることを確認
    const configIni = await workPath
      .child('rclone.conf')
      .readText();
    expect(configIni.isOk).toBe(true);
    const config = (await Bytes.fromString(configIni.value()).into(iniConfig)).value()
    //登録名を生成
    const remoteKey = getRemoteKey(newDrive);
    //登録名に一致するキーがあれば登録成功
    expect(remoteKey in config).toBe(true);
    })
    type TestCase={
      explain: string,
      drive: RemoteDrive,
    }
  },5000000)
  test.skip('registerWithOauth_google', async () => {
    //トークンを取得
    const promiseDriveGoogle = await rcloneSource.registerNewRemoteWithOAuth(
      'drive',
      showAuthWindow
    );
    expect(promiseDriveGoogle.isOk).toBe(true);
    const newDriveGoogle = promiseDriveGoogle.value();
    //rclone.confに書き込まれていることを確認
    const configIni = await workPath
      .child('rclone.conf')
      .readText();
    expect(configIni.isOk).toBe(true);
    const config = ini.parse(configIni.value());
    //登録名を生成
    const remoteKey = `${newDriveGoogle.driveType}_${removePeriodOfMailAddress(
      newDriveGoogle.mailAddress
    )}`;
    //登録名に一致するキーがあれば登録成功
    expect(remoteKey in config).toBe(true);
  }, 50000);

  test.skip('registerWithOauth_dropbox', async () => {
    //トークンを取得
    const promiseDriveDropbox = await rcloneSource.registerNewRemoteWithOAuth(
      'dropbox',
      showAuthWindow
    );
    expect(promiseDriveDropbox.isOk).toBe(true);
    const newDriveDropbox = promiseDriveDropbox.value();
    //rclone.confに書き込まれていることを確認
    const configIni = await workPath
      .child('rclone.conf')
      .readText();
    expect(configIni.isOk).toBe(true);
    const config = ini.parse(configIni.value());
    //登録名を生成
    const remoteKey = `${newDriveDropbox.driveType}_${removePeriodOfMailAddress(
      newDriveDropbox.mailAddress
    )}`;
    //登録名に一致するキーがあれば登録成功
    expect(remoteKey in config).toBe(true);
  }, 50000);

  test.skip('registerWithOauth_onedrive', async () => {
    //トークンを取得
    const promiseDriveOneDrive = await rcloneSource.registerNewRemoteWithOAuth(
      'onedrive',
      showAuthWindow
    );
    expect(promiseDriveOneDrive.isOk).toBe(true);
    const newDriveOneDrive = promiseDriveOneDrive.value();
    //rclone.confに書き込まれていることを確認
    const configIni = await workPath
      .child('rclone.conf')
      .readText();
    expect(configIni.isOk).toBe(true);
    const config = ini.parse(configIni.value());
    //登録名を生成
    const remoteKey = `${
      newDriveOneDrive.driveType
    }_${removePeriodOfMailAddress(newDriveOneDrive.mailAddress)}`;
    //登録名に一致するキーがあれば登録成功
    expect(remoteKey in config).toBe(true);
  }, 500000);

  //pushとpullのテスト
  describe('pushAndPullTest', async () => {
    const testCases: TestCase[] = [
      {
        explain: 'google',
        drive: testDriveGoogle,
        token: testDriveTokenGoogle,
      },
      {
        explain: 'dropbox',
        drive: testDriveDropbox,
        token: testDriveTokenDropbox,
      },
      {
        explain: 'onedrive',
        drive: testDriveOneDrive,
        token: testDriveTokenOneDrive,
      },
    ]
    test.each(testCases)('$explain', async (testCase) => {
      const syncDirectory = workPath.child('sync');
      const pullDirectory = workPath.child('target');
      const filesToTest = [
        { name: 'test1.txt', content: 'Content for file 1' },
        { name: 'test2.txt', content: 'Content for file 2' },
        { name: 'test3.txt', content: 'Content for file 3' },
      ];
      const remotePathExpected = [
        {
          drive: {
            driveType: testCase.drive.driveType,
            mailAddress: testCase.drive.mailAddress,
          },
          path: 'sync/test1.txt',
        },
        {
          drive: {
            driveType: testCase.drive.driveType,
            mailAddress: testCase.drive.mailAddress,
          },
          path: 'sync/test2.txt',
        },
        {
          drive: {
            driveType: testCase.drive.driveType,
            mailAddress: testCase.drive.mailAddress,
          },
          path: 'sync/test3.txt',
        },
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
        expect(content.value()).toBe(file.content);
      }
      //remotePathを定義
      const remote: RemotePath = {
        drive: testCase.drive,
        path: 'sync',
      };
      //push
      //未認証なのでエラーになるはず
      await rcloneSource.unregister(testCase.drive);
      const resultError = await rcloneSource.push(remote, syncDirectory);
      expect(resultError.isErr).toBe(true);

      //認証した上で実行すると成功
      await rcloneSource.renewToken(testCase.drive, testCase.token);
      const resultOk = await rcloneSource.push(remote, syncDirectory);
      expect(resultOk.isOk).toBe(true);

      //実際に同期できていることを確認
      const remoteDirList = await rcloneSource.listFile(remote);
      expect(remoteDirList.value()).toStrictEqual(remotePathExpected);
      await rcloneSource.unregister(testCase.drive);

      //pullのテスト
      //未認証なのでエラーになるはず
      const pullResultError = await rcloneSource.pull(remote, pullDirectory);
      expect(pullResultError.isErr).toBe(true);

      //登録して再度pull
      await rcloneSource.renewToken(testCase.drive, testCase.token);
      const pullResultOk = await rcloneSource.pull(remote, pullDirectory);
      expect(pullResultOk.isOk).toBe(true);

      //実際に同期できていることを確認
      //localのsyncとtargetが完全に同じファイル構成になっているはず
      const syncParhList = await syncDirectory.iter();
      const syncList = syncParhList.map((path) => path.basename());
      const pullPathList = await pullDirectory.iter();
      const pullList = pullPathList.map((path) => path.basename());
      expect(pullList).toStrictEqual(syncList);

      //　使ったファイルを削除
      const purgeResult = await rcloneSource.deleteRemoteDirectory(remote);
      expect(purgeResult.isOk).toBe(true);
      await workPath.child('sync').remove();
      await workPath.child('target').remove();
      await rcloneSource.unregister(testCase.drive);
    })
    type TestCase={
      explain: string,
      drive: RemoteDrive,
      token: TokenType,
    }
  },500000)

  //単一ファイルの送受信テスト
  describe('putAndGetFileTest', async () => {
    const testCases: TestCase[] = [
      {
        explain: 'google',
        drive: testDriveGoogle,
        token: testDriveTokenGoogle,
      },
      {
        explain: 'dropbox',
        drive: testDriveDropbox,
        token: testDriveTokenDropbox,
      },
      {
        explain: 'onedrive',
        drive: testDriveOneDrive,
        token: testDriveTokenOneDrive,
      },
    ]
    test.each(testCases)('$explain', async (testCase) => {
      const syncDirectory = workPath.child('cache').child('sync');
      const fileToTest = { name: 'test1.txt', content: 'Content for file 1' };
      const remotePathExpected = [
        {
          drive: testCase.drive,
          path: 'sync/test1.txt',
        },
      ];
      await syncDirectory.child(fileToTest.name).writeText(fileToTest.content);

      // ファイルが生成されているか確認
      const filePath = syncDirectory.child(fileToTest.name);
      expect(filePath.exists()).toBe(true);

      // 内容が正しいかも確認
      const content = await filePath.readText();
      expect(content.value()).toBe(fileToTest.content);

      //remotePathを定義
      //putではここで渡した*ディレクトリ*にアップロードしたファイルが置かれる
      //getではここで渡した*ファイル*がローカルで指定したディレクトリに置かれる(処理上はBytesDataがメモリに乗る)
      //いずれもファイルを指定する方が直感的なのでput/getではファイル名をしていするようにする
      const remote: RemotePath = {
        drive: testCase.drive,
        path: 'sync/test1.txt',
      };
      //listFile時のみディレクトリ指定
      const remoteDirectory: RemotePath = {
        drive: testCase.drive,
        path: 'sync'
      }
      const putDataText = syncDirectory.child(fileToTest.name);
      const putData = (await putDataText.into(Bytes)).value();
      //put
      //未認証なのでエラーになるはず
      await rcloneSource.unregister(testCase.drive);
      const resultError = await rcloneSource.putFile(
        remote,
        putData,
      );
      expect(resultError.isErr).toBe(true);

      //認証した上で実行すると成功
      await rcloneSource.renewToken(testCase.drive, testCase.token);
      const resultOk = await rcloneSource.putFile(
        remote,
        putData,
      );
      expect(resultOk.isOk).toBe(true);

      //実際に同期できていることを確認
      const remoteDirList = await rcloneSource.listFile(remoteDirectory);
      expect(remoteDirList.value()).toStrictEqual(remotePathExpected);
      await rcloneSource.unregister(testCase.drive);

      //getのテスト
      //未認証なのでエラーになるはず
      const getResultError = await rcloneSource.getFile(remote);
      expect(getResultError.isErr).toBe(true);

      //登録して再度get
      await rcloneSource.renewToken(testCase.drive, testCase.token);
      const getResultOk = await rcloneSource.getFile(remote);
      expect(getResultOk.isOk).toBe(true);
      //実際に同期できていることを確認
      expect(getResultOk.value()).toStrictEqual(putData);
      //使ったファイルを削除
      const purgeResult = await rcloneSource.deleteRemoteDirectory(remoteDirectory);
      expect(purgeResult.isOk).toBe(true);
      await workPath.child('sync').remove();
      await workPath.child('target').remove();
      await rcloneSource.unregister(testCase.drive);
    })
    type TestCase={
      explain: string,
      drive: RemoteDrive,
      token: TokenType,
    }
  },500000)

  await workPath.remove();

  //await rcloneSource.saveConfig()
}
