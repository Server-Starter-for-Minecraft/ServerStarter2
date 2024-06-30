/**
 * 入力文字列のうち，全角のテキストを半角に統一する
 */
export function zen2han(text: string) {
  return text
    .replace(/([Ａ-Ｚａ-ｚ０-９－＿])/g, (s) => {
      // 文字コードを取得し、差分を計算して半角に変換
      return String.fromCharCode(s.charCodeAt(0) - 0xfee0);
    })
    .replace('　', ' ');
}
