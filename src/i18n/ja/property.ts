// This is just an example,
// so you can safely delete all default props below

export const jaProperty = {
  init: 'ServerStarter2を起動中',
  main: {
    search: 'プロパティを検索',
    resetAll: '全て戻す',
  },
  //WorldTabsStore.tsのgroupNamesにあったもの
  group: {
    base: '基本設定',
    player: 'プレイヤー',
    server: 'サーバー',
    generator: 'ワールド設定',
    spawning: 'ワールドスポーン',
    world: 'ワールド本体',
    network: 'ネットワーク',
    'rcon-query': 'RCON / Query',
    command: 'コマンド',
    resourcepack: 'リソースパック',
    security: 'セキュリティ',
    other: 'その他',
  },
  description: {
    difficulty: 'ゲーム難易度',
    gamemode: 'ゲーム内でのゲームモード',
    hardcore: 'ハードコアに設定する',
    'force-gamemode': 'ゲームモードをログイン時に強制する',
    pvp: 'プレイヤー同士の戦闘を許可する',
    'hide-online-players': 'オンラインのプレイヤーを隠す',
    'max-players': 'プレイヤーの最大人数',
    'player-idle-timeout':
      '指定した秒数（＝整数値）放置するとサーバーからキックされる',
    motd: 'サーバーの選択画面で表示される説明文',
    'enable-status': 'サーバーの選択画面でオンライン状態の表示をする',
    'level-type': 'ワールドの生成タイプ',
    'level-seed': 'ワールドのシード値',
    'allow-nether': 'ネザーに移動可能',
    'generate-structures': '構造物（村など）の生成をする',
    'generator-settings': 'ワールド生成のカスタマイズ(JSON)',
    'max-build-height': '建築限界の高さ(仮)',
    'max-world-size': 'ワールドのサイズを半径で指定',
    'spawn-animals': '動物が出現する',
    'spawn-monsters': '敵MOBが出現する',
    'spawn-npcs': '村人が出現する',
    'spawn-protection':'\
      ブロック・オブジェクトの設置・破壊が禁止される範囲をスポーン中心からの半径で指定（整数値）\
      ただし，OP権限を有するプレイヤーには無効',
    'view-distance': 'チャンク単位の描画距離',
    'allow-flight': '5秒以上の飛行を許可',
    'entity-broadcast-range-percentage':
      '初期値を100とした際にエンティティの描画をどの範囲で行うかを割合で設定する',
    'simulation-distance':
      'サーバー上でエンティティをシミュレーションする範囲を設定する',
    'max-chained-neighbor-updates':
      'スキップが発生する前に連続する隣接更新の数を制限する',
    'sync-chunk-writes': 'チャンクの書き込みを同期的に処理する',
    'rate-limit': 'クライアントが１秒間に送信できる最大パケット量を指定',
    'network-compression-threshold': 'ネットワークの圧縮度合いを整数で指定',
    'prevent-proxy-connections': 'falseの時にVPNやプロキシからの接続を許可する',
    'online-mode':
      '接続してきたプレイヤーが正規のアカウントを持ったプレイヤーか照合する',
    'server-ip': 'サーバーを立てるIPアドレス',
    'server-port': 'サーバーを公開する際に使用するポート番号',
    'use-native-transport':
      'Linuxで稼働するサーバーのパケット通信の最適化を行う',
    'enable-query': 'GameSpy4の接続を許可',
    'query.port': 'クエリサーバーで使用するポート番号',
    'enable-rcon': 'リモートコントロールを許可',
    'rcon.port': 'リモートコントロールで使用するポート番号',
    'rcon.password': 'リモートコントロールで使用するパスワード',
    'broadcast-rcon-to-ops':
      'リモートコントロールからコマンドが入力された際に，OP権限を有するプレイヤーに通知する',
    'broadcast-console-to-ops':
      'サーバーコンソールからコマンドが入力された際に，OP権限を有するプレイヤーに通知する',
    'initial-disabled-packs': 'ワールド生成時に自動的に有効にしないデータパック',
    'initial-enabled-packs': 'ワールド生成時に有効にするデータパック',
    'max-tick-time':
      'サーバーが動作不能になってから強制終了するまでの時間をミリ秒で指定',
    'enable-command-block': 'コマンドブロックの実行を許可',
    'function-permission-level': 'コマンドの利用レベル（1~4で指定）',
    'op-permission-level': 'OP権限のレベル(4が最大)',
    'resource-pack': 'サーバーリソースパックのURL',
    'resource-pack-prompt': 'サーバーリソースパックのプロンプト',
    'resource-pack-sha1': 'サーバーリソースパックのハッシュ値',
    'require-resource-pack':
      'サーバーリソースパックの導入を強制し，導入しない場合はワールドに接続できない',
    'enforce-secure-profile': 'Mojang署名の公開鍵を持っているプレイヤーにのみ接続を許可する',
    'enforce-whitelist': 'ホワイトリストによる管理を強制する',
    'white-list': 'ホワイトリストによるプレイヤーのログイン管理を行う',
  },
  resetProperty:'基本設定の{defaultProperty}に設定を戻します',
  resetProperty2:'「システム設定」>「プロパティ」 より基本設定を変更できます',
  failed: 'プロパティが読み込めませんでした',
  reset: 'プロパティ設定をリセット',
  inputField: {
    downerLimit: '{n}以上',
    upperLimit: '{n}以下',
    multiple: '{n}の倍数',
    number: '半角数字を入力してください'
  },
};
