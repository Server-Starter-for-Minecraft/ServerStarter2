import { markRaw } from 'vue';
import {
  AnsiStyle,
  ConsoleData,
  MatchResult,
  StyledText,
} from 'app/src/schema/console';
import { parseAnsi, pushStyledText, splitIncompleteEscape } from './ansi';

/** 出力先（標準出力・標準エラー出力）ごとに引き継ぐ解釈状態 */
type StreamState = {
  /** 直前の出力の末尾時点で有効な装飾 */
  style: AnsiStyle;
  /** 直前の出力の末尾で途切れていたエスケープシーケンス */
  pending: string;
};

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
  /** 標準出力と標準エラー出力は独立して届くため、それぞれの解釈状態を別々に引き継ぐ */
  private streams: Record<'out' | 'err', StreamState> = {
    out: { style: {}, pending: '' },
    err: { style: {}, pending: '' },
  };

  /**
   * コンソールの行一覧にサーバーからの出力を追加する
   *
   * 1回の出力を1つの行データとして追加する（複数行を含む場合がある）。
   * ただし、同じ出力先の直前の出力が行の途中で終わっている場合は、端末と同様にその行の続きとして扱う。
   * - 改行されていない行に続く出力は、直前の行データに結合する
   * - \rで行頭に戻った後の出力は、直前の行データの最終行を上書きする
   *   （プログレスバーのように同じ行を書き換え続ける出力が、1行ずつ追加されないようにする）
   *
   * @param lines コンソールの行一覧（直接更新する）
   * @param raw サーバーから受け取った出力
   * @param isError 標準エラー出力か
   */
  append(lines: ConsoleData[], raw: string, isError: boolean) {
    const state = this.streams[isError ? 'err' : 'out'];
    const { complete, pending } = splitIncompleteEscape(state.pending + raw);
    state.pending = pending;
    let text = complete;
    if (text === '') return;

    const lastIdx = lines.length - 1;
    /** 直前の行データが、同じ出力先の改行されていない行で終わっているか */
    const continuesLine = () => {
      const last = lines[lastIdx];
      return (
        last !== undefined &&
        last.isError === isError &&
        !last.chunk.endsWith('\n')
      );
    };

    // CRLFの改行コードが出力の境界で分割された場合は、直前の行の改行として扱う
    const prev = lines[lastIdx];
    if (continuesLine() && prev.overwritable && text.startsWith('\n')) {
      lines[lastIdx] = toConsoleData(
        [...(prev.segments ?? []), { text: '\n', style: {} }],
        isError,
        false
      );
      text = text.slice(1);
      if (text === '') return;
    }

    const { segments, endStyle } = parseAnsi(text, state.style);
    state.style = endStyle;

    if (!continuesLine()) {
      const screen = applyCarriageReturn(segments);
      lines.push(
        toConsoleData(screen.segments, isError, screen.endsWithCarriageReturn)
      );
      return;
    }

    // 改行済みの行はそのまま残し、最終行と新しい出力のみを処理する
    // （\rで行頭に戻っている場合は、最終行を新しい出力で上書きする）
    const current = lines[lastIdx];
    const [completed, lastLine] = splitLastLine(current.segments ?? []);
    const screen = applyCarriageReturn([
      ...(current.overwritable ? [] : lastLine),
      ...segments,
    ]);
    lines[lastIdx] = toConsoleData(
      [...completed, ...screen.segments],
      isError,
      screen.endsWithCarriageReturn
    );
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
  /** resultに含まれる文字数 */
  let length = 0;
  /** 現在の行の開始位置（resultにおける文字数） */
  let lineStart = 0;

  /** 表示する文字列を追加する */
  const write = (part: string, style: AnsiStyle) => {
    if (part === '') return;
    pushStyledText(result, part, style);
    const newline = part.lastIndexOf('\n');
    if (newline >= 0) lineStart = length + newline + 1;
    length += part.length;
  };

  let offset = 0;
  for (const seg of segments) {
    let start = 0;
    for (
      let cr = seg.text.indexOf('\r');
      cr >= 0;
      cr = seg.text.indexOf('\r', cr + 1)
    ) {
      write(seg.text.slice(start, cr), seg.style);
      start = cr + 1;

      // CRLFの\rと、末尾の\r（次の出力で上書きされるまで現在の内容を表示し続ける）は無視する
      const idx = offset + cr;
      if (text[idx + 1] === '\n' || idx === text.length - 1) continue;

      // 行頭に戻る（現在の行の内容を取り除く）
      truncate(result, lineStart);
      length = lineStart;
    }
    write(seg.text.slice(start), seg.style);
    offset += seg.text.length;
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

/**
 * 装飾付きテキストを、改行済みの行と最終行（改行で終わっていない行）に分ける
 *
 * @returns [改行済みの行, 最終行]
 */
function splitLastLine(segments: StyledText[]): [StyledText[], StyledText[]] {
  const cut =
    segments
      .map((s) => s.text)
      .join('')
      .lastIndexOf('\n') + 1;
  const completed: StyledText[] = [];
  const lastLine: StyledText[] = [];
  let pos = 0;
  for (const seg of segments) {
    const end = pos + seg.text.length;
    if (end <= cut) completed.push(seg);
    else if (pos >= cut) lastLine.push(seg);
    else {
      completed.push({ ...seg, text: seg.text.slice(0, cut - pos) });
      lastLine.push({ ...seg, text: seg.text.slice(cut - pos) });
    }
    pos = end;
  }
  return [completed, lastLine];
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
