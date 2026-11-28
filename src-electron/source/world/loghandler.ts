import { type Dayjs } from 'dayjs';
import { ConsoleOutput } from 'app/src-electron/schema/console';
import { Failable } from 'app/src-electron/schema/error';
import { trimAnsi } from 'app/src-electron/util/ansi';
import { AwaitOnce } from 'app/src-electron/util/awaitOnce';
import { gzip } from 'app/src-electron/util/binary/archive/gz';
import { Path } from 'app/src-electron/util/binary/path';
import { isError } from 'app/src-electron/util/error/error';
import { safeExec, safeExecAsync } from 'app/src-electron/util/error/failable';
import { ignoreError } from 'app/src-electron/util/error/ignore';
import { genUUID } from 'app/src-electron/util/random/uuid';
import { allocateTempDir } from 'app/src-electron/util/tempPath';
import { sourceLoggers } from '../sourceLogger';

const loggers = () => sourceLoggers().world.log;

// 起動中のログに関する処理
const dirGetter = new AwaitOnce(allocateTempDir);

/** 起動中に記録するログの一時ファイル */
type TempLogPaths = {
  /** latest.logとなる、ANSIエスケープシーケンスを除いたテキストのログ */
  text: Path;
  /** latest.console.jsonlとなる、出力ごとの内容を記録したログ */
  outputs: Path;
};

/**
 * ワールドのログを管理する
 *
 * ログは次の2種類を対にして保存する
 * - latest.log : エディタ等で読むための、ANSIエスケープシーケンスを除いたテキスト
 * - latest.console.jsonl : 文字色・標準エラー出力の区別・出力の区切りを含めてGUIでの表示を再現するための、
 *   出力ごとの内容（{@link ConsoleOutput}）を1行ずつJSONで記録したもの
 */
export class WorldLogHandler {
  /** ワールドのlogsフォルダ */
  logsPath: Path;
  /** 起動中に記録するログの一時ファイル（初回の書き込み時に確保する） */
  tempPaths: AwaitOnce<TempLogPaths>;
  /** 一時記録用のログファイルへの書き込み中の処理 */
  private writing: Promise<void> = Promise.resolve();

  constructor(worldPath: Path) {
    this.logsPath = worldPath.child('logs');
    this.tempPaths = new AwaitOnce(async () => {
      const dir = await dirGetter.get();
      const id = genUUID();
      return {
        text: dir.child(`${id}.log`),
        outputs: dir.child(`${id}.console.jsonl`),
      };
    });
  }

  /**
   * 現状のlatest.logをアーカイブ化する(存在する場合)
   *
   * Failの可能性があるが，latest.logのアーカイブ成否はユーザーの実行に問題にならないため通知しない
   * （失敗はログに残す）
   */
  async archive() {
    const archived = await this.archiveExec();
    if (isError(archived)) loggers().archive().warn(archived);
  }

  private async archiveExec(): Promise<Failable<void>> {
    // 出力ごとのログはlatest.logを表示するためのものであり、アーカイブしたログは表示しないため削除する
    const removedOutputs = await this.LatestOutputsPath.remove();
    if (isError(removedOutputs)) return removedOutputs;

    const latestPath = this.LatestLogPath;
    if (!(await latestPath.exists())) return;
    const gz = await gzip.fromFile(latestPath);
    if (isError(gz)) return gz;

    const date = await latestPath.lastUpdateTime();
    const written = await (await this.getArchivePath(date)).write(gz);
    if (isError(written)) return written;
    return latestPath.remove();
  }

  private get LatestLogPath() {
    return this.logsPath.child('latest.log');
  }

  private get LatestOutputsPath() {
    return this.logsPath.child('latest.console.jsonl');
  }

  private async getArchivePath(date: Dayjs): Promise<Path> {
    const base = date.format('YYYY-MM-DD');
    let i = 1;
    let path = this.logsPath.child(`${base}-${i}.log.gz`);
    while (await path.exists())
      path = this.logsPath.child(`${base}-${++i}.log.gz`);
    return path;
  }

