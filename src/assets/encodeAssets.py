
from glob import glob
from pathlib import Path
import base64

def svgEncode(svg):
  """
  SVGをエンコード
  """
  encodePattern = '"%#{}<>&|[]^`;?:@=/ ' # Encode these to %hex
  encodeResult = ''
  for c in str(svg):
    if c in encodePattern:
      encodeResult += "'" if c == '"' else '%' + format(ord(c), "x")
    else:
      encodeResult += c
  
  returnTxt = ' '.join(encodeResult.split())
  return returnTxt


def pngEncode(png:bytes):
  """
  PNGをbase64でエンコード
  """
  data = base64.b64encode(png)
  return data.decode('utf-8')


def writeTS(svgDict:dict[str, str], pngDict:dict[str, str]):
  """
  TypeScript（Assets.ts）に書き込む
  """
  separator: str = "\' | \'"

  header1 = \
"""
// このファイルは'encodeAssets.py'による自動生成
// Assetsが増えた場合には上記のPythonを実行することでAssetsを更新する

import { ImageURI } from "app/src-electron/schema/brands"

"""
  svgFiles = f"type svgFiles = \'{separator.join(list(svgDict.keys()))}\'\n"
  pngFiles = f"type pngFiles = \'{separator.join(list(pngDict.keys()))}\'"
  header2 = \
"""

interface iAssets {
  svg: {
    [key in svgFiles]: ImageURI
  },
  png: {
    [key in pngFiles]: ImageURI
  },
}

export const assets: iAssets = {
  svg: {
"""

  svgTxt = [f"    {key}: \"{val}\" as ImageURI,\n" for key, val in svgDict.items()]
  pngTxt = [f"    {key}: \"{val}\" as ImageURI,\n" for key, val in pngDict.items()]

  with open(Path(__file__).parent/'assets.ts', 'w', encoding='utf-8') as f:
    f.write(header1)
    f.write(svgFiles)
    f.write(pngFiles)
    f.write(header2)
    f.writelines(svgTxt)
    f.writelines(['  },\n', '  png: {\n'])
    f.writelines(pngTxt)
    f.writelines(['  }\n', '}'])
  

if __name__ == "__main__":
  svgDict = {}
  pngDict = {}

  # svgの読み込み
  for svgPath in glob('./src/assets/**/*.svg', recursive=True):
    with open(svgPath, 'r') as f:
      name = Path(svgPath).stem.replace('-', '_')
      svgDict[name] = 'data:image/svg+xml;charset=utf8,' + svgEncode(''.join(f.readlines()))

  # PNGの読み込み
  for pngPath in glob('./src/assets/**/*.png', recursive=True):
    with open(pngPath, 'rb') as f:
      name = Path(pngPath).stem.replace('-', '_')
      pngDict[name] = 'data:image/png;base64,' + pngEncode(f.read())

  # 書き出し
  writeTS(svgDict, pngDict)