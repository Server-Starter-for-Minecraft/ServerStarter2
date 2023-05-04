# src-electron について

## 概要

このディレクトリは ServerStarter2 のバックエンドの処理を実装するためのものです。

ここで実装された処理は後述の API を通してフロントエンド側と相互にプロセス間通信します。

## ディレクトリ構造

src-electron 以下の各ディレクトリの概要を以下に記す

### /api

プロセス間通信のための API(関数群)の定義

### /schema

API(関数群)の定義で使っているデータスキーマ(型定義)

### /core

ServerStarter2 の基本機能実装

- サーバーの起動
- java のインストール
- server の jar ファイルのダウンロード
- ShareWorld 等

### /ipc

バックエンド側 API の内部実装とそのための補助ファイル群

### /tools

API を通して呼ばれるメソッドの中で core に関係のない処理の実装

### /util

主に/core,/tools 内で import される汎用処理の実装

### /electron-env.d.ts

electron 環境下で使用できる変数のアンビエント宣言
編集の必要なし

### /electron-flag.d.ts

quasar が内部的に使用する変数のアンビエント宣言
編集の必要なし

### /electron-main.ts

electron アプリケーションのエントリポイント アプリケーション自体の挙動を編集したいとき以外編集の必要なし

### /electron-preload.ts

electron の ContextBridge のために必要なファイル
プロセス間通信のフロント側の内部実装
API を編集するたびにこちらも編集の必要あり