  /**
   * 一時記録用のログファイルにサーバーのコンソールへの1回分の出力を追記
   *
   * ログへの書き込みに問題が生じてもユーザーには問題がないため，appendTextのエラーは通知しない
   *
   * @param output サーバーのコンソールへの出力（ANSIエスケープシーケンスを含んだまま渡す）
   */
  async append(output: ConsoleOutput) {
    // 出力された順に書き込み、flash時に書き込みの完了を待てるよう保持する
    // （一時フォルダの確保などに失敗しても以降の出力は記録できるよう，失敗しても待機列は止めない）
    this.writing = this.writing.then(async () => {
      const written = await safeExecAsync(async () => {
        const tmp = await this.tempPaths.get();
        const results = await Promise.all([
          tmp.text.appendText(trimAnsi(output.text)),
          tmp.outputs.appendText(`${JSON.stringify(output)}\n`),
        ]);
        return results.find(isError);
      });
      if (isError(written)) {
        // 出力のたびにログを残すとログが増えすぎるため，記録の失敗は詳細のログ（debug）に留める
        ignoreError(
          written,
          'コンソールの出力の記録の失敗は，サーバーの実行に影響しない'
        );
      }
    });
    return this.writing;
  }

  /**
   * latest.logを削除し、一時記録用のログファイルの内容をlatest.logとする
   */
  async flash() {
    // 終了直前の出力も含めるため、書き込み中の出力を待つ
    await this.writing;
    const tmp = await this.tempPaths.get();
    if (!(await tmp.text.exists())) return;

    // 移動先（latest.log）に既存のファイルがある場合は，moveTo が置き換える
    const movedText = await tmp.text.moveTo(this.LatestLogPath);
    if (isError(movedText)) {
      loggers().flash().warn(movedText);
      return;
    }
    const movedOutputs = await tmp.outputs.moveTo(this.LatestOutputsPath);
    if (isError(movedOutputs)) loggers().flash().warn(movedOutputs);
  }

  /**
   * 最新のログを、GUIで表示するための出力ごとの内容として取得
   *
   * 出力ごとのログがlatest.logと対応しない場合（以前のバージョンで記録したログや、
   * 本アプリ以外から起動してlatest.logのみが更新された場合など）は、latest.logの各行を1回分の出力とみなす
   *
   * @returns サーバーのコンソールへの出力を、出力された順に並べたもの
   */
  async loadLatest(): Promise<Failable<ConsoleOutput[]>> {
    const content = await this.LatestLogPath.readText();
    if (isError(content)) return content;

    if (await this.LatestOutputsPath.exists()) {
      const outputs = await this.LatestOutputsPath.readText();
      if (isError(outputs)) {
        ignoreError(
          outputs,
          '出力ごとのログが読めない場合は latest.log の各行を表示する'
        );
      } else {
        const parsed = parseOutputs(outputs);
        // latest.logと同じ内容を記録したものである場合のみ利用する
        if (parsed.map((o) => trimAnsi(o.text)).join('') === content)
          return parsed;
      }
    }

    // 改行を含めて1行ずつに分ける（末尾の改行の後ろに空行は作らない）
    const lines = content.match(/[^\n]*\n|[^\n]+$/g) ?? [];
    return lines.map((text) => ({ text, isError: false }));
  }
}

/**
 * 出力ごとのログの内容を解釈する
 *
 * 書き込みが途中で途切れているなど、解釈できない行は読み飛ばす
 *
 * @param content 出力ごとの内容を1行ずつJSONで記録した文字列
 * @returns 解釈できた出力の一覧
 */
function parseOutputs(content: string): ConsoleOutput[] {
  return content.split('\n').flatMap((line) => {
    if (line.trim() === '') return [];
    const json = safeExec((): unknown => JSON.parse(line));
    if (isError(json)) {
      return ignoreError(json, '書き込みが途中で途切れた行は読み飛ばす') ?? [];
    }
    const parsed = ConsoleOutput.safeParse(json);
    return parsed.success ? [parsed.data] : [];
  });
}
