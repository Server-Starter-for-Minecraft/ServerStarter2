import { Failable, isFailure, isSuccess } from 'src-electron/api/failable';
import { FileData, NewData } from 'src-electron/api/schema_old';
import { asyncMap } from 'src-electron/util/objmap';
import { Path } from 'src-electron/util/path';

export async function installFiles(
  files: (FileData | NewData)[] | undefined,
  path: Path,
  failureMessages: string[]
): Promise<FileData[] | undefined> {
  // ファイルが一切存在しない場合フォルダごと削除
  if (files === undefined) {
    await path.remove();
    return;
  }

  // datapacksに存在しないdatapackを削除する
  const names = new Set(files.map((x) => x.name));
  const promisses: Promise<void>[] = [];
  for (const datapackPath of await path.iter()) {
    if (!names.has(datapackPath.basename())) {
      promisses.push(datapackPath.remove());
    }
  }

  // TODO: ほんとはもっと並列化できるはず
  await Promise.all(promisses);

  const failables = await asyncMap(files, (datapack) =>
    installFile(datapack, path)
  );

  const newFiles = failables.filter(isSuccess);

  // 導入に失敗したメッセージ一覧を追加
  failureMessages.push(...failables.filter(isFailure).map((x) => x.message));

  return newFiles;
}

async function installFile(
  file: FileData | NewData,
  dirPath: Path
): Promise<Failable<FileData>> {
  const path = dirPath.child(file.name);
  if ('path' in file) {
    // 新規導入
    const srcPath = new Path(file.path);
    if (!srcPath.exists()) {
      // コピー元がない場合
      return new Error(`missing file ${srcPath.str()}`);
    } else {
      // コピー
      await srcPath.copyTo(path);
    }
  } else if (!path.exists()) {
    // 既存チェック
    // データパックが存在しない場合
    return new Error(`missing file ${path.str()}`);
  }
  return {
    name: file.name,
  };
}
