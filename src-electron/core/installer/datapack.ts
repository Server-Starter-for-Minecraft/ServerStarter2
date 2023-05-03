import { Failable, isFailure, isSuccess } from 'app/src-electron/api/failable';
import { FileData, FolderData, NewData } from 'app/src-electron/api/schema';
import { asyncMap } from 'app/src-electron/util/objmap';
import { Path } from 'app/src-electron/util/path';

export async function installDatapacks(
  datapacks: (FolderData | FileData | NewData)[] | undefined,
  datapacksPath: Path,
  failureMessages: string[]
): Promise<(FolderData | FileData)[]> {
  datapacks ??= [];

  // datapacksに存在しないdatapackを削除する
  const names = new Set(datapacks.map((x) => x.name));
  const promisses: Promise<void>[] = [];
  for (const datapackPath of await datapacksPath.iter()) {
    if (!names.has(datapackPath.basename())) {
      promisses.push(datapackPath.remove());
    }
  }

  // TODO: ほんとはもっと並列化できるはず
  await Promise.all(promisses);

  const failableDatapacks = await asyncMap(datapacks, (datapack) =>
    installDatapack(datapack, datapacksPath)
  );
  const newDatapacks = failableDatapacks.filter(isSuccess);

  // 導入に失敗したメッセージ一覧を追加
  failureMessages.push(
    ...failableDatapacks.filter(isFailure).map((x) => x.message)
  );

  return newDatapacks;
}

export async function installDatapack(
  datapack: FolderData | FileData | NewData,
  datapacksPath: Path
): Promise<Failable<FolderData | FileData>> {
  const path = datapacksPath.child(datapack.name);
  if ('path' in datapack) {
    // 新規導入
    const srcPath = new Path(datapack.path);
    if (!srcPath.exists()) {
      // コピー元がない場合
      return new Error(`missing datapack ${srcPath.str()}`);
    } else {
      // コピー
      await srcPath.copyTo(path);
    }
  } else if (!path.exists()) {
    // 既存チェック
    // データパックが存在しない場合
    return new Error(`missing datapack ${path.str()}`);
  }
  return {
    name: datapack.name,
  };
}
