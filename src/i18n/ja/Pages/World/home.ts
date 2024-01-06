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
    latestVersion: '最新のバージョン'
  },
  serverType: {
    vanilla: 'バニラ (公式)',
    spigot: 'Spigot',
    papermc: 'PaperMC',
    forge: 'Forge',
    mohistmc: 'MohistMC',
    fabric: 'Fabric'
  },
  serverDescription: {
    vanilla: 'Minecraft公式のサーバー。標準的なマルチプレイの機能を提供する。',
    spigot: '代表的なサードパーティーサーバー。プラグインの導入ができるようになる。',
    papermc: 'Spigotをより軽量にしたサーバー',
    forge: 'MODの前提サーバーとして、最も一般的なサーバー',
    mohistmc: 'Forgeをベースとしつつ、MODとプラグインの両者を導入可能としたサーバー',
    fabric: 'MODの前提サーバー。Forgeとは別のシステムとなっている。'
  },
  icon: 'アイコンを変更',
  setting: {
    title: '起動設定',
    memSize: 'メモリサイズ',
    jvmArgument: 'JVM引数'
  },
  deleteWorld: {
    title: 'ワールドの削除',
    button: 'ワールドを削除する',
    titleDesc: '\
      このワールドを削除すると、ワールドデータを元に戻すことはできません。<br>\
      十分に注意して削除してください。',
    dialogTitle: 'ワールドを削除します',
    dialogDesc: '\
      <span class="text-omit col-" style="max-width: 10rem;">{deleteName}</span>のデータは永久に失われ、元に戻すことはできません。\
      <span>本当にワールドを削除しますか？</span>',
  },
  error: {
    title: '警告',
    failedGetVersion: 'サーバーバージョン{serverVersion}の一覧取得に失敗したため、このサーバーは選択できません。',
    failedDelete: '{serverName} が存在しないため、削除に失敗しました',
  },
  init: {
    save: 'ワールドの設定を保存',
    discard: 'ワールドの設定を破棄'
  },
};