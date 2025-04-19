import dayjs, { Dayjs } from 'dayjs';
import { Failable } from 'app/src-electron/schema/error';
import { AwaitOnce } from 'app/src-electron/util/awaitOnce';
import { gzip } from 'app/src-electron/util/binary/archive/gz';
import { Path } from 'app/src-electron/util/binary/path';
import { isError } from 'app/src-electron/util/error/error';
import { genUUID } from 'app/src-electron/util/random/uuid';
import { allocateTempDir } from 'app/src-electron/util/tempPath';

// 起動中のログに関する処理
const dirGetter = new AwaitOnce(allocateTempDir);

export class WorldLogHandler {
  logsPath: Path;
  tempPath: AwaitOnce<Path>;

  constructor(worldPath: Path) {
    this.logsPath = worldPath.child('logs');
    this.tempPath = new AwaitOnce(async () => {
      const dir = await dirGetter.get();
      return dir.child(`${genUUID()}.log`);
    });
  }

  /**
   * 現状のlatest.logをアーカイブ化する(存在する場合)
   */
  async archive() {
    const latestPath = this.LatestLogPath;
    if (!latestPath.exists()) return;
    const gz = await gzip.fromFile(latestPath);
    if (isError(gz)) return;

    const date = await latestPath.lastUpdateTime();
    await this.getArchivePath(date).write(gz);
    await latestPath.remove();
  }

  private get LatestLogPath() {
    return this.logsPath.child('latest.log');
  }

  private getArchivePath(date: Dayjs) {
    const base = date.format('YYYY-MM-DD');
    let i = 1;
    let path = this.logsPath.child(`${base}-${i}.log.gz`);
    while (path.exists()) path = this.logsPath.child(`${base}-${++i}.log.gz`);
    return path;
  }

  /** 一時記録用のログファイルに追記 */
  async append(content: string) {
    const tmp = await this.tempPath.get();
    tmp.appendText(content);
  }

  /**
   * latest.logを削除し、一時記録用のログファイルの内容をlatest.logとする
   */
  async flash() {
    const tmp = await this.tempPath.get();
    if (!tmp.exists()) return;

    const latest = this.LatestLogPath;

    if (!latest.exists()) {
      await latest.remove();
    }

    await tmp.moveTo(latest);
  }

  /** latest.logの内容を取得 */
  async loadLatest(): Promise<Failable<string[]>> {
    const latest = this.LatestLogPath;
    const content = await latest.readText();
    if (isError(content)) return content;
    return content.split('\n');
  }
}
