/**
 * 外部ネットワークへの通信を遮断するセットアップファイル
 *
 * 環境変数 `VITEST_BLOCK_NETWORK=1` のときのみ有効になり，
 * ループバックアドレス(localhost / 127.0.0.1 / ::1)以外への`fetch`をエラーにする．
 *
 * PRのCIでは`network`タグ以外のテストをこの状態で実行することで，
 * タグを付け忘れた外部通信テストが「たまに落ちる」のではなく「必ず落ちる」ようにし
 * (アクセスを遮断したテストは，テスト内でエラーを検証しているかに関わらず失敗させる)，
 * 不安定なテストが必須のCIに紛れ込むことを防ぐ．
 *
 * NOTE: 遮断対象は`fetch`のみ(本アプリの通信は`BytesData.fromURL`等を経由して`fetch`を使う)．
 * 子プロセス(Javaのインストーラーやgit等)による通信は遮断できない．
 */
import { afterAll, afterEach, expect } from 'vitest';

const LOOPBACK_HOSTS = ['localhost', '127.0.0.1', '[::1]'];

/** fetchの引数から接続先のホスト名を取り出す(URLとして解釈できない場合はundefined) */
function getHostname(input: Parameters<typeof fetch>[0]) {
  const url =
    typeof input === 'string' || input instanceof URL ? input : input.url;
  return URL.canParse(url) ? new URL(url).hostname : undefined;
}

if (process.env.VITEST_BLOCK_NETWORK === '1') {
  const originalFetch = globalThis.fetch;
  /** 現在のテスト中に遮断したアクセス先 */
  let blockedHosts: string[] = [];

  globalThis.fetch = async (input, init) => {
    const hostname = getHostname(input);
    // URLとして不正な場合は本来のfetchに任せる(本来のfetchも外部へはアクセスせずにエラーになる)
    if (hostname === undefined || LOOPBACK_HOSTS.includes(hostname)) {
      return originalFetch(input, init);
    }
    blockedHosts.push(hostname);
    throw new Error(
      `外部ネットワークへのアクセスは遮断されています (${hostname})`
    );
  };

  // アプリのコードは通信エラーをResult型に変換するため，テストがエラーを検証していなくても
  // 遮断したアクセスがあればテストを失敗させる
  afterEach(() => {
    const hosts = blockedHosts;
    blockedHosts = [];
    expect(
      hosts,
      '外部サービスにアクセスするテストには `tags: ["network"]` を付与してください (test/readme.md 参照)'
    ).toEqual([]);
  });

  afterAll(() => {
    globalThis.fetch = originalFetch;
  });
}
