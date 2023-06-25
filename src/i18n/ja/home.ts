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
  },
  useWorld: {
    title: '既存ワールドの導入',
    solo: '個人ワールドを導入する',
    descSolo: 'このPC上にあるMinecraftの個人ワールドを導入する',
    pickSolo: '個人ワールドを選択',
    custom: '配布ワールドをZipファイルより導入する',
    descCustom: 'インターネットよりダウンロードしたワールド（配布ワールド）を導入する',
    pickCustom: '配布ワールド(.zip)を選択',
  },
  setting: {
    title: '起動設定',
    memSize: 'メモリサイズ',
    unit: '単位',
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
    failedDelete: '選択したサーバー {serverName} が存在しないため、削除に失敗しました。',
  },
};