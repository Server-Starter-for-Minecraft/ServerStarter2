import { World, WorldEdited, WorldID } from 'app/src-electron/schema/world';
import { pullRemoteWorld, pushRemoteWorld } from '../remote/remote';
import { WorldContainer, WorldName } from 'app/src-electron/schema/brands';
import { worldContainerToPath } from './worldContainer';
import { failabilify } from 'app/src-electron/util/error/failable';
import { withError } from 'app/src-electron/util/error/witherror';
import { validateNewWorldName } from './name';
import { genUUID } from 'app/src-electron/tools/uuid';
import { WorldSettings, serverJsonFile } from './files/json';
import {
  constructWorldSettings,
  formatWorldDirectory,
  loadLocalFiles,
  saveLocalFiles,
} from './local';
import { RunRebootableServer, runRebootableServer } from '../server/server';
import { getSystemSettings } from '../stores/system';
import { getCurrentTimestamp } from 'app/src-electron/util/timestamp';
import { isError, isValid } from 'app/src-electron/util/error/error';
import { errorMessage } from 'app/src-electron/util/error/construct';
import {
  ErrorMessage,
  Failable,
  WithError,
} from 'app/src-electron/schema/error';
import { GroupProgressor } from '../progress/progress';
import { sleep } from 'app/src-electron/util/sleep';
import { api } from '../api';
import { closeServerStarterAndShutDown } from 'app/src-electron/lifecycle/exit';
import { getOpDiff } from './players';
import { includes } from 'app/src-electron/util/array';
import { asyncMap } from 'app/src-electron/util/objmap';
import { getBackUpPath, parseBackUpPath } from './backup';
import { Path } from 'app/src-electron/util/path';
import { createTar, decompressTar } from 'app/src-electron/util/tar';
import { BackupData } from 'app/src-electron/schema/filedata';
import { allocateTempDir } from '../misc/tempPath';
import { portInUse } from 'app/src-electron/util/port';
import { getWorld } from './world';
import { closeNgrok, runNgrok } from '../server/setup/ngrok';
import { ServerStartNotification } from 'app/src-electron/schema/server';
import { randomInt } from 'crypto';
import { serverPropertiesFile } from './files/properties';
import { ServerProperties } from 'app/src-electron/schema/serverproperty';
import { Listener } from '@ngrok/ngrok';
import { PromiseSpooler } from 'app/src-electron/util/promiseSpooler';


/** ワールドの(取得/保存)/サーバーの実行を担うクラス */
export class WorldHandler {
  private static worldHandlerMap: Record<WorldID, WorldHandler> = {};

  promiseSpooler: PromiseSpooler;
  name: WorldName;
  container: WorldContainer;
  id: WorldID;
  runner: RunRebootableServer | undefined;
  /** サーバーが実行中の場合のみポート番号が入る */
  port: number | undefined;

  private constructor(id: WorldID, name: WorldName, container: WorldContainer) {
    this.promiseSpooler = new PromiseSpooler();
    this.id = id;
    this.name = name;
    this.container = container;
    this.runner = undefined;
  }

  /** 起動中のワールドが一つでもあるかどうか */
  private static runningWorldExists() {
    return Object.values(WorldHandler.worldHandlerMap).some(
      (x) => x.runner !== undefined
    );
  }

  /** WorldAbbr/WorldNewができた段階でここに登録し、idを生成 */
  static register(name: WorldName, container: WorldContainer): WorldID {
    const registered = Object.entries(WorldHandler.worldHandlerMap).find(
      ([, value]) => value.container == container && value.name == name
    );
    // 既に登録済みの場合登録されたidを返す
    if (registered !== undefined) {
      return registered[0] as WorldID;
    }
    const id = genUUID() as WorldID;
    WorldHandler.worldHandlerMap[id] = new WorldHandler(id, name, container);
    return id;
  }

  // worldIDからWorldHandlerを取得する
  static get(
    id: WorldID,
    name?: WorldName,
    container?: WorldContainer
  ): Failable<WorldHandler> {
    if (!(id in WorldHandler.worldHandlerMap))
      return errorMessage.core.world.invalidWorldId({ id, container, name });
    return WorldHandler.worldHandlerMap[id];
  }

