# v2/Util

他でも使える汎用処理をここに記述


# Util作成ガイドライン

### 1. 汎用処理は積極的に切り出して、ここに置きましょう

実装の本体が2~3行だったとしても、それが汎用的だと思うならUtilを作る時間です。

utilの実装が大規模になるときは、ディレクトリを作り複数ファイルに分割しましょう。

また、今は必要ないが類似する処理が出てくる可能性がある場合も、ディレクトリを切っておくといいでしょう。

後からグループ化できるファイルが見つかった場合も、ディレクトリに纏めてしまいましょう。

importの修正はきっとVScodeの言語サーバがやってくれます。


### 2. 依存関係は必須なものだけに絞りましょう

Util間で依存関係ができるのは問題ありませんが、
その依存関係が本当にそのUtilにとって必須なのかは考えて実装しましょう。

2つ以上のUtilが相互に依存するような実装になった場合、たいていは設計の問題です。
以下2点考えると解決策が見えるかも。

1. その依存関係は外側から注入できないか (Utilを呼び出す側にimportさせられないか)
2. インターフェイスを別ファイルに切り出して解決できないか


### 3. テストとドキュメントを書きましょう

Utilは基本的にどこから誰が呼んでもいい、末端の汎用処理です。
Utilがバグると多大な影響が出る可能性があります。

なので、

1. 誰が呼んでもいいようにテストをしっかり書く
2. 誰でも呼べるように、使い方や型定義を残しておく

もしコード内だけでは足りないと思ったら、以下の対応をとってもいいでしょう。

1. **.test.ts に追加のテストを記述する
2. ディレクトリ中に readme.md を作成しドキュメントを記載する
