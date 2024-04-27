export const jaMainLayout = {
  allWorld: 'ワールド一覧',
  systemSetting: 'システム設定',
  searchWorld: 'ワールドを検索',
  openList: 'ワールド一覧を開く',
  minimizeList: 'ワールド一覧を最小化',
  noWorld: '表示可能なワールドがありません',
  selectWorld: '編集したいワールドを選択してください',
  newWorldBtn: {
    addWorld: 'ワールドを追加',
    content: {
      newWorld: {
        title: '新規ワールドを追加',
        desc: '完全に新しいワールドを新規作成する',
      },
      customMap: {
        title: '既存のワールドを導入',
        desc: 'zip形式の配布ワールドやシングルプレイのワールドを導入する',
      },
      duplicate: {
        title: '表示中のワールドを複製',
        desc: 'バージョンやプロパティなどの各種設定を引き継いで複製する',
      },
      backup: {
        title: 'バックアップワールドを導入',
        desc: 'バックアップ済みのワールドを追加する',
      },
    },
  },
  customMapImporter: {
    addSeveralWorld: '各種ワールドの導入',
    addCustomWorld: '配布ワールドを導入',
    selectZip: 'ZIPファイルを選択',
    selectFolder: 'フォルダを選択',
    lastPlayed: '({datetime})',
    addSingleWorld: 'シングルワールドを導入',
    loadSingleWorld: 'シングルプレイワールドを<br>読み込み中',
    noSingleWorld: 'シングルプレイワールドは<br>見つかりませんでした',
    checkDialog: {
      title: 'ワールドを導入中',
      desc: '下記に表示中のワールドを新規作成しています',
    },
  },
  backupDialog: {
    title: 'バックアップデータから新規作成',
    desc: '選択された下記のバックアップデータからワールドを新規作成します',
    date: 'バックアップ日時：{date}',
    failedDate: '日時を取得できませんでした',
    backupName: 'ワールド名：{world}',
    startRecover: '作成を開始',
  },
};
