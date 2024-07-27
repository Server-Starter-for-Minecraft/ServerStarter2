import { z } from 'zod';
import { Err, err, ok } from '../../util/base';
import { Bytes } from '../../util/binary/bytes';
import { Path } from '../../util/binary/path';
import { Url } from '../../util/binary/url';

export const ManifestFiles = z.object({
  files: z.record(
    z.string(),
    z.discriminatedUnion('type', [
      z.object({
        type: z.literal('directory'),
      }),
      z.object({
        type: z.literal('link'),
        target: z.string(),
      }),
      z.object({
        type: z.literal('file'),
        executable: z.boolean(),
        downloads: z.object({
          raw: z.object({
            sha1: z.string(),
            size: z.number(),
            url: z.string(),
          }),
        }),
      }),
    ])
  ),
});
export type ManifestFiles = z.infer<typeof ManifestFiles>;

export async function installManifest(
  installPath: Path,
  manifest: ManifestFiles
) {
  for (const [relpath, entry] of Object.entries(manifest.files)) {
    const path = installPath.child(relpath);
    console.log(path.path);
    switch (entry.type) {
      case 'directory':
        await path.mkdir();
        break;
      case 'file':
        await path.parent().mkdir();
        const writeRes = await new Url(entry.downloads.raw.url).into(path);
        if (writeRes.isErr) return writeRes;
        await path.changePermission(0o755);
        break;
      case 'link':
        await path.mklink(path.child(entry.target));
        break;
    }
  }
  return ok();
  // const allOk = results.every((x): x is Err<Error> => x === undefined);

  // return allOk ? ok() : err.error('manifest installation failed');
}

/** In Source Testing */
if (import.meta.vitest) {
  const { test, expect, vi } = import.meta.vitest;
  const { Path } = await import('src-electron/v2/util/binary/path');

  // 一時使用フォルダを初期化
  const workPath = new Path(__dirname).child('work');
  workPath.mkdir();

  // 実際にはUrlにアクセスせず、url文字列を結果として返す
  const urlCreateReadStreamSpy = vi.spyOn(Url.prototype, 'createReadStream');
  urlCreateReadStreamSpy.mockImplementation(function (this: Url) {
    return Bytes.fromString(this.url.toString()).createReadStream();
  });

  const file = (url: string) => ({
    type: 'file' as const,
    executable: false,
    downloads: {
      raw: { url, sha1: '', size: 111 },
    },
  });
  const directory = { type: 'directory' as const };

  const testCases: TestCase[] = [
    {
      explain: 'file',
      manifest: { 'foo.txt': file('https://a.com/') },
      files: [{ path: 'foo.txt', value: 'https://a.com/' }],
    },
    {
      explain: 'subfile',
      manifest: {
        foo: directory,
        'foo/bar.txt': file('https://foo/bar.com/'),
        'bar.txt': file('https://bar.com/'),
        buz: directory,
      },
      files: [
        { path: 'foo/bar.txt', value: 'https://foo/bar.com/' },
        { path: 'bar.txt', value: 'https://bar.com/' },
      ],
      dirs: [{ path: 'foo' }, { path: 'buz' }],
    },
    {
      explain: 'link',
      manifest: {
        'a.txt': file('https://a.com/'),
        'foo.lnk': { type: 'link', target: '../a.txt' },
      },
      links: [{ path: 'foo.lnk', target: 'hello' }],
    },
  ];

  test.each(
    testCases.map((testCase, index) => ({
      explain: testCase.explain,
      testCase,
      index,
    }))
  )('$explain', async ({ testCase, index }) => {
    const dirPath = workPath.child(`${index}`);
    await dirPath.remove();
    const res = await installManifest(dirPath, { files: testCase.manifest });
    expect(res.isOk).toBe(true);

    for (const file of testCase.files ?? []) {
      expect((await dirPath.child(file.path).readText()).value()).toBe(
        file.value
      );
    }
    for (const link of testCase.links ?? []) {
      expect((await dirPath.child(link.path).stat()).nlink).greaterThan(1); // symlinkではなく、ハードリンクなのでリンクの数が1以上かどうかで判断
    }
    for (const dir of testCase.dirs ?? []) {
      expect(await dirPath.child(dir.path).isDirectory()).toBe(true);
    }
  });

  type TestCase = {
    explain: string;
    manifest: ManifestFiles['files'];
    files?: { path: string; value: string }[];
    links?: { path: string; target: string }[];
    dirs?: { path: string }[];
  };
}
