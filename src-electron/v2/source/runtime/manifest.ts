import { z } from 'zod';
import { ok } from '../../util/base';
import { Bytes } from '../../util/binary/bytes';
import { Path } from '../../util/binary/path';
import { Url } from '../../util/binary/url';
import { groupBy } from '../../util/object/groupBy';

export async function installManifest(
  installPath: Path,
  manifest: ManifestContent
) {
  await installPath.remove();
  await installPath.mkdir();

  const { directory, link, file } = groupBy(
    Object.entries(manifest.files).map(([k, v]) => ({
      path: installPath.child(k),
      entry: v,
    })),
    (x) => x.entry.type
  ) as {
    directory: { path: Path; entry: ManifestDirectory }[] | undefined;
    link: { path: Path; entry: ManifestLink }[] | undefined;
    file: { path: Path; entry: ManifestFile }[] | undefined;
  };

  if (directory) await Promise.all(directory.map(({ path }) => path.mkdir()));

  if (file) {
    const results = await Promise.all(
      file.map(async ({ path, entry }) => {
        const writeRes = await new Url(entry.downloads.raw.url).into(
          path.writer({ mode: entry.executable ? 0o755 : undefined })
        );
        if (writeRes.isErr) return writeRes;
      })
    );
    const err = results.find((x) => x?.isErr);
    if (err) return err;
  }

  if (link) {
    const results = await Promise.all(
      link.map(async ({ path, entry }) => path.mklink(path.child(entry.target)))
    );
    const err = results.find((x) => x?.isErr);
    if (err) return err;
  }

  return ok();
}

export const ManifestDirectory = z.object({
  type: z.literal('directory'),
});
export type ManifestDirectory = z.infer<typeof ManifestDirectory>;

export const ManifestLink = z.object({
  type: z.literal('link'),
  target: z.string(),
});
export type ManifestLink = z.infer<typeof ManifestLink>;

export const ManifestFile = z.object({
  type: z.literal('file'),
  executable: z.boolean(),
  downloads: z.object({
    raw: z.object({
      sha1: z.string(),
      size: z.number(),
      url: z.string(),
    }),
  }),
});
export type ManifestFile = z.infer<typeof ManifestFile>;

export const ManifestContent = z.object({
  files: z.record(
    z.string(),
    z.discriminatedUnion('type', [
      ManifestDirectory,
      ManifestLink,
      ManifestFile,
    ])
  ),
});

export type ManifestContent = z.infer<typeof ManifestContent>;
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
    manifest: ManifestContent['files'];
    files?: { path: string; value: string }[];
    links?: { path: string; target: string }[];
    dirs?: { path: string }[];
  };
}