  /** 現在のワールドの保存場所を返す */
  getSavePath() {
    return worldContainerToPath(this.container).child(this.name);
  }

  /** セーブデータを移動する*/
  private async move(name: WorldName, container: WorldContainer) {
    // 現在のワールドの保存場所
    const currentPath = this.getSavePath();
    // 変更される保存先
    const targetPath = worldContainerToPath(container).child(name);

    // パスに変化がない場合はなにもしない
    if (currentPath.path === targetPath.path) return;

    // 保存ディレクトリを移動する
    await currentPath.moveTo(targetPath);

    // 保存先を変更
    this.name = name;
    this.container = container;
  }

  /** ローカルに保存されたワールド設定Jsonを読み込む */
  private async loadLocalServerJson() {
    const savePath = this.getSavePath();
    return await serverJsonFile.load(savePath);
  }

  /** ワールド設定Jsonをローカルに保存 */
  private async saveLocalServerJson(settings: WorldSettings) {
    const savePath = this.getSavePath();
    return await serverJsonFile.save(savePath, settings);
  }

  /** リモートがあるかをチェックして、ある場合はpull */
  private async pull(progress?: GroupProgressor) {
    // ローカルに保存されたワールド設定Jsonを読み込む(リモートの存在を確認するため)

    const sub = progress?.subtitle({ key: 'server.local.loadSettingFiles' });
    const worldSettings = await this.loadLocalServerJson();
    sub?.delete();

    if (isError(worldSettings)) return worldSettings;

    // リモートが存在する場合Pull
    if (worldSettings.remote) {
      const remote = worldSettings.remote;
      const savePath = this.getSavePath();

      const pull = await pullRemoteWorld(
        savePath,
        remote,
        progress?.subGroup()
      );

      // Pullに失敗した場合エラー
      if (isError(pull)) return pull;
    }
  }

  private async push(progress?: GroupProgressor) {
    // ローカルに保存されたワールド設定Jsonを読み込む(リモートの存在を確認するため)
    const prog = progress?.subtitle({ key: 'server.remote.check' });
    const worldSettings = await this.loadLocalServerJson();
    prog?.delete();

    if (isError(worldSettings)) return worldSettings;

    // リモートが存在する場合Push
    const remote = worldSettings.remote;
    if (remote) {
      const pushProgress = progress?.subGroup();

      const savePath = this.getSavePath();
      const prog = pushProgress?.subGroup();
      const push = await pushRemoteWorld(savePath, remote, prog);
      pushProgress?.delete();

      // Pushに失敗した場合エラー
      if (isError(push)) return push;
    }
  }

  private async loadLocal() {
    const savePath = this.getSavePath();
    // ローカルの設定ファイルを読み込む
    return await loadLocalFiles(savePath, this.id, this.name, this.container);
  }

  async save(
    world: WorldEdited,
    progress?: GroupProgressor
  ): Promise<WithError<Failable<World>>> {
    const func = () => this.saveExec(world, progress);
    return await this.promiseSpooler.spool(func, 'SAVE');
  }
  /** サーバーのデータを保存 */
  private async saveExec(
    world: WorldEdited,
    progress?: GroupProgressor
  ): Promise<WithError<Failable<World>>> {
    if (this.runner === undefined) {
      // 起動中に設定を反映
      return this.saveExecNonRunning(world, progress);
    } else {
      // 非起動中に設定を反映
      return this.saveExecRunning(world);
    }
  }

