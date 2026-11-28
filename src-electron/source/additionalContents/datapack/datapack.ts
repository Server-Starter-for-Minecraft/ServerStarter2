import { z } from 'zod';
import { DatapackData } from 'app/src-electron/schema/filedata';
import { DATAPACK_CACHE_PATH, LEVEL_NAME } from 'app/src-electron/source/const';
import { ZipFile } from 'app/src-electron/util/binary/archive/zipFile';
import { BytesData } from 'app/src-electron/util/binary/bytesData';
import { Path } from 'app/src-electron/util/binary/path';
import { errorMessage } from 'app/src-electron/util/error/construct';
import { isError } from 'app/src-electron/util/error/error';
import { Failable } from 'app/src-electron/util/error/failable';
import { textComponentToString } from 'app/src-electron/util/format/textComponent';
import { ServerAdditionalFiles } from '../base';

/**
 * `pack.mcmeta` のうち、本アプリで利用する項目のスキーマ
 *
 * 対応フォーマットバージョンの記述は Minecraft 1.21.9 で `pack_format` から `min_format` / `max_format` に移行しており、
 * 新形式では `pack_format` が存在しない。本アプリは対応フォーマットバージョンを利用しないため、これらの項目は検証しない。
 *
 * `description` は文字列のほか、テキストコンポーネント（`{ "translate": "..." }` や配列など）でも記述できるため、
 * 表示用の文字列に変換して扱う（記述が無い場合は空文字として扱う）。
 */
const Mcmeta = z.object({
  pack: z.object({
    // Zod 4 では `z.unknown().transform()` のみだとキーの省略を許容しないため、`optional()` で省略を許可する
    description: z.unknown().optional().transform(textComponentToString),
  }),
});
type Mcmeta = z.infer<typeof Mcmeta>;

const MCMETA_FILE = 'pack.mcmeta';

/**
 * データパックとして不適である旨のエラーを生成する
 *
 * @param path データパックのパス
 * @param isDirectory データパックがフォルダ形式か
 * @returns データパックとして不適である旨のエラー
 */
function invalidDatapackError(path: Path, isDirectory: boolean) {
  return errorMessage.data.path.invalidContent.invalidDatapack({
    type: isDirectory ? 'directory' : 'file',
    path: path.path,
  });
}

async function loader(path: Path): Promise<Failable<DatapackData>> {
  let mcmetaData: Failable<BytesData>;
  const isPathDir = await path.isDirectory();
  if (isError(isPathDir)) return isPathDir;

  if (isPathDir) {
    // ディレクトリの場合
    const metaPath = path.child(MCMETA_FILE);
    // pack.mcmetaが存在しない場合エラー
    if (!(await metaPath.exists()))
      return errorMessage.data.path.notFound({
        type: 'file',
        path: metaPath.str(),
      });
    mcmetaData = await BytesData.fromPath(metaPath);
  } else {
    if (path.extname() !== '.zip') {
      // zipでないファイル場合
      return invalidDatapackError(path, false);
    }
    // zipの場合
    const zip = new ZipFile(path);
    mcmetaData = await zip.getFile(MCMETA_FILE);
  }
  if (isError(mcmetaData)) return mcmetaData;

  // JSONとして読めない場合も、内容が想定と異なる場合も、データパックとして不適な旨のエラーにまとめる
  // （json() に Mcmeta を渡すとスキーマ違反が実行時エラーとして返るため、検証は別に行う）
  const json = await mcmetaData.json(z.unknown());
  if (isError(json)) return invalidDatapackError(path, isPathDir);

  const fixed = Mcmeta.safeParse(json);
  if (!fixed.success) return invalidDatapackError(path, isPathDir);

  return {
    kind: 'datapack',
    description: fixed.data.pack.description,
  };
}

async function installer(sourcePath: Path, targetPath: Path): Promise<void> {
  await sourcePath.copyTo(targetPath);
}

export const datapackFiles = new ServerAdditionalFiles<DatapackData>(
  'datapack',
  DATAPACK_CACHE_PATH,
  `${LEVEL_NAME}/datapacks`,
  loader,
  installer
);
