export const jaHome = {
  worldName: {
    title: 'ワールド名',
    enterName: '半角英数字でワールド名を入力',
  },
  version: {
    title: 'バージョン',
    serverType: 'サーバーの種類を選択',
    versionType: 'バージョンを選択',
    allVersions: '全てのバージョン',
    onlyReleased: 'リリース版のみ',
    buildNumber: 'ビルド番号',
    notChange: '(変更不要)',
    recommend: '推奨',
    installer: 'インストーラー',
    loader: 'ローダー',
    latestSnapshot: '最新のスナップショット',
    latestRelease: '最新のリリース',
    latestVersion: '最新のバージョン',
  },
  serverType: {
    vanilla: 'バニラ (公式)',
    spigot: 'Spigot',
    papermc: 'PaperMC',
    forge: 'Forge',
    mohistmc: 'MohistMC',
    fabric: 'Fabric',
  },
  serverDescription: {
    vanilla: 'Minecraft公式のサーバー。標準的なマルチプレイの機能を提供する。',
    spigot:
      '代表的なサードパーティーサーバー。プラグインの導入ができるようになる。',
    papermc: 'Spigotをより軽量にしたサーバー。',
    forge: 'MODの前提サーバーとして、最も一般的なMODサーバー。',
    mohistmc:
      'Forgeをベースとしつつ、MODとプラグインの両者を導入可能としたサーバー。',
    fabric: 'MODの前提サーバー。Forgeとは別のシステムとなっている。',
  },
  icon: 'アイコンを変更',
  ngrok: {
    title: 'ポート開放不要化',
    desc: '\
      「ポート開放」と呼ばれる設定をせずに，友人や外部の方をサーバーに招待するための機能です<br/>\
      ServerStarter2ですべてのマルチプレイの準備を整えましょう',
    descWarningNoRegist:
      'この設定はすべてのサーバーが停止しているときにのみ設定することができます',
    descWarningRegisted:
      'トークンの更新はすべてのサーバーが停止しているときにのみ設定することができます',
    btn: 'ポート開放不要の設定をする',
    btnRegisted: 'トークンを更新する',
    toggleON: '不要化設定を利用する',
    toggleOFF: '不要化設定を利用しない',
    dialog: {
      firstPage: {
        title: 'はじめに',
        desc: '\
          本ソフトはポート開放不要化にNgrokと呼ばれるツールを用います<br>\
          アカウントをお持ちでない方はアカウントの新規作成をお願いします<br>\
          ※アカウントは有料版もありますが，<u>本ソフトは無料アカウントでの利用を想定しています</u>',
        register: 'アカウントを新規作成',
        alreadyRegistered: 'すでにアカウントをお持ちの方',
      },
      secondPage: {
        title: 'アカウント登録',
        dialogTitle: '画面に沿ってアカウント登録を完了しましょう！',
        signup: {
          desc: 'Ngrokのアカウント登録は{0}',
          link: 'こちらの登録画面で行います',
          register:
            '任意のユーザー名，メールアドレス，パスワードを記入してSign upをクリックしましょう！',
        },
        auth: {
          title: 'Eメールの認証',
          desc: '登録したE-mailにNgrokよりメールが届くため，メールに記載されたURLをクリックして認証を完了しましょう',
        },
        question: {
          title: 'アンケートへの回答',
          desc: 'これで登録は完了ですが，最後にNgrokからのアンケートを画像に倣って回答をお願いします',
        },
        howToConnect: {
          title: '接続方法',
          desc: 'ServerStarter2でサーバーを起動すると画面の右上に<b><u>起動ごとに値が変更される</u></b>IPアドレスが表示されます',
          connect:
            'このアドレスをMinecraftのマルチプレイサーバーのアドレス欄に入力することで，サーバーに接続することができます！',
        },
      },
      thirdPage: {
        title: 'トークンを登録',
        desc: '\
        NgrokアカウントとServerStarter2を紐づけます{0}\
        {1}を開き，表示されたトークンを下に入力してください\
        ',
        link: '認証トークンを取得するウェブページ',
        inputToken: 'トークンを入力',
        checkbox: 'すべてのワールドに対してNgrokを利用する',
      },
      goNext: '次の設定へ進む',
      save: '登録内容を保存',
      imageDetail: '画像の詳細',
    },
  },
  setting: {
    title: '起動設定',
    memSize: 'メモリサイズ',
    jvmArgument: 'JVM引数',
  },
  deleteWorld: {
    title: 'ワールドの削除',
    button: 'ワールドを削除する',
    titleDesc:
      '\
      このワールドを削除すると、ワールドデータを元に戻すことはできません。<br>\
      十分に注意して削除してください。',
    dialogTitle: 'ワールドを削除します',
    dialogDesc:
      '\
      <span class="text-omit col-" style="max-width: 10rem;">{deleteName}</span>のデータは永久に失われ、元に戻すことはできません。\
      <span>本当にワールドを削除しますか？</span>',
  },
  error: {
    title: '警告',
    failedGetVersion:
      'サーバーバージョン{serverVersion}の一覧取得に失敗したため、このサーバーは選択できません。',
    failedDelete: '{serverName} が存在しないため、削除に失敗しました',
  },
  init: {
    save: 'ワールドの設定を保存',
    discard: 'ワールドの設定を破棄',
  },
};