  /** 起動していないサーバーのデータを保存 */
  private async saveExecNonRunning(
    world: WorldEdited,
    progress?: GroupProgressor
  ): Promise<WithError<Failable<World>>> {
    const errors: ErrorMessage[] = [];

    // ワールド名に変更があった場合正常な名前かどうかを確認してワールドの保存場所を変更
    const worldNameHasChanged =
      this.container !== world.container || this.name !== world.name;
    if (worldNameHasChanged) {
      const newWorldName = await validateNewWorldName(
        world.container,
        world.name
      );
      if (isValid(newWorldName)) {
        // セーブデータを移動
        await this.move(world.name, world.container);
      } else {
        // 移動をキャンセル
        world.container = this.container;
        world.name = this.name;
        errors.push(newWorldName);
      }
    }

    const savePath = this.getSavePath();

    // リモートからpull
    const pullResult = this.pull(progress);
    if (isError(pullResult)) return withError(pullResult);

    const loadLocalServerJson = () => this.loadLocalServerJson();

    // ローカルに保存されたワールド設定Jsonを読み込む(使用中かどうかを確認するため)
    const sub = progress?.subtitle({ key: 'server.load.loadLocalSetting' });
    const worldSettings = await loadLocalServerJson();
    sub?.delete();

    if (isError(worldSettings)) return withError(worldSettings);

    // 使用中の場合、現状のデータを再読み込みして終了
    if (worldSettings.using) {
      errors.push(
        errorMessage.core.world.worldAleradyRunning({
          container: this.container,
          name: this.name,
        })
      );
      const sub = progress?.subtitle({ key: 'server.local.reloading' });
      const world = await this.loadLocal();
      sub?.delete();

      world.errors.push(...errors);
      return world;
    }

    // 変更をローカルに保存
    // additionalの解決、custum_map,remote_sourceの導入も行う
    const saveLocalFilesprogress = progress?.subtitle({
      key: 'server.save.title',
    });
    const result = await saveLocalFiles(savePath, world);
    result.errors.push(...errors);
    saveLocalFilesprogress?.delete();

    // リモートの存在を確認して存在したらpush
    const push = await this.push(progress);
    if (isError(push)) return withError(push, errors);

    return result;
  }

  /** 起動しているサーバーのデータを保存 */
  private async saveExecRunning(
    world: WorldEdited
  ): Promise<WithError<Failable<World>>> {
    const errors: ErrorMessage[] = [];

    // ワールド名に変更があった場合エラーに追加
    const worldNameHasChanged =
      this.container !== world.container || this.name !== world.name;
    if (worldNameHasChanged) {
      errors.push(
        errorMessage.core.world.cannotChangeRunningWorldName({
          container: this.container,
          name: this.name,
        })
      );
    }

    const savePath = this.getSavePath();

    // 現状のサーバー設定データ
    const current = await this.loadLocal();

    // 変更をローカルに保存
    // additionalの解決、custum_map,remote_sourceの導入も行う
    const result = await saveLocalFiles(savePath, world);
    result.errors.push(...errors);

    // リロード
    await this.runCommand('reload');

    // プレイヤー周りの設定を反映
    // TODO: どこかに実装を移動
    if (
      isValid(current.value) &&
      isValid(current.value.players) &&
      isValid(world.players)
    ) {
      const [diff, sameMember] = getOpDiff(
        current.value.players,
        world.players
      );
      // op権限レベルが0になったプレイヤーに対してdeopを実行
      await asyncMap(diff[0], (x) => this.runCommand(`deop ${x}`));

      if (isValid(current.value.properties)) {
        const opPermissionLevel =
          current.value.properties['op-permission-level'];

        if (includes([1, 2, 3, 4] as const, opPermissionLevel)) {
          const diffs = diff[opPermissionLevel];
          // op権限レベルがop-permission-levelになったプレイヤーに対してopを実行
          await asyncMap(diffs, (x) => this.runCommand(`op ${x}`));
          ([1, 2, 3, 4] as const).forEach((i) => {
            if (i !== opPermissionLevel && diff[i].length > 0) {
              errorMessage.core.world.failedChangingOp({
                users: diff[i],
                op: i,
              });
            }
          });
        }
      }
      if (!sameMember) await this.runCommand('whitelist reload');
    }

    return result;
  }

  /**
   * 前回起動時にワールドがusingのまま終了した場合に呼ぶ。
   * usingフラグを折ってPush
   */
  private async fix() {
    const local = await this.loadLocal();
    const world = local.value;
    if (isError(world)) return local;

    // フラグを折ってjsonに保存
    world.using = false;
    await serverJsonFile.save(
      this.getSavePath(),
      constructWorldSettings(world)
    );

    // リモートにpush
    const push = await this.push();
    if (isError(push)) return withError(push);

    return local;
  }

