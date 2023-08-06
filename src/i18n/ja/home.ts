// This is just an example,
// so you can safely delete all default props below

export const jaHome = {
  worldName: {
    title: 'ワールド名',
    enterName: '半角英数字でワールド名を入力',
  },
  version: {
    title: 'バージョン',
    serverType: 'サーバーの種類を選択',
    versionType: 'バージョンを選択',
    displayVersion: '選択一覧に表示するバージョン',
    allVersions: '全てのバージョン',
    onlyReleased: 'Releasedのみ',
    buildNumber: 'ビルド番号',
    notChange: '(変更不要)',
    recommend: '推奨',
    installer: 'インストーラー',
    loader: 'ローダー'
  },
  serverType: {
    vanilla: 'バニラ',
    spigot: 'Spigot',
    papermc: 'PaperMC',
    forge: 'Forge',
    mohistmc: 'MohistMC',
    fabric: 'Fabric'
  },
  icon: 'アイコンを変更',
  useWorld: {
    title: '既存ワールドの導入',
    description: 'zip形式の配布ワールドやシングルプレイのワールドを導入する',
    selectWorld: 'ワールドデータを選択',
  },
  saveWorld: {
    title: 'ワールドフォルダ',
    description: 'ワールドデータの保存フォルダを選択'
  },
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
      {deleteName}のデータは永久に失われ、元に戻すことはできません。<br>\
      本当にワールドを削除しますか？',
  },
  error: {
    title: '警告',
    failedGetVersion: 'サーバーバージョン{serverVersion}の一覧取得に失敗したため、このサーバーは選択できません。',
    failedDelete: '{serverName} が存在しないため、削除に失敗しました。',
  },
  init: {
    save: 'ワールドの設定を保存',
    discard: 'ワールドの設定を破棄'
  },
};