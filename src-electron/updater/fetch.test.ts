import { afterEach, describe, expect, test, vi } from 'vitest';
import { BytesData } from '../util/binary/bytesData';
import { isError } from '../util/error/error';
import { getLatestRelease } from './fetch';

const RELEASES_URL =
  'https://api.github.com/repos/Server-Starter-for-Minecraft/ServerStarter2/releases';

/**
 * GitHubのリリース一覧APIが返すアセットと同じ形式のデータを作成する
 *
 * @param id アセットのID（GitHub上で採番される任意の数値）
 * @param name アセットのファイル名
 * @param label アセットのラベル（未設定の場合は空文字列またはnull）
 */
function asset(id: number, name: string, label: string | null) {
  return {
    url: `${RELEASES_URL}/assets/${id}`,
    browser_download_url: `https://github.com/Server-Starter-for-Minecraft/ServerStarter2/releases/download/${name}`,
    id,
    node_id: `RA_${id}`,
    name,
    label,
    state: 'uploaded',
    content_type: 'application/octet-stream',
    size: 1024,
    download_count: 10,
    created_at: '2024-05-05T14:54:12Z',
    updated_at: '2024-05-05T14:54:12Z',
    uploader: null,
  };
}

/**
 * GitHubのリリース一覧APIが返すリリースと同じ形式のデータを作成する
 *
 * @param id リリースのID（GitHub上で採番される任意の数値）
 * @param tag リリースのタグ名
 * @param assets リリースに含まれるアセット
 */
function release(id: number, tag: string, assets: ReturnType<typeof asset>[]) {
  return {
    url: `${RELEASES_URL}/${id}`,
    html_url: `https://github.com/Server-Starter-for-Minecraft/ServerStarter2/releases/tag/${tag}`,
    assets_url: `${RELEASES_URL}/${id}/assets`,
    upload_url: `https://uploads.github.com/repos/Server-Starter-for-Minecraft/ServerStarter2/releases/${id}/assets{?name,label}`,
    tarball_url: `https://api.github.com/repos/Server-Starter-for-Minecraft/ServerStarter2/tarball/${tag}`,
    zipball_url: `https://api.github.com/repos/Server-Starter-for-Minecraft/ServerStarter2/zipball/${tag}`,
    id,
    node_id: `RE_${id}`,
    tag_name: tag,
    target_commitish: 'main',
    name: tag,
    body: '',
    draft: false,
    prerelease: false,
    created_at: '2024-05-05T14:54:12Z',
    published_at: '2024-05-05T14:54:12Z',
    author: null,
    assets,
  };
}

/** 新しい順に並んだリリース一覧（実際のGitHubのレスポンスと同様にラベルの値が混在する） */
const RELEASES = [
  release(155432110, 'v2.2.0', [
    asset(166778801, 'ServerStarter-v2.2.0.deb', ''),
    asset(166778802, 'ServerStarter-v2.2.0.msi', ''),
    asset(166778803, 'ServerStarter-v2.2.0.pkg', null),
    asset(166778804, 'ServerStarter-v2.2.0.rpm', ''),
  ]),
  release(144210987, 'v2.1.5', [
    asset(153300001, 'ServerStarter-v2.1.5.msi', null),
    asset(153300002, 'ServerStarter-v2.1.5.pkg', null),
  ]),
];

/** リリース一覧APIへのアクセスで、指定したレスポンスを返すようにする */
function mockReleasesResponse(body: unknown) {
  vi.spyOn(BytesData, 'fromURL').mockImplementation(async () =>
    BytesData.fromText(JSON.stringify(body))
  );
}

/** 指定したリリースに含まれる、指定したファイル名のアセットのURLを返す */
function assetUrl(releases: typeof RELEASES, tag: string, name: string) {
  return releases
    .find((r) => r.tag_name === tag)
    ?.assets.find((a) => a.name === name)?.url;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('getLatestRelease', () => {
  test.each([
    ['windows-x64', 'ServerStarter-v2.2.0.msi'],
    ['mac-os', 'ServerStarter-v2.2.0.pkg'],
    ['mac-os-arm64', 'ServerStarter-v2.2.0.pkg'],
    ['debian', 'ServerStarter-v2.2.0.deb'],
    ['redhat', 'ServerStarter-v2.2.0.rpm'],
  ] as const)(
    'GitHubのリリース一覧から%sの最新版を取得できる',
    async (platform, assetName) => {
      mockReleasesResponse(RELEASES);

      const latest = await getLatestRelease(platform, undefined);

      expect(latest).toEqual({
        platform,
        version: 'v2.2.0',
        url: assetUrl(RELEASES, 'v2.2.0', assetName),
      });
    }
  );

  test('最新のリリースにOS向けのアセットがない場合は、アセットがある中で最新のリリースを取得する', async () => {
    const releases = [
      release(166000000, 'v2.3.0', [
        asset(177000001, 'ServerStarter-v2.3.0.msi', null),
      ]),
      ...RELEASES,
    ];
    mockReleasesResponse(releases);

    const latest = await getLatestRelease('debian', undefined);

    expect(latest).toEqual({
      platform: 'debian',
      version: 'v2.2.0',
      url: assetUrl(releases, 'v2.2.0', 'ServerStarter-v2.2.0.deb'),
    });
  });

  test('取得したリリース一覧が想定外の形式の場合はエラーを返す', async () => {
    mockReleasesResponse({ message: 'Not Found' });

    const latest = await getLatestRelease('windows-x64', undefined);

    expect(isError(latest)).toBe(true);
  });
});