  async load(): Promise<WithError<Failable<World>>> {
    const func = () => this.loadExec();
    const r = await this.promiseSpooler.spool(func);
    return r;
  }

  /** サーバーのデータをロード(戻り値がLocalWorldResult) */
  private async loadExec(
    progress?: GroupProgressor
  ): Promise<WithError<Failable<World>>> {
    // プログレスのタイトルを設定
    progress?.title({ key: 'server.load.title' });

    // ローカルに保存されたワールド設定Jsonを読み込む(実行中フラグの確認)
    progress?.subtitle({ key: 'server.load.loadLocalSetting' });
    const worldSettings = await this.loadLocalServerJson();
    if (isError(worldSettings)) return withError(worldSettings);

    const env_id = (await getSystemSettings()).user.id;

    // プレイ中のフラグが立っている &&
    // この環境が最終利用 &&
    // 現在起動中でない場合
    // (前回の起動時に正常にサーバーが終了しなかった場合)
    if (
      worldSettings.using === true &&
      worldSettings.last_id === env_id &&
      this.runner === undefined
    ) {
      // フラグを折ってPush
      progress?.subtitle({ key: 'server.remote.fixing' });
      return await this.fix();
    }
    // リモートからpull
    const group = progress?.subGroup();
    const pullResult = await this.pull(group);
    group?.delete();
    if (isError(pullResult)) return withError(pullResult);

    // ローカルデータをロード
    const result = await this.loadLocal();

    return result;
  }

  async create(world: WorldEdited): Promise<WithError<Failable<World>>> {
    const func = () => this.createExec(world);
    return await this.promiseSpooler.spool(func);
  }

  /** サーバーのデータを新規作成して保存 */
  private async createExec(
    world: WorldEdited
  ): Promise<WithError<Failable<World>>> {
    this.container = world.container;
    this.name = world.name;
    const savePath = this.getSavePath();

    const errors: ErrorMessage[] = [];

    // ワールド名が使用不能だった場合(たぶん起こらない)
    const worldNameValidated = validateNewWorldName(
      world.container,
      world.name
    );
    if (isError(worldNameValidated)) {
      return withError(worldNameValidated, errors);
    }

    // 保存先ディレクトリを作成
    await savePath.mkdir(true);

    // ワールド設定Jsonをローカルに保存(これがないとエラーが出るため)
    const worldSettings = constructWorldSettings(world);
    // リモートの設定だけは消しておく(存在しないブランチからPullしないように)
    // 新規作成時にPull元を指定する場合はworld.remote_sourceを指定することで可能
    delete worldSettings.remote;
    await this.saveLocalServerJson(worldSettings);

    // ワールドの最終プレイを現在時刻に
    world.last_date = getCurrentTimestamp()

    // データを保存
    return await this.saveExec(world);
  }

  async delete(): Promise<WithError<Failable<undefined>>> {
    const func = () => this.deleteExec();
    return await this.promiseSpooler.spool(func);
  }

  /** ワールドを削除(リモ－トは削除しない) */
  private async deleteExec(): Promise<WithError<Failable<undefined>>> {
    const result = await failabilify(() => this.getSavePath().remove())();
    if (isError(result)) return withError(result);

    delete WorldHandler.worldHandlerMap[this.id];
    return withError(undefined);
  }

  /** ワールドを複製 */
  async duplicate(name?: WorldName): Promise<WithError<Failable<World>>> {
    const func = () => this.duplicateExec(name);
    return await this.promiseSpooler.spool(func);
  }

