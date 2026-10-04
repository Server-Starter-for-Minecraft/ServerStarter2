import dayjs, { type Dayjs } from 'dayjs';
import { ConsoleOutput } from 'app/src-electron/schema/console';
import { Failable } from 'app/src-electron/schema/error';
import { trimAnsi } from 'app/src-electron/util/ansi';
import { AwaitOnce } from 'app/src-electron/util/awaitOnce';
import { gzip } from 'app/src-electron/util/binary/archive/gz';
import { Path } from 'app/src-electron/util/binary/path';
import { isError } from 'app/src-electron/util/error/error';
import { genUUID } from 'app/src-electron/util/random/uuid';
import { allocateTempDir } from 'app/src-electron/util/tempPath';

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
   */
  async archive() {
    // 出力ごとのログはlatest.logを表示するためのものであり、アーカイブしたログは表示しないため削除する
    await this.LatestOutputsPath.remove();

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

  private get LatestOutputsPath() {
    return this.logsPath.child('latest.console.jsonl');
  }

  private getArchivePath(date: Dayjs) {
    const base = date.format('YYYY-MM-DD');
    let i = 1;
    let path = this.logsPath.child(`${base}-${i}.log.gz`);
    while (path.exists()) path = this.logsPath.child(`${base}-${++i}.log.gz`);
    return path;
  }

  /**
   * 一時記録用のログファイルにサーバーのコンソールへの1回分の出力を追記
   *
   * ログへの書き込みに問題が生じてもユーザーには問題がないため，appendTextのエラーは通知しない
   *
   * @param output サーバーのコンソールへの出力（ANSIエスケープシーケンスを含んだまま渡す）
   */
  append(output: ConsoleOutput) {
    // 出力された順に書き込み、flash時に書き込みの完了を待てるよう保持する
    // （一時フォルダの確保などに失敗しても以降の出力は記録できるよう、失敗は無視する）
    this.writing = this.writing
      .then(async () => {
        const tmp = await this.tempPaths.get();
        await Promise.all([
          tmp.text.appendText(trimAnsi(output.text)),
          tmp.outputs.appendText(`${JSON.stringify(output)}\n`),
        ]);
      })
      .catch(() => undefined);
    return this.writing;
  }

  /**
   * latest.logを削除し、一時記録用のログファイルの内容をlatest.logとする
   */
  async flash() {
    // 終了直前の出力も含めるため、書き込み中の出力を待つ
    await this.writing;
    const tmp = await this.tempPaths.get();
    if (!tmp.text.exists()) return;

    const latest = this.LatestLogPath;

    if (!latest.exists()) {
      await latest.remove();
    }

    await tmp.text.moveTo(latest);
    await tmp.outputs.moveTo(this.LatestOutputsPath);
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

    if (this.LatestOutputsPath.exists()) {
      const outputs = await this.LatestOutputsPath.readText();
      if (!isError(outputs)) {
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
    try {
      const parsed = ConsoleOutput.safeParse(JSON.parse(line));
      return parsed.success ? [parsed.data] : [];
    } catch {
      return [];
    }
  });
}
