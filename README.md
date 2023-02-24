# 要件を考える会

## サーバー起動
- Vanilla
- Spigot
- PaperMC
- Forge
- MohistMC
- (統合版)

## ワ－ルドの保存先
- ローカル
- Github
- (gdrive)
- (onedrive)

git/javaのサイレントインストール

ローカルへのバックアップファイル生成

データパック/プラグインの保管

自動ポート開放

自動シャットダウン

ServerPropertiesの編集

Player/PlayerGroupの保存

Datapack/Pliugin/配布ワールドの導入

ワールドのバージョン変更

旧ServerStarterからの移行スクリプト

git操作の安定化

メモリサイズの指定

システムが安定版でないことの表示

- 安定版までは表示することで，ユーザーに動作不安定であることを告知

- アンインストールを行っても作成したWorldDataは削除されない旨も併せて通知



# API

## 実装済み

- test() $\rightarrow$ string

    'TEST RESULT'という文字列を返す




## 実装中



## 実装予定

- runServer(java, world) $\rightarrow$ ??

    指定したJavaとWorldの情報を基にサーバーの起動を行う

    起動後の戻り値は未定