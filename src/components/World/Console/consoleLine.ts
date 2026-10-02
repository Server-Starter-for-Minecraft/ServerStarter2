import { markRaw } from 'vue';
import {
  AnsiStyle,
  ConsoleData,
  MatchResult,
  StyledText,
} from 'app/src/schema/console';
import { parseAnsi, pushStyledText, splitIncompleteEscape } from './ansi';

/**
 * サーバーの出力を、端末と同様の表示になるようにコンソールの行データへ反映する
 *
 * サーバーの出力は任意の位置で分割されて届くため、出力をまたいで以下の状態を引き継ぐ。
 * ワールド（コンソール）ごとにインスタンスを用意して利用する。
 *
 * - 文字色などの装飾（一度指定された装飾はリセットされるまで有効）
 * - 出力の末尾で途切れたエスケープシーケンス
 * - 復帰文字（\r）による行頭への移動（次の出力で最終行を上書きする）
 */
export class ConsoleOutputParser {
  /** 直前の出力の末尾時点で有効な装飾 */
  private style: AnsiStyle = {};
  /** 直前の出力の末尾で途切れていたエスケープシーケンス */
  private pending = '';

  /**
   * コンソールの行一覧にサーバーからの出力を追加する
   *
   * 1回の出力を1つの行データとして追加する（複数行を含む場合がある）。
   * ただし、直前の出力が行の途中で終わっている場合は、端末と同様にその行の続きとして扱う。
   * - 改行されていない行に続く出力は、直前の行データに結合する
   * - \rで行頭に戻った後の出力は、直前の行データの最終行を上書きする
   *   （プログレスバーのように同じ行を書き換え続ける出力が、1行ずつ追加されないようにする）
   *
   * @param lines コンソールの行一覧（直接更新する）
   * @param raw サーバーから受け取った出力
   * @param isError 標準エラー出力か
   */
  append(lines: ConsoleData[], raw: string, isError: boolean) {
    const { complete, pending } = splitIncompleteEscape(this.pending + raw);
    this.pending = pending;
    let text = complete;
    if (text === '') return;

    const lastIdx = lines.length - 1;
    const prev = lines[lastIdx];
    const prevSegments = prev?.segments ?? [];

    // CRLFの改行コードが出力の境界で分割された場合は、直前の行の改行として扱う
    if (prev?.overwritable && text.startsWith('\n')) {
      lines[lastIdx] = toConsoleData(
        [...prevSegments, { text: '\n', style: {} }],
        prev.isError,
        false
      );
      text = text.slice(1);
      if (text === '') return;
    }

    const { segments, endStyle } = parseAnsi(text, this.style);
    this.style = endStyle;

    // 直前の行データの続きとして表示する部分
    // （\rで行頭に戻っている場合は、最終行を除いた改行済みの行のみ）
    const current = lines[lastIdx];
    const continues = current !== undefined && !current.chunk.endsWith('\n');
    const base = !continues
      ? []
      : current.overwritable
        ? keepCompletedLines(current.segments ?? [])
        : (current.segments ?? []);

    const screen = applyCarriageReturn([...base, ...segments]);
    const data = toConsoleData(
      screen.segments,
      isError,
      screen.endsWithCarriageReturn
    );
    if (continues) lines[lastIdx] = data;
    else lines.push(data);
  }
}

/**
 * ファイルから読み込んだログなど、1行ずつの文字列をコンソールの行データに変換する
 *
 * @param line 表示する1行分の文字列（ANSIエスケープシーケンスを含んでもよい）
 * @param isError 標準エラー出力か
 * @returns コンソールに表示する行データ
 */
export function lineToConsoleData(line: string, isError: boolean) {
  return toConsoleData(parseAnsi(line).segments, isError, false);
}

/**
 * 装飾付きテキストからコンソールの行データを生成する
 *
 * 装飾の情報は表示にのみ利用し変更しないため、リアクティブにしないことで描画時の負荷を抑える
 */
function toConsoleData(
  segments: StyledText[],
  isError: boolean,
  overwritable: boolean
): ConsoleData {
  const merged: StyledText[] = [];
  segments.forEach((s) => pushStyledText(merged, s.text, s.style));
  return {
    chunk: merged.map((s) => s.text).join(''),
    isError,
    segments: markRaw(merged),
    overwritable,
  };
}

