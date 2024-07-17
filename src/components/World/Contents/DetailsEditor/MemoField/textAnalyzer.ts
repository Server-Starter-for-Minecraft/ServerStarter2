type UrlAnalyzed =
  | { type: 'url'; value: string }
  | { type: 'br'; value: string }
  | { type: 'txt'; value: string };

export function brAnalyzer(content: string, returnObj: UrlAnalyzed[]) {
  const brRgx = /[\n|\r|\r\n]/;
  const naturalText = content.split(brRgx);

  returnObj.push({ type: 'txt', value: naturalText[0] });
  for (let i = 1; i < naturalText.length; i++) {
    returnObj.push({ type: 'br', value: '' });
    returnObj.push({ type: 'txt', value: naturalText[i] });
  }

  return returnObj;
}

/**
 * 取得したテキストからURL部分とそれ以外の部分を分離して返す
 */
export function urlAnalyzer(content: string) {
  const urlRgx = /https?:\/\/[\w!?/+\-_~:;.,=*&@#$%()'[\]]+/g;
  const naturalText = content.split(urlRgx);

  const analyzedTxts = brAnalyzer(naturalText[0], []);
  let i = 1;
  for (const matched of content.matchAll(urlRgx)) {
    analyzedTxts.push({ type: 'url', value: matched[0] });
    brAnalyzer(naturalText[i], analyzedTxts);
    i++;
  }

  // brを考慮した２次元配列へ変換
  const structedTxts: UrlAnalyzed[][] = [];
  let currentSubArray: UrlAnalyzed[] = [];
  analyzedTxts.forEach((t) => {
    if (t.type === 'br') {
      structedTxts.push(currentSubArray);
      currentSubArray = [];
    } else {
      currentSubArray.push(t);
    }
  });
  structedTxts.push(currentSubArray);

  return structedTxts;
}

/** In Source Testing */
if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;
  const testCases = [
    'https://fonts.google.com/icons',
    'https://github.com/Server-Starter-for-Minecraft/ServerStarter2?tab=readme-ov-file#serverstarter2',
    'https://fonts.google.com/icons?selected=Material+Symbols+Outlined:check_circle:FILL@0;wght@400;GRAD@0;opsz@24&icon.query=check&icon.size=24&icon.color=%23e8eaed&icon.platform=android',
  ];
  test.each(testCases)('urlAnalyzerInMemoText (%#)', (url) => {
    expect(urlAnalyzer(url)[0][1].value).toBe(url);
  });
}
