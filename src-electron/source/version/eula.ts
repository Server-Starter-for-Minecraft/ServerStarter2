import { Failable } from 'app/src-electron/schema/error';
import { isError } from 'app/src-electron/util/error/error';
import { Path } from '../../util/binary/path';
import { properties } from '../../util/format/properties';

/** Eulaファイルの文字列を解析する */
function parseEula(txt: string): {
  eula: boolean;
  url: string;
  comments: string[];
} {
  const comments: string[] = [];
  let eula = false;
  let url = 'https://aka.ms/MinecraftEULA';
  txt.split('\n').forEach((line) => {
    if (line[0] === '#') {
      // eulaのURLを見つけたら更新
      const match = line.match(/https?:\/\/[^)]+/);
      if (match) url = match[0];
      comments.push(line);
      return;
    }
    const match = line.toLowerCase().match(/\s*eula\s*=\s*(\w+)\s*/);
    if (match) {
      eula = match[1] === 'true';
    }
  });
  return { eula, url, comments };
}

/**
 * Minecraft eula に同意しているか確認
 *
 * 戻り値のうち，idx[0]は同意状況，idx[1]はEulaから読み取ったURL
 *
 * 無効なEulaの場合はNullを返す
 */
export async function getEulaAgreement(
  eulaPath: Path
): Promise<{ eula: boolean; url: string }> {
  const readRes = await eulaPath.readText();

  let readTxt = '';
  if (isError(readRes)) readTxt = 'eula=false';
  else readTxt = readRes;

  const { eula, url, comments } = parseEula(readTxt);
  return { eula, url };
}

/** Minecraft eula に同意するかを保存 */
export async function setEulaAgreement(
  eulaPath: Path,
  value: boolean
): Promise<Failable<void>> {
  return await eulaPath.writeText(
    properties.stringify({ eula: value ? 'true' : 'false' })
  );
}
