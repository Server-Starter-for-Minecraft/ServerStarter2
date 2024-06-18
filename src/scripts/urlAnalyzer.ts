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
  const urlRgx = /https?:\/\/[\w!?/+\-_~;.,=*&@#$%()'[\]]+/g;
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
