/**
 * ANSIエスケープシーケンスで装飾されたコンソール出力を、表示用の装飾付きテキストに変換する
 *
 * サーバーのコンソール出力（PaperMCやMohistMCなど）には文字色などのANSIエスケープシーケンスが含まれるため、
 * SGR（Select Graphic Rendition）のみを解釈して装飾情報に変換し、それ以外の制御シーケンスは取り除く
 */
import { AnsiColor, AnsiStyle, StyledText } from 'app/src/schema/console';

/**
 * 制御シーケンスに一致する正規表現
 *
 * - CSI（ESC [ もしくは C1制御文字 0x9B に続くパラメータと終端文字）: 終端が `m` のものがSGR
 * - OSC（ESC ] ... BEL もしくは ESC \）: ウィンドウタイトル変更など
 * - 文字集合の指定（ESC ( B など）
 * - その他の2文字のエスケープシーケンス
 */
const ESCAPE_SEQUENCE =
  /(?:\u001b\[|\u009b)([0-9;:?]*)([@-~])|\u001b\][^\u0007\u001b]*(?:\u0007|\u001b\\)?|\u001b[()*+#%][0-9A-Za-z@]|\u001b[@-Z\\-_]/g;

/**
 * 文字列の末尾で途切れている（後続の出力に続きがある）エスケープシーケンスに一致する正規表現
 *
 * サーバーの出力は任意の位置で分割されて届くため、末尾の不完全なシーケンスは次の出力と結合して解釈する
 */
const INCOMPLETE_ESCAPE_AT_END =
  /(?:\u001b(?:\[[0-9;:?]*|\][^\u0007\u001b]*|[()*+#%])?|\u009b[0-9;:?]*)$/;

/** 装飾を解釈した結果 */
export type ParsedAnsi = {
  /** 装飾ごとに分割したテキスト（空文字列の断片は含まない） */
  segments: StyledText[];
  /** 文字列の末尾時点で有効な装飾（後続の出力に引き継ぐ） */
  endStyle: AnsiStyle;
};

/**
 * ANSIエスケープシーケンスを含む文字列を装飾付きテキストの配列に変換する
 *
 * @param raw サーバーから受け取った文字列
 * @param initialStyle 文字列の先頭に適用されている装飾（直前の出力から引き継ぐ装飾）
 * @returns 装飾ごとに分割したテキストと、末尾時点の装飾
 */
export function parseAnsi(
  raw: string,
  initialStyle: AnsiStyle = {}
): ParsedAnsi {
  const segments: StyledText[] = [];
  let style: AnsiStyle = { ...initialStyle };
  let lastIndex = 0;

  for (const match of raw.matchAll(ESCAPE_SEQUENCE)) {
    pushStyledText(segments, raw.slice(lastIndex, match.index), style);
    lastIndex = match.index + match[0].length;

    // SGR以外の制御シーケンスは表示に影響させずに取り除く
    if (match[2] === 'm') style = applySgr(style, match[1]);
  }
  pushStyledText(segments, raw.slice(lastIndex), style);

  return { segments, endStyle: style };
}

/**
 * 文字列を末尾の不完全なエスケープシーケンスとそれ以外に分ける
 *
 * @param raw サーバーから受け取った文字列
 * @returns 解釈できる部分（complete）と、次の出力と結合して解釈する部分（pending）
 */
export function splitIncompleteEscape(raw: string): {
  complete: string;
  pending: string;
} {
  const match = raw.match(INCOMPLETE_ESCAPE_AT_END);
  if (!match || match[0] === '') return { complete: raw, pending: '' };
  return { complete: raw.slice(0, match.index), pending: match[0] };
}

/**
 * 装飾付きテキストの配列の末尾にテキストを追加する（直前と同じ装飾の場合は結合する）
 *
 * @param segments 追加先の配列（直接更新する）
 * @param text 追加するテキスト
 * @param style 追加するテキストの装飾
 */
export function pushStyledText(
  segments: StyledText[],
  text: string,
  style: AnsiStyle
) {
  if (text === '') return;
  const prev = segments[segments.length - 1];
  if (prev && isSameStyle(prev.style, style)) prev.text += text;
  else segments.push({ text, style: { ...style } });
}

/** 真偽値で表す装飾の種類 */
type FlagStyle = 'bold' | 'italic' | 'underline';

/**
 * 真偽値で表す装飾の一覧と、それぞれを有効化・無効化するSGRのパラメータ、対応するCSS
 *
 * 装飾の種類を追加する場合はここに追記する
 */
const FLAG_STYLES: Record<
  FlagStyle,
  { on: number; off: number; css: [string, string] }
> = {
  bold: { on: 1, off: 22, css: ['font-weight', 'bold'] },
  italic: { on: 3, off: 23, css: ['font-style', 'italic'] },
  underline: { on: 4, off: 24, css: ['text-decoration', 'underline'] },
};
const FLAG_KEYS = Object.keys(FLAG_STYLES) as FlagStyle[];

/** 2つの装飾が同一か */
export function isSameStyle(a: AnsiStyle, b: AnsiStyle) {
  return (
    a.color === b.color &&
    a.bgColor === b.bgColor &&
    FLAG_KEYS.every((key) => !!a[key] === !!b[key])
  );
}

/**
 * SGRのパラメータを解釈して装飾を更新する
 *
 * @param current 現在の装飾
 * @param params `ESC [` と `m` の間のパラメータ文字列（例: `1;31`）
 * @returns 更新後の装飾
 */
function applySgr(current: AnsiStyle, params: string): AnsiStyle {
  let style: AnsiStyle = { ...current };
  // `ESC[m` はリセット（パラメータ0）と同じ扱い
  const codes = params === '' ? [0] : params.split(/[;:]/).map(Number);

  for (let i = 0; i < codes.length; i++) {
    const code = codes[i];
    const flag = FLAG_KEYS.find(
      (key) => FLAG_STYLES[key].on === code || FLAG_STYLES[key].off === code
    );

    if (code === 0) style = {};
    else if (flag !== undefined) {
      if (FLAG_STYLES[flag].on === code) style[flag] = true;
      else delete style[flag];
    } else if (30 <= code && code <= 37) style.color = code - 30;
    else if (90 <= code && code <= 97) style.color = code - 90 + 8;
    else if (code === 39) delete style.color;
    else if (40 <= code && code <= 47) style.bgColor = code - 40;
    else if (100 <= code && code <= 107) style.bgColor = code - 100 + 8;
    else if (code === 49) delete style.bgColor;
    else if (code === 38 || code === 48) {
      // 拡張色指定（38;5;n または 38;2;r;g;b）
      const [color, consumed] = readExtendedColor(codes, i + 1);
      if (color !== undefined) {
        if (code === 38) style.color = color;
        else style.bgColor = color;
      }
      i += consumed;
    }
  }
  return style;
}

/**
 * 拡張色指定（256色・トゥルーカラー）のパラメータを読み取る
 *
 * @param codes SGRのパラメータ列
 * @param start `38` / `48` の次のパラメータの位置
 * @returns 読み取った色と、消費したパラメータの数
 */
function readExtendedColor(
  codes: number[],
  start: number
): [AnsiColor | undefined, number] {
  const mode = codes[start];
  if (mode === 5) {
    const index = codes[start + 1];
    return [isByte(index) ? index : undefined, 2];
  }
  if (mode === 2) {
    const rgb = codes.slice(start + 1, start + 4);
    if (rgb.length === 3 && rgb.every(isByte)) {
      const hex = rgb.map((v) => v.toString(16).padStart(2, '0')).join('');
      return [`#${hex}`, 4];
    }
    return [undefined, 4];
  }
  return [undefined, 0];
}

/** 0~255の整数か */
function isByte(value: number | undefined): value is number {
  return (
    value !== undefined && Number.isInteger(value) && 0 <= value && value <= 255
  );
}

/**
 * 基本16色のパレット（テーマごとに背景色に対して読みやすい色を用いる）
 *
 * 並びは 黒, 赤, 緑, 黄, 青, マゼンタ, シアン, 白, 及びそれぞれの明るい色
 */
const BASIC_PALETTE = {
  dark: [
    '#000000',
    '#cd3131',
    '#0dbc79',
    '#e5e510',
    '#2472c8',
    '#bc3fbc',
    '#11a8cd',
    '#e5e5e5',
    '#666666',
    '#f14c4c',
    '#23d18b',
    '#f5f543',
    '#3b8eea',
    '#d670d6',
    '#29b8db',
    '#e5e5e5',
  ],
  light: [
    '#000000',
    '#cd3131',
    '#00bc00',
    '#949800',
    '#0451a5',
    '#bc05bc',
    '#0598bc',
    '#555555',
    '#666666',
    '#cd3131',
    '#14ce14',
    '#b5ba00',
    '#0451a5',
    '#bc05bc',
    '#0598bc',
    '#a5a5a5',
  ],
} as const;

/**
 * ANSIの色をCSSの色に変換する
 *
 * @param color パレット番号もしくはRGB値
 * @param isDark ダークテーマで表示するか
 * @returns CSSで利用できる色の文字列
 */
export function ansiColorToCss(color: AnsiColor, isDark: boolean): string {
  if (typeof color === 'string') return color;
  if (color < 16) return BASIC_PALETTE[isDark ? 'dark' : 'light'][color];
  if (color < 232) {
    // 6x6x6のカラーキューブ
    const levels = [0, 95, 135, 175, 215, 255];
    const idx = color - 16;
    const rgb = [Math.floor(idx / 36), Math.floor(idx / 6) % 6, idx % 6];
    return `rgb(${rgb.map((v) => levels[v]).join(',')})`;
  }
  // グレースケール
  const gray = 8 + (color - 232) * 10;
  return `rgb(${gray},${gray},${gray})`;
}

/**
 * 装飾をCSSのスタイルに変換する
 *
 * @param style 装飾
 * @param isDark ダークテーマで表示するか
 * @returns Vueのstyleバインディングに渡せるオブジェクト
 */
export function ansiStyleToCss(
  style: AnsiStyle,
  isDark: boolean
): Record<string, string> {
  const css: Record<string, string> = {};
  if (style.color !== undefined)
    css.color = ansiColorToCss(style.color, isDark);
  if (style.bgColor !== undefined)
    css['background-color'] = ansiColorToCss(style.bgColor, isDark);
  for (const key of FLAG_KEYS) {
    if (style[key]) {
      const [prop, value] = FLAG_STYLES[key].css;
      css[prop] = value;
    }
  }
  return css;
}
