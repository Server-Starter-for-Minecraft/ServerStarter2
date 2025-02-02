import { GroupProgressor } from 'app/src-electron/common/progress';
import { Failable } from 'app/src-electron/util/error/failable';
import { BytesData } from '../bytesData';
import { isError } from '../error/error';
import { Path } from '../path';

export type Manifest = {
  files: {
    [key in string]: ManifestFile | ManifestDirectory | ManifestLink;
  };
};

export type ManifestDownload = {
  sha1: string;
  size: number;
  url: string;
};

export type ManifestFile = {
  downloads: {
    lzma?: ManifestDownload;
    raw: ManifestDownload;
  };
  executable: boolean;
  type: 'file';
};
export type ManifestDirectory = { type: 'directory' };
export type ManifestLink = { target: string; type: 'link' };

/** manifest.jsonに記載されているデータをローカルに展開する */
export async function installManifest(
  manifest: Manifest,
  path: Path,
  progress?: GroupProgressor
) {
  // 展開先の親ディレクトリを生成
  await path.mkdir(true);

  // manifestの順番でファイル/ディレクトリ/リンクを作る
  // ディレクトリは同期的に作成し、ファイル/リンクは非同期を並列して処理
  const promises: Promise<Failable<undefined>>[] = [];
  const entries = Object.entries(manifest.files);
  let processed = 0;

  const numeric = progress?.numeric('file', entries.length);
  const file = progress?.subtitle({
    key: 'server.readyJava.file',
    args: {
      path: '',
    },
  });

  for await (const [k, v] of entries) {
    const p = path.child(k);
    switch (v.type) {
      case 'file':
        const filePromise = async () => {
          file?.setSubtitle({
            key: 'server.readyJava.file',
            args: { path: k },
          });
          const result = await BytesData.fromPathOrUrl(
            p,
            v.downloads.raw.url,
            { value: v.downloads.raw.sha1, type: 'sha1' },
            false,
            undefined,
            v.executable
          );
          numeric?.setValue(processed++);
          if (isError(result)) return result;
        };
        promises.push(filePromise());
        break;
      case 'directory':
        file?.setSubtitle({
          key: 'server.readyJava.file',
          args: { path: k },
        });
        await p.mkdir();
        numeric?.setValue(processed++);
        break;
      case 'link':
        const linkPromise = async () => {
          file?.setSubtitle({
            key: 'server.readyJava.file',
            args: { path: k },
          });
          await p.mklink(p.parent().child(v.target));
          numeric?.setValue(processed++);
          return undefined;
        };
        promises.push(linkPromise());
        break;
    }
  }
  // ファイル/リンクの並列処理を待機
  await Promise.all(promises);
  // TODO: Failureがあった場合の処理
}
