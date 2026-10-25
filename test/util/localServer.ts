import { createServer } from 'http';
import type { AddressInfo } from 'net';

/** ローカルHTTPサーバーが返すレスポンス */
export type LocalResponse = {
  status?: number;
  body: string | Buffer;
  contentType?: string;
};

/**
 * テスト用のローカルHTTPサーバーを起動する
 *
 * 外部サービスに依存せずにURLからの取得処理をテストするために使用する．
 * 登録されていないパスへのアクセスには404を返す．
 *
 * @param routes パス(例: `/todos/1`)とレスポンスの対応
 * @returns `url(path)`で各パスのURLを取得でき，`close()`でサーバーを停止する
 */
export async function startLocalServer(routes: Record<string, LocalResponse>) {
  const server = createServer((req, res) => {
    const route = routes[req.url ?? ''];
    if (route === undefined) {
      res.writeHead(404).end();
      return;
    }
    res
      .writeHead(route.status ?? 200, {
        'Content-Type': route.contentType ?? 'application/octet-stream',
      })
      .end(route.body);
  });

  // ポート0を指定して空いているポートを自動で割り当てる
  await new Promise<void>((resolve) =>
    server.listen(0, '127.0.0.1', () => resolve())
  );
  const { port } = server.address() as AddressInfo;

  return {
    url: (path: string) => `http://127.0.0.1:${port}${path}`,
    close: () =>
      new Promise<void>((resolve, reject) =>
        server.close((err) => (err ? reject(err) : resolve()))
      ),
  };
}
