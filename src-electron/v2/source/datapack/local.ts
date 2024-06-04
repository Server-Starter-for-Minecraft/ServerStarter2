import { WithExists } from '../../schema/additional';
import {
  DatapackAnnotation,
  DatapackId,
  DatapackInfo,
  DatapackMeta,
  DatapackName,
} from '../../schema/datapack';
import { err, Result } from '../../util/base';
import { Path } from '../../util/binary/path';
import { DatapackContainer } from './datapack';

/** Localのデータパックを格納するフォルダのような何か */
export class LocalDatapackContainer extends DatapackContainer {
  private path: Path;

  constructor(path: Path) {
    super();
    this.path = path;
  }
  /**
   * コンテナ内のデータパック一覧を表示
   *
   * @param fromCache true の時は cache.json から内容を読み取る / false の時はdataディレクトリを走査して cache.jsonの内容を更新する
   */
  async list(fromCache: boolean): Promise<WithExists<DatapackInfo>[]> {
    return [];
  }

  /**
   * データパックを作成
   *
   * メタデータのみの作成も許可
   */
  async create(
    meta: DatapackAnnotation,
    srcPath: Path | undefined
  ): Promise<Result<DatapackId, Error>> {
    return err(new Error('notImplemented'));
  }

  /**
   * メタデータを更新
   */
  async updateAnnotation(
    datapackId: DatapackId,
    meta: DatapackAnnotation
  ): Promise<Result<void, Error>> {
    return err(new Error('notImplemented'));
  }

  /**
   * データパックとメタデータを削除
   */
  async delete(): Promise<Result<void, Error>> {
    return err(new Error('notImplemented'));
  }

  /**
   * データパックをpathに導入
   * @param path
   */
  async extractTo(mata: DatapackId, path: Path): Promise<Result<void>> {
    return err(new Error('notImplemented'));
  }
}

/** In Source Testing */
if (import.meta.vitest) {
  const { describe, test, expect } = import.meta.vitest;

  describe('LocalDatapackContainer.listのテスト', () => {
    test('正常な状態', async () => {
      const pack01Meta: DatapackMeta = {
        info: {
          datapackId: 'dir_pack01' as DatapackId,
          type: 'dir',
          description: 'TestDescritption01',
        },
        annotation: {
          canCopy: false,
          canShare: true,
          memo: 'MyTestComment',
          name: 'Datapack001' as DatapackName,
        },
      };

      const pack02Meta: DatapackMeta = {
        info: {
          datapackId: 'dir_pack02' as DatapackId,
          type: 'dir',
          description: 'TestDescritption02',
        },
        annotation: {
          canCopy: false,
          canShare: true,
          memo: 'test comment',
          name: 'Datapack002' as DatapackName,
        },
      };

      const pack03Meta: DatapackMeta = {
        info: {
          // zipファイルのIDは zip_${sha1} として管理する
          datapackId:
            'zip_b41e6e9731c997a6daef25397bc6b96b2320e3ff' as DatapackId,
          type: 'zip',
          description: 'TestDescritption03',
        },
        annotation: {
          canCopy: false,
          canShare: true,
          memo: 'test comment',
          name: 'Datapack003' as DatapackName,
        },
      };

      const pack04Meta: DatapackMeta = {
        info: {
          // zipファイルのIDは zip_${sha1} として管理する
          datapackId:
            'zip_c33a04555cd2f81b9245a0a660da6e9dd5c9de2d' as DatapackId,
          type: 'zip',
          description: 'TestDescritption04',
        },
        annotation: {
          canCopy: false,
          canShare: true,
          memo: 'test comment',
          name: 'Datapack004' as DatapackName,
        },
      };

      //
      // 処理ここから
      //

      // テスト用のディレクトリで実行する
      const rootPath = new Path('src-electron/v2/source/datapack/test');

      // ./test/localData の内容をすべて {rootPath}/localData にコピー
      const sourcePath = rootPath.child('localData');
      await new Path('src-electron/v2/source/datapack/test/localData').copyTo(
        sourcePath
      );

      // {rootPath}/localDataをデータパックコンテナとして扱う
      // (要するに ./test/localData の内容がデータパックコンテナの内部構造)
      const datapackContainer = new LocalDatapackContainer(sourcePath);

      // キャッシュから取得した値が期待通り
      const listFromCache = await datapackContainer.list(true);
      expect(listFromCache).toEqual(
        expect.arrayContaining([pack01Meta, pack02Meta, pack03Meta, pack04Meta])
      );

      // ディレクトリから取得した値が期待通り
      const listFromFs = await datapackContainer.list(false);
      expect(listFromFs).toEqual(
        expect.arrayContaining([pack01Meta, pack02Meta, pack03Meta, pack04Meta])
      );

      // TODO: @MojaMonchi datapackContainer.list(false)実行後(つまりここ)で、ローカルデータ内から不要なデータ(dir/gomi.txt,zip/gomi)が削除されていることを確認する

      // 後始末
      await rootPath.remove();
    });

    test('キャッシュの内容と実データが不整合', async () => {
      // TODO: @MojaMonchi 上記のテストを参考にキャッシュデータ(cache.json)と実際のデータ(dir,zipディレクトリの中身)の内容に乖離があった場合のテストを書く
      // 乖離があった場合はすべて実データのほうが正しいとして処理する
      // await datapackContainer.list(true); した場合はキャッシュデータの内容になる
      // await datapackContainer.list(false); した場合は実際のデータの内容になり、
      // もう一度 await datapackContainer.list(true); すると、修正されたキャッシュデータ(=位置行上の内容と同一)になる
      // 確認してほしい乖離
      // - キャッシュ上では exists=true だけど、実際にはデータが存在しない
      // - キャッシュ上では exists=false だけど、実際はデータが存在する
      // - キャッシュ上にはそもそも存在しないけど、 実際はデータが存在する (この場合cacheの内容はデフォルト値が入る)
      // - キャッシュ上のdescritptionと実際のpack.mcmetaのdescritptionの内容が異なる
    });

    test('キャッシュファイルが破損', async () => {
      // TODO: @MojaMonchi 上記のテストを参考にキャッシュデータが破損している/存在しない場合のテストを書く
      // await datapackContainer.list(true); した場合にキャッシュデータがないので、
      // datapackContainer.list(false)の内容が戻り値となり、キャッシュファイルが復元されることを確認
    });
  });
}
