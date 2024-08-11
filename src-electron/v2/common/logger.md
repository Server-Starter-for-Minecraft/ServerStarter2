# ログ出力のガイドライン

更新 2024-08-01

# v2/common/logger の使い方

setWorldMeta で使用する場合の例

```ts
class LocalWorldSource {
  setWorldMeta(worldName: WorldName, world: World) {
    // ロガーを作成
    const logger = rootLogger.source.world.local.setWorldMeta({
      worldName: worldName,
    });
    // ログを出力
    logger.trace('success');
  }
}
```

### ポイント 1

```ts
rootLogger.source.world.local.setWorldMeta;
```

ロガーは階層化できるので `rootLogger.source.{ソース種別}.{細別}.{メソッド名}` といったように階層化する。
階層数はわかりやすいように決めて OK。階層は`camelCase`で記述する。

### ポイント 2

```ts
...setWorldMeta({ worldName: 'NewWorld' })
```

ロガーは引数を設定できるので(省略可)、階層とは関係ない呼び出し時のデータは引数に設定するとよい。
ただしログの内容を簡潔にするため、呼び出し時の状態が伝わる最低限のデータを渡すこと。
引数には json 化できる値をいくつでも設定できる。(ただし簡潔に)

### ポイント 3

```ts
logger.trace('success');
```

ログ出力にも引数を設定でき(省略可)、引数には json 化できる値をいくつでも設定できる。(ただし簡潔に)

ログはレベル下から順に `trace / debug / info / warn / error / fatal` を選択できる。

正直使い分けはいまいちわからないけど、いったん下記のイメージで。使いながら固めていきたい。

##### trace

一応出しとくか程度 console.log くらいの気分

- ipc 通信のログ
- ファイル操作のログ

##### debug

特定の条件でしか走らない処理が走った時

- キャッシュがなかったので再取得した

##### info

そこそこ時間がかかる / 十分エラーが起きうる操作が 開始/終了したとき

- java のインストール
- spigot のビルド
- rclone の同期

##### warn

ちょっと強引だけど解決した / 無視して続行した

- サーバー設定ファイルがないワールドを開いた
- キャッシュデータのハッシュ値が合わない

##### error

操作がエラーになった
操作は完了できないけどアプリは落ちない

- URL にアクセスできなかった
- サーバーが異常終了した

##### fatal

アプリが異常終了するレベルのエラー
吐くことなさそう

# 伏字

ログ出力設定として伏字を設定できる。現状文字列置換のみ対応

下記のように値とパスを受け取って伏字処理を施す関数を追加できる

伏字ルールはどこかにまとめて記述予定 (記述場所未定) なのでまだ使わないでおいてください

```ts
// 値が /SECRET_TOKEN/ にマッチしたら "***" に置換してログ出力.
addOmisstionRule((value) => (value.test(/SECRET_TOKEN/) ? ok('***') : err()));
```

path は下記のように渡される

```ts
logger.trace('foo'); // {value:'foo', path:[]} で呼ばれる
logger.trace(10, 'foo'); // {value:'foo', path:[1]} で呼ばれる
logger.trace({ test: [0, 'foo'] }); // {value:'foo', path:['test',1]} で呼ばれる
```