  /** ワールドを複製 */
  private async duplicateExec(
    name?: WorldName
  ): Promise<WithError<Failable<World>>> {
    // 実行中は複製できない
    if (this.runner !== undefined) {
      return withError(
        errorMessage.core.world.cannotDuplicateRunningWorld({
          container: this.container,
          name: this.name,
        })
      );
    }

    // 複製先のワールドの名前を設定
    const newName =
      name ?? (await getDuplicateWorldName(this.container, this.name));

    // WorldIDを取得
    const newId = WorldHandler.register(newName, this.container);

    // ワールド設定ファイルの内容を読み込む
    const worldSettings = await this.loadLocalServerJson();
    if (isError(worldSettings)) return withError(worldSettings);

    // リモートの情報を削除
    worldSettings.remote = undefined;
    // 使用中フラグを削除
    worldSettings.using = false;

    const newHandler = WorldHandler.get(newId, newName, this.container);
    if (isError(newHandler)) throw new Error();

    await this.getSavePath().copyTo(newHandler.getSavePath());

    // 設定ファイルを上書き
    await newHandler.saveLocalServerJson(worldSettings);

    return await newHandler.load();
  }

  /** ワールドをバックアップ */
  async backup(): Promise<WithError<Failable<BackupData>>> {
    const func = () => this.backupExec();
    return await this.promiseSpooler.spool(func);
  }

  /** ワールドをバックアップ */
  private async backupExec(): Promise<WithError<Failable<BackupData>>> {
    const backupPath = getBackUpPath(this.container, this.name);

    // リモートのデータを一時的に削除
    const localJson = await this.loadLocalServerJson();
    if (isError(localJson)) return withError(localJson);
    const remote = localJson.remote;
    delete localJson.remote;
    await this.saveLocalServerJson(localJson);
    localJson.remote = remote;

    // tarファイルを生成
    const tar = await createTar(this.getSavePath(), true);

    // リモートのデータを復旧
    await this.saveLocalServerJson(localJson);

    if (isError(tar)) return withError(tar);

    // tarファイルを保存
    await backupPath.write(tar);

    // バックアップデータを返却
    return withError(await parseBackUpPath(backupPath));
  }

  /** ワールドにバックアップを復元 */
  async restore(backup: BackupData): Promise<WithError<Failable<World>>> {
    const func = () => this.restoreExec(backup);
    return await this.promiseSpooler.spool(func);
  }

  /** ワールドにバックアップを復元 */
  private async restoreExec(
    backup: BackupData
  ): Promise<WithError<Failable<World>>> {
    const beforeLocalJson = await this.loadLocalServerJson();
    if (isError(beforeLocalJson)) return withError(beforeLocalJson);
    const remote = beforeLocalJson.remote;

    const tarPath = new Path(backup.path);
    if (!tarPath.exists()) {
      return withError(
        errorMessage.data.path.notFound({
          type: 'file',
          path: backup.path,
        })
      );
    }
    const savePath = this.getSavePath();

    // 展開先の一時フォルダ
    const tempDir = await allocateTempDir();

    // tarファイルを展開
    const decompressResult = await decompressTar(tarPath, tempDir);

    // 展開に失敗した場合
    if (isError(decompressResult)) {
      // 一時フォルダを削除
      await tempDir.remove();
      return withError(decompressResult);
    }
    const afterLocalJson = await serverJsonFile.load(tempDir);
    // Jsonの読み込みに失敗した場合
    if (isError(afterLocalJson)) {
      // 一時フォルダを削除
      await tempDir.remove();
      return withError(afterLocalJson);
    }

    // 一時フォルダの中身をこのパスに移動
    await savePath.remove();
    await tempDir.moveTo(savePath);
    await tempDir.remove();

    // remoteをrestore前のデータで上書き
    afterLocalJson.remote = remote;
    await this.saveLocalServerJson(afterLocalJson);

    return this.loadExec();
  }

  /** すべてのサーバーが終了した場合のみシャットダウン */
  private async shutdown() {
    // TODO: この実装ひどい
    await sleep(1);

    // 他のサーバーが実行中の時何もせずに終了
    if (WorldHandler.runningWorldExists()) return;

    // autoShutDown:false の時何もせずに終了
    const sys = await getSystemSettings();
    if (!sys.user.autoShutDown) return;

    // フロントエンドにシャットダウンするかどうかを問い合わせる
    const doShutDown = await api.invoke.CheckShutdown();

    // シャットダウンがキャンセルされた時何もせずに終了
    if (!doShutDown) return;

    // アプリケーションを終了
    closeServerStarterAndShutDown();
  }

