# テストについて

ServerStarter2 ではテストライブラリとして vitest を採用している

https://vitest.dev

記法については公式リファレンスを参考にすること。

簡単な例は `./example.test.ts`/`./inSourceExample.ts` に記述した。

テストに関する設定は`vitest.config.js`にある。

# テストの配置

### ユニットテスト

本プロジェクトでは In Source Testing を採用し、ユニットテストは実装と同じファイル内に記載する。

`src-electron/util/zip.ts`に例があるので参考まで。

`ts`内で`test`と打つとIn Source Testingのスニペットが出るので活用してください。

### その他とテスト

個別でテストファイルを配置する場合はファイル名を `**/*.test.ts`とすること。

本ディレクトリはそれ以上の結合テストやモックの実装を書く。

:TODO
