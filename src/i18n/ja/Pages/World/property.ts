export const jaProperty = {
  main: {
    search: 'プロパティを検索',
  },
  resetAll: {
    btn: '全て戻す',
    title: '全てのプロパティのリセット',
    desc: '\
      このワールドに設定されているすべてのプロパティを規定値に戻します\n\
      プロパティをリセットしますか\n\
      ※ 規定値は「システム設定」>「規定プロパティ」に設定された値です',
    okBtn: 'プロパティをリセット',
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
    notFound: '解説が見つかりません',
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
    'max-build-height': '建築限界の高さ',
    'max-world-size': 'ワールドのサイズを半径で指定',
    'spawn-animals': '動物が出現する',
    'spawn-monsters': '敵MOBが出現する',
    'spawn-npcs': '村人が出現する',
    'spawn-protection':
      '\
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
    'initial-disabled-packs':
      'ワールド生成時に自動的に有効にしないデータパック',
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
    'enforce-secure-profile':
      'Mojang署名の公開鍵を持っているプレイヤーにのみ接続を許可する',
    'enforce-whitelist': 'ホワイトリストによる管理を強制する',
    'white-list': 'ホワイトリストによるプレイヤーのログイン管理を行う',
    'enable-jmx-monitoring': 'JMXによるモニターを有効化',
    'previews-chat': 'チャット送信時に表示するプレビューを有効にする',
    'snooper-enabled':
      'サーバーが定期的にスヌープデータをhttp://snoop.minecraft.netに送信するか設定する',
    'log-ips':
      'Falseに設定すると、プレイヤーがゲームに参加したときに、プレイヤーのIPがログに含まれないようにする',
    'text-filtering-config': '不適切なチャットのフィルタリング設定',
    'announce-player-achievements': 'プレイヤーの実績解除をチャットで告知する',
    'resource-pack-id':
      'クライアントがリソースパックを識別するために指定するUUID',
    'region-file-compression':
      'チャンクデータを圧縮する際に使用するアルゴリズム',
    'accepts-transfers':
      'プレイヤーが転送されたパケットを用いてサーバーにアクセスすることを許可する',
  },
  resetProperty:
    '\
    基本設定の{defaultProperty}に設定を戻します \n\
    「システム設定」>「規定プロパティ」 より基本設定を変更できます',
  empty: '(空欄)',
  failed: 'プロパティが読み込めませんでした',
  reset: 'プロパティ設定をリセット',
  result: '検索結果',
  notFound: 'プロパティが見つかりませんでした',
  inputField: {
    downerLimit: '{n}以上',
    upperLimit: '{n}以下',
    multiple: '{n}の倍数',
    number: '半角数字を入力してください',
  },
};