  async run(progress: GroupProgressor): Promise<WithError<Failable<World>>> {
    const result = await this.runExec(progress);

    // サーバーの実行に成功した場合のみシャットダウン(シャットダウンしないこともある)
    if (isValid(result)) this.shutdown();

    return result;
  }

  private async checkPortAvailability(port: number): Promise<boolean> {
    // ポートが使用中か確認
    let portIsUsed = await portInUse(port);

    // サーバーランナーの中で同じポートを使用しているものがないか確認
    portIsUsed ||= Object.values(WorldHandler.worldHandlerMap).some(
      (x) => x.port === port
    );

    return !portIsUsed
  }

  /**
   * 使用可能なポート(1024–49151)を探す
   * 100回乱数でトライして、見つからなかった場合はエラー
   */
  private async getFreePort(): Promise<Failable<number>> {
    let port = 1024
    for (let i = 0; i < 100; i++) {
      port = randomInt(1024, 49152)
      if (await this.checkPortAvailability(port)) return port;
    }
    return errorMessage.core.world.serverPortIsUsed({
      port,
    })
  }

  /**
   * 使用ポートを決定
   */
  private async definePortNumber(beforeWorld: World): Promise<Failable<number>> {
    if (beforeWorld.ngrok_setting.use_ngrok) {
      // Ngrokを使用する場合 開いてるポートを適当に使う
      const portnum = await this.getFreePort()
      if (isError(portnum)) return portnum
      return portnum
    }
    else {
      // Ngrokを使用しない場合 ポートが空いてるかチェック
      let port = 25565;
      if (isValid(beforeWorld.properties)) {
        const serverPort = beforeWorld.properties['server-port'];
        if (typeof serverPort === 'number') port = serverPort;
      }

      const portIsUsed = !await this.checkPortAvailability(port)

      if (portIsUsed) {
        errorMessage.core.world.serverPortIsUsed({
          port,
        })
      }
      return port
    }
  }