/** 復帰文字（\r）を反映した表示内容 */
type Screen = {
  segments: StyledText[];
  /** 出力が\rで終わる（次の出力で最終行が上書きされる） */
  endsWithCarriageReturn: boolean;
};

/**
 * 装飾付きテキスト中の復帰文字（\r）を、端末と同様に行頭からの上書きとして反映する
 *
 * プログレスバーなどは\rで行頭に戻って行全体を書き直すため、\rより前の同じ行の内容は表示しない。
 * 装飾は解釈済みのため、上書きされた部分で指定された文字色も後続の文字に引き継がれる。
 * CRLFの改行コードは改行（\n）として扱う。
 */
function applyCarriageReturn(segments: StyledText[]): Screen {
  const text = segments.map((s) => s.text).join('');
  const result: StyledText[] = [];
  /** 現在の行の開始位置（resultに含まれる文字数） */
  let lineStart = 0;
  let length = 0;

  let offset = 0;
  for (const seg of segments) {
    for (let k = 0; k < seg.text.length; k++) {
      const ch = seg.text[k];
      const idx = offset++;
      if (ch !== '\r') {
        pushStyledText(result, ch, seg.style);
        length += 1;
        if (ch === '\n') lineStart = length;
      } else if (text[idx + 1] === '\n' || idx === text.length - 1) {
        // CRLFの\rは無視する
        // 末尾の\rは次の出力で上書きされるまで現在の内容を表示し続ける
      } else {
        // 行頭に戻る（現在の行の内容を取り除く）
        truncate(result, lineStart);
        length = lineStart;
      }
    }
  }

  return {
    segments: result,
    endsWithCarriageReturn: text.endsWith('\r'),
  };
}

/** 装飾付きテキストの配列を、先頭から指定した文字数までに切り詰める（直接更新する） */
function truncate(segments: StyledText[], length: number) {
  let remaining = length;
  for (let i = 0; i < segments.length; i++) {
    if (remaining <= 0) {
      segments.length = i;
      return;
    }
    if (segments[i].text.length > remaining) {
      segments[i] = {
        ...segments[i],
        text: segments[i].text.slice(0, remaining),
      };
      segments.length = i + 1;
      return;
    }
    remaining -= segments[i].text.length;
  }
}

/** 最終行（改行で終わっていない行）を取り除き、改行済みの行のみを返す */
function keepCompletedLines(segments: StyledText[]): StyledText[] {
  const text = segments.map((s) => s.text).join('');
  const kept = segments.map((s) => ({ ...s }));
  truncate(kept, text.lastIndexOf('\n') + 1);
  return kept;
}

/** 装飾と検索結果の両方を反映した表示用の断片 */
export type ConsolePiece = StyledText & { isMatch: boolean };

/**
 * 装飾付きテキストと検索結果を重ね合わせて、表示用の断片に分割する
 *
 * どちらも同じ表示文字列を分割したものであることを前提に、境界の位置で細かく分割する
 *
 * @param segments 装飾ごとに分割したテキスト
 * @param matches 検索ワードとの一致ごとに分割したテキスト
 * @returns 装飾と検索結果の一致の有無を持った断片の配列
 */
export function overlayMatches(
  segments: StyledText[],
  matches: MatchResult[]
): ConsolePiece[] {
  const pieces: ConsolePiece[] = [];
  let si = 0;
  let mi = 0;
  let sOffset = 0;
  let mOffset = 0;

  while (si < segments.length && mi < matches.length) {
    const seg = segments[si];
    const match = matches[mi];
    const len = Math.min(
      seg.text.length - sOffset,
      match.text.length - mOffset
    );
    if (len > 0) {
      pieces.push({
        text: seg.text.slice(sOffset, sOffset + len),
        style: seg.style,
        isMatch: match.isMatch,
      });
    }
    sOffset += len;
    mOffset += len;
    if (sOffset >= seg.text.length) {
      si++;
      sOffset = 0;
    }
    if (mOffset >= match.text.length) {
      mi++;
      mOffset = 0;
    }
  }
  return pieces;
}
