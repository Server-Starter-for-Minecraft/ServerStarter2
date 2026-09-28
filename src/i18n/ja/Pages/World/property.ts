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
      'サーバーが動作不能になってから強制終了するまでの時間をミリ秒で指定（-1で強制終了を無効化）',
    'enable-command-block': 'コマンドブロックの実行を許可',
    'function-permission-level': 'コマンドの利用レベル（1~4で指定）',
    'op-permission-level': 'OP権限のレベル（0~4で指定）',
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
    'bug-report-link':
      'プレイヤーに「バグを報告」の案内先として提示するURL（空欄の場合は案内しない）',
    'chat-spam-threshold-seconds':
      'チャットを短時間に送りすぎたプレイヤーを自動でキックする際の判定基準（0でキックしない）',
    'command-spam-threshold-seconds':
      'コマンドを短時間に実行しすぎたプレイヤーを自動でキックする際の判定基準（0でキックしない）',
    'enable-code-of-conduct':
      'サーバーの行動規範をプレイヤーに表示する（codeofconductフォルダに「言語コード.txt」の形式で配置した文章を使用）',
    'pause-when-empty-seconds':
      'オンラインのプレイヤーがいない状態が指定した秒数続いたら，サーバーの処理を一時停止する（0以下で無効化）',
    'text-filtering-version':
      'text-filtering-configに記述する設定の書式バージョン（0または1）',
    'management-server-enabled':
      '外部ツールからサーバーを管理・監視するための管理用プロトコル（Management Protocol）を有効化する',
    'management-server-host': '管理用プロトコルが待ち受けるホスト名',
    'management-server-port':
      '管理用プロトコルが待ち受けるポート番号（0の場合は起動時にランダムなポートを割り当てる）',
    'management-server-allowed-origins':
      '管理用プロトコルへの接続を許可するオリジンの一覧をカンマ区切りで指定（空欄の場合はどこからも接続できない）',
    'management-server-secret':
      '管理用プロトコルに接続する際の認証に使う40文字の英数字（空欄の場合は自動生成）',
    'management-server-tls-enabled': '管理用プロトコルの通信をTLSで暗号化する',
    'management-server-tls-keystore':
      'TLSで使用するキーストアファイルのパス（TLSを有効にしたまま未指定にするとサーバーが起動しない）',
    'management-server-tls-keystore-password':
      'TLSで使用するキーストアファイルのパスワード',
    'status-heartbeat-interval':
      '管理用プロトコルの接続先へ稼働状況の通知（ハートビート）を送る間隔を秒単位で指定（0で送信しない）',
  },
  resetProperty:
    '\
    基本設定の{defaultProperty}に設定を戻します \n\
    「システム設定」>「規定プロパティ」 より基本設定を変更できます',
  locked: {
    ngrok:
      'ポート開放不要化機能を利用中は，ポート番号が自動で割り当てられるため無効です',
  },
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
