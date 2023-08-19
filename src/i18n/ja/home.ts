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
    displayVersion: '一覧に表示するバージョン',
    allVersions: '全てのバージョン',
    onlyReleased: '正式リリース版のみ',
    buildNumber: 'ビルド番号',
    notChange: '(変更不要)',
    recommend: '推奨',
    installer: 'インストーラー',
    loader: 'ローダー'
  },
  serverType: {
    vanilla: 'バニラ (公式)',
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
    checkWorldInstall: 'ワールド導入の確認',
    checkDialog: '以下のワールドを導入すると、既存のワールドは削除されます<br>既存のワールドを上書きする形で新規ワールドを導入しますか？',
    installBtn: 'ワールドを導入',
  },
  saveWorld: {
    title: 'ワールドフォルダ',
    description: 'ワールドデータの保存フォルダを選択',
    addFolder: 'ワールドフォルダを追加',
    add: '{name}を追加',
    folderName: 'ワールドフォルダ名',
    select: 'フォルダを選択',
    exist: '{name}は既に存在します',
    inputFolderName: 'フォルダ名を入力してください',
    selectFolder: 'フォルダを選択してください',
    selectFolderBtn: 'フォルダを選択',
    cannotEdit: '起動中のワールドがある状態でワールドフォルダを編集することはできません',
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