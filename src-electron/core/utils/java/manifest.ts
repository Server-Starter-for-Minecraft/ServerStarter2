import { BytesData } from '../bytesData/bytesData.js';
import { Path } from '../path/path.js';
import { isFailure } from '../../../api/failable.js';

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
export async function installManifest(manifest: Manifest, path: Path) {
  // 展開先の親ディレクトリを生成
  await path.mkdir(true);

  // manifestの順番でファイル/ディレクトリ/リンクを作る
  // ディレクトリは同期的に作成し、ファイル/リンクは非同期を並列して処理
  const promises: Promise<void>[] = [];
  for await (const [k, v] of Object.entries(manifest.files)) {
    const p = path.child(k);
    switch (v.type) {
      case 'file':
        const filePromise = async () => {
          const result = await BytesData.fromPathOrUrl(
            p.path,
            v.downloads.raw.url,
            { value: v.downloads.raw.sha1, type: 'sha1' },
            false,
            true
          );
          // if (isFailure(result)) console.log(p.path);
        };
        promises.push(filePromise());
        break;
      case 'directory':
        await p.mkdir();
        break;
      case 'link':
        const linkPromise = async () => {
          await p.mklink(p.parent().child(v.target));
        };
        promises.push(linkPromise());
        break;
    }
  }
  // ファイル/リンクの並列処理を待機
  await Promise.all(promises);
}
