import {
  AnsiStyle,
  ConsoleData,
  MatchResult,
  StyledText,
} from 'app/src/schema/console';
import { parseAnsi } from './ansi';

/**
 * サーバーから受け取った出力をコンソールに表示する行データに変換する
 *
 * - ANSIエスケープシーケンスを装飾情報（segments）に変換し、表示文字列（chunk）からは取り除く
 * - 行中の復帰文字（\r）以降で行頭から上書きする（プログレスバーなどの表示）
 *
 * @param raw サーバーから受け取った出力（複数行を含む場合がある）
 * @param isError 標準エラー出力か
 * @returns コンソールに表示する行データ
 */
export function toConsoleData(raw: string, isError: boolean): ConsoleData {
  const lines = raw.replace(/\r\n/g, '\n').split('\n').map(applyCarriageReturn);
  const segments: StyledText[] = [];
  let style: AnsiStyle = {};
  lines.forEach((line, idx) => {
    // 改行をまたいで装飾が引き継がれるように、直前の行の最終的な装飾を引き継ぐ
    const parsed = parseAnsi(idx === 0 ? line : `\n${line}`, style);
    segments.push(...parsed);
    style = parsed[parsed.length - 1]?.style ?? style;
  });
  return {
    chunk: segments.map((s) => s.text).join(''),
    isError,
    segments: mergeSameStyle(segments),
  };
}

/**
 * コンソールの行一覧にサーバーからの出力を追加する
 *
 * 端末での表示と同様に、復帰文字（\r）で終わる出力の次の出力や、
 * 改行で終わっていない行に続く\rで始まる出力は、直前の行を上書きする。
 * （プログレスバーのように同じ行を書き換え続ける出力が、1行ずつ追加されないようにする）
 *
 * @param lines コンソールの行一覧（直接更新する）
 * @param raw サーバーから受け取った出力
 * @param isError 標準エラー出力か
 */
export function appendConsoleOutput(
  lines: ConsoleData[],
  raw: string,
  isError: boolean
) {
  if (raw === '') return;

  const prev = lines[lines.length - 1];
  const startsWithCarriageReturn =
    raw.startsWith('\r') && !raw.startsWith('\r\n');
  const overwrite =
    prev !== undefined &&
    (prev.overwritable ||
      (startsWithCarriageReturn && !prev.chunk.endsWith('\n')));

  const data = toConsoleData(raw, isError);
  // 改行を伴わない\rで終わる出力は、次の出力で上書きされる
  data.overwritable = /\r$/.test(raw) && !/\r\n$/.test(raw);

  if (overwrite) lines[lines.length - 1] = data;
  else lines.push(data);
}

/**
 * 行中に復帰文字（\r）がある場合は、最後の\r以降の文字列を返す
 *
 * プログレスバーなどは\rで行頭に戻って行全体を書き直すため、最後に書き込まれた内容のみを表示する。
 * 末尾の\rは次の出力で上書きされることを示すため、ここでは無視する。
 */
function applyCarriageReturn(line: string): string {
  const parts = line.replace(/\r+$/, '').split('\r');
  return parts[parts.length - 1];
}

/** 隣り合う同じ装飾の断片を結合する */
function mergeSameStyle(segments: StyledText[]): StyledText[] {
  const result: StyledText[] = [];
  for (const seg of segments) {
    const prev = result[result.length - 1];
    if (prev && JSON.stringify(prev.style) === JSON.stringify(seg.style))
      prev.text += seg.text;
    else result.push({ text: seg.text, style: { ...seg.style } });
  }
  return result;
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
