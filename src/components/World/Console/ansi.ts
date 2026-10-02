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
 * - CSI（ESC [ ... 終端文字）: 終端が `m` のものがSGR
 * - OSC（ESC ] ... BEL もしくは ESC \）: ウィンドウタイトル変更など
 * - その他の2文字のエスケープシーケンス
 */
const ESCAPE_SEQUENCE =
  /\u001b\[([0-9;:?]*)([@-~])|\u001b\][^\u0007\u001b]*(?:\u0007|\u001b\\)?|\u001b[@-Z\\-_]/g;

/**
 * ANSIエスケープシーケンスを含む文字列を装飾付きテキストの配列に変換する
 *
 * @param raw サーバーから受け取った文字列
 * @param initialStyle 文字列の先頭に適用されている装飾（前の行から装飾が引き継がれる場合に指定）
 * @returns 装飾ごとに分割したテキストの配列（空文字列の断片は含まない）
 */
export function parseAnsi(
  raw: string,
  initialStyle: AnsiStyle = {}
): StyledText[] {
  const result: StyledText[] = [];
  let style: AnsiStyle = { ...initialStyle };
  let lastIndex = 0;

  /** 現在の装飾でテキストを追加する（直前と同じ装飾の場合は結合する） */
  const push = (text: string) => {
    if (text === '') return;
    const prev = result[result.length - 1];
    if (prev && isSameStyle(prev.style, style)) prev.text += text;
    else result.push({ text, style: { ...style } });
  };

  for (const match of raw.matchAll(ESCAPE_SEQUENCE)) {
    push(raw.slice(lastIndex, match.index));
    lastIndex = match.index + match[0].length;

    // SGR以外の制御シーケンスは表示に影響させずに取り除く
    if (match[2] === 'm') style = applySgr(style, match[1]);
  }
  push(raw.slice(lastIndex));

  return result;
}

/**
 * ANSIエスケープシーケンスを取り除いた文字列を返す
 *
 * @param raw サーバーから受け取った文字列
 * @returns 表示される文字のみからなる文字列（検索などに利用する）
 */
export function stripAnsi(raw: string): string {
  return raw.replace(ESCAPE_SEQUENCE, '');
}

/** 2つの装飾が同一か */
function isSameStyle(a: AnsiStyle, b: AnsiStyle) {
  return (
    a.color === b.color &&
    a.bgColor === b.bgColor &&
    !!a.bold === !!b.bold &&
    !!a.italic === !!b.italic &&
    !!a.underline === !!b.underline
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
  const style = { ...current };
  // `ESC[m` はリセット（パラメータ0）と同じ扱い
  const codes = params === '' ? [0] : params.split(/[;:]/).map(Number);

  for (let i = 0; i < codes.length; i++) {
    const code = codes[i];
    if (code === 0) {
      delete style.color;
      delete style.bgColor;
      delete style.bold;
      delete style.italic;
      delete style.underline;
    } else if (code === 1) style.bold = true;
    else if (code === 22) delete style.bold;
    else if (code === 3) style.italic = true;
    else if (code === 23) delete style.italic;
    else if (code === 4) style.underline = true;
    else if (code === 24) delete style.underline;
    else if (30 <= code && code <= 37) style.color = code - 30;
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
  if (style.bold) css['font-weight'] = 'bold';
  if (style.italic) css['font-style'] = 'italic';
  if (style.underline) css['text-decoration'] = 'underline';
  return css;
}