  /** データを同期して サーバーを起動 */
  private async runExec(
    progress: GroupProgressor
  ): Promise<WithError<Failable<World>>> {
    const beforeTitle = progress.title({
      key: 'server.run.before.title',
    });
    const errors: ErrorMessage[] = [];

    // 起動中の場合エラー
    if (this.runner !== undefined)
      return withError(
        errorMessage.core.world.worldAleradyRunning({
          container: this.container,
          name: this.name,
        })
      );

    // ワールド情報をリモートから取得
    const loadResult = await this.loadExec(progress);

    // 取得に失敗したらエラー
    if (isError(loadResult.value)) return loadResult;

    errors.push(...loadResult.errors);

    /** ワールド起動直前のワールド設定 */
    const beforeWorld = loadResult.value;

    // serverstarterの実行者UUID
    const sysSettings = await getSystemSettings();

    // 起動している場合エラー
    if (beforeWorld.using)
      return withError(
        errorMessage.core.world.worldAleradyRunning({
          container: this.container,
          name: this.name,
          owner: beforeWorld.last_user,
        }),
        errors
      );

    const settings = constructWorldSettings(beforeWorld);
    const savePath = this.getSavePath();

    // ポート番号を取得
    const port = await this.definePortNumber(beforeWorld)
    if (isError(port)) return withError(port, errors)

    // 実行時のサーバープロパティ(ポートだけ違う)
    const execServerProperties: ServerProperties = { ... (isError(beforeWorld.properties) ? {} : beforeWorld.properties) }
    const beforeServerPort = execServerProperties['server-port']
    const beforeQueryport = execServerProperties['query.port']

    execServerProperties['server-port'] = port
    execServerProperties['query.port'] = port
    serverPropertiesFile.save(savePath, execServerProperties)

    // ポートを登録
    this.port = port;
    // ngrokが必要な場合は起動
    const ngrokListener = await readyNgrok(this.id, port)
    if (isError(ngrokListener)) return withError(ngrokListener);

    // 使用中フラグを立てて保存
    // 使用中フラグを折って保存を試みる (無理なら諦める)
    settings.using = true;
    settings.last_user = sysSettings.user.owner;
    settings.last_date = getCurrentTimestamp();
    settings.last_id = sysSettings.user.id;
    const sub = progress.subtitle({ key: 'server.local.savingSettingFiles' });
    await serverJsonFile.save(savePath, settings);
    sub.delete();

    // pushを実行 TODO: 失敗時の処理
    await this.push(progress);

    // pluginとvanillaでファイル構造を切り替える
    const directoryFormatResult = await formatWorldDirectory(
      savePath,
      settings.version,
      progress
    );
    errors.push(...directoryFormatResult.errors);


    const notification: ServerStartNotification = { port }

    const ngrokURL = ngrokListener?.url()
    if (ngrokURL) notification.ngrokURL = ngrokURL.slice(6)

    // サーバーの実行を開始
    const runPromise = runRebootableServer(
      savePath,
      this.id,
      settings,
      progress,
      notification
    );

    this.runner = runPromise;

    beforeTitle.delete();

    // サーバーの終了を待機
    const serverResult = await runPromise;

    // ポートを削除
    this.port = undefined;
    // Ngrokを閉じる
    if (ngrokListener) await closeNgrok(ngrokListener)

    this.runner = undefined;

    progress.title({
      key: 'server.run.after.title',
    });

    // ワールドの最終プレイを現在時刻に
    settings.last_date = getCurrentTimestamp()

    // 使用中フラグを折って保存を試みる (無理なら諦める)
    settings.using = false;
    beforeWorld.last_date = getCurrentTimestamp();
    const saveSub = progress.subtitle({ key: 'server.save.localSetting' });
    await serverJsonFile.save(savePath, settings);
    saveSub.delete();

    // pushを実行
    await this.push(progress);

    // サーバーの実行が失敗していたらエラー
    if (isError(serverResult)) return withError(serverResult);

    // ワールド情報を再取得
    const afterWorld = await this.loadExec(progress);

    // ポート番号を復元
    if (isValid(afterWorld.value) && isValid(afterWorld.value.properties)) {
      afterWorld.value.properties["server-port"] = beforeServerPort
      afterWorld.value.properties["query.port"] = beforeQueryport
      // プロパティを保存
      serverPropertiesFile.save(savePath, afterWorld.value.properties)
    }

    return afterWorld
  }

  /** コマンドを実行 */
  async runCommand(command: string) {
    // コマンドが"/"で始まった場合"/"を削除
    if (command.startsWith('/')) command = command.slice(1);
    await this.runner?.runCommand(command);
  }

  /** サーバーを再起動 */
  async reboot() {
    await this.runner?.reboot();
  }
}

/** 複製する際のワールド名を取得 */
async function getDuplicateWorldName(
  container: WorldContainer,
  name: WorldName
) {
  let baseName: string = name;
  const match = name.match(/^(.*)_\d+$/);
  if (match !== null) {
    baseName = match[1];
  }

  let worldName: string = baseName;
  let result = await validateNewWorldName(container, worldName);
  let i = 1;
  while (isError(result)) {
    worldName = `${baseName}_${i}`;
    i += 1;
    result = await validateNewWorldName(container, worldName);
  }
  return result;
}


/** 
 * Ngrokを利用する場合の処理
 * 
 * Ngrokを利用する場合はlistenerを返す
 * Ngrokを利用しない場合はundefinedを返す
 */
async function readyNgrok(worldID: WorldID, port: number): Promise<Failable<Listener | undefined>> {
  const systemSettings = await getSystemSettings();
  const token = systemSettings.user.ngrokToken ?? '';

  // 各ワールドに設定されたUseNgrokの値に応じてNgrokの実行有無を制御
  const world = await getWorld(worldID);
  if (isError(world.value)) return world.value;

  if (token !== '' && world.value.ngrok_setting.use_ngrok) {
    const listener = runNgrok(token, port, world.value.ngrok_setting.remote_addr);
    return listener;
  }

  return undefined
}