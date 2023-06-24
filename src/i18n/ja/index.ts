// This is just an example,
// so you can safely delete all default props below
import { japroperty } from "src/i18n/ja/property"

export const ja = {
  home: {
    worldName: 'ワールド名',
    enterName: '半角英数字でワールド名を入力',
    version: 'バージョン',
    serverType: 'サーバーの種類を選択',
    versionType: 'バージョンを選択',
    useWorld: '既存ワールドの導入',
    settings: '起動設定',
  },
  importWorld: {
    personal: '個人ワールドを導入する',
    expPersonal: 'このPC上にあるMinecraftの個人ワールドを導入する',
    selpersonal: '個人ワールドを選択',
    released: '配布ワールドをZipファイルより導入する',
    expreleased: 'インターネットよりダウンロードしたワールド（配布ワールド）を導入する',
    selreleased: '配布ワールド(.zip)を選択'
  },
  settingDetails: {
    memSize: 'メモリサイズ',
    unit: '単位',
    jvmArgument: 'JVM引数'
  },
  deleteWorld: {
    title: 'ワールドの削除',
    button: 'ワールドを削除',
    titleExplanation: '\
      このワールドを削除すると、ワールドデータを元に戻すことはできません。<br>\
      十分に注意して削除してください。',
    dialogTitle: 'ワールドを削除します',
    dialogExplanation: '\
      {deleteName}のデータは永久に失われ、元に戻すことはできません。<br>\
      本当にワールドを削除しますか？',
  },
  error: {
    title: 'Error',
    emergency: '\
      警告<br>\
      サーバーバージョン{serverVersion}の一覧取得に失敗したため、このサーバーは選択できません。'
  },
  property:japroperty
};