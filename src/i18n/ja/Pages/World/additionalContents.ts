export const jaAdditionalContents = {
  datapack: 'データパック',
  mod: 'MOD',
  plugin: 'プラグイン',
  header: {
    search: {
      placeholder: '追加したいコンテンツ名を入力',
      item: {
        tooltipTitle: 'タイトル：{title}',
        tooltipDesc: '導入されているワールドの一覧\n{worldList}',
        caption: '{worldList}に存在します',
        historicalContent: '導入履歴のあるコンテンツ',
      },
    },
    noResults: '見つかりませんでした',
    addBtn: 'コンテンツを新規追加',
    openSavedFolder: '保存先フォルダを開く',
  },
  management: '{type}管理',
  installed: '追加済み{type}',
  newInstall: '新規追加',
  add: '{type}を追加',
  notInstalled: '導入された{type}はありません',
  openSaveLocation: '追加済みの{type}の保存場所を開く',
  openAllSaveLocation: '全ての{type}の保存場所を開く',
  install: '導入',
  installFromZip: 'Zipから追加',
  installFromFolder: 'フォルダーから追加',
  needReboot: '変更を反映するにはサーバーの再起動が必要です',
  contentDetails: '詳細情報',
  deleteDialog: {
    title: '{type}の削除',
    desc: '起動履歴のあるワールドから{type}を削除する操作は，ワールドデータが破損する恐れがあります．\n危険性を理解した上で削除しますか？',
    okbtn: '危険性を理解して削除する',
  },
  newContentDialog: {
    title: '追加コンテンツを新規追加',
    desc: 'このワールドに導入する追加コンテンツを下記いずれかより設定できます',
    file_title: 'ファイルから追加',
    world_title: 'まとめて追加',
    world_desc:
      '各ワールドに導入済みの追加コンテンツをまとめて追加できます．\n\
      追加用のダイアログを開いて各ワールドのコンテンツを確認しましょう．',
    world_btn: '各ワールドからコンテンツを追加する',
  },
  addMultipleContentsDialog: {
    title: 'まとめてコンテンツを追加',
    okBtn: '選択したコンテンツを追加',
    desc: '左側から追加したいコンテンツを含むワールドを選択してください',
    addBtn: '全て追加する',
    releaseBtn: '全て解除する',
    noContentMsg: '追加可能なコンテンツがありません',
  },
  detailsEditor: {
    okBtn: '変更を保存',
    desc: 'コンテンツの詳細設定は、ServerStarter2に登録されてているすべてのワールド（ShareWorldを除く）に適用されます',
    descSW: 'コンテンツの詳細設定は、このワールドにのみ適用されます',
    contentsName: 'コンテンツ名',
    share: {
      title: 'コンテンツを共有するか',
      desc: 'コンテンツの規約等を確認し，ShareWorldによる共有が再配布等の規定に抵触しないことを確認してご利用ください．\n\
        本機能をOFFにすると，コンテンツの詳細情報のみ共有され，コンテンツの本体データは共有されません．',
      toggleON: 'コンテンツをShareWorldに入れて共有する',
      toggleOFF: 'コンテンツをShareWorldで共有しない',
    },
    memoField: {
      title: 'メモ',
      desc: 'クリックしてメモを編集',
    },
  },
  dragdrop: {
    default: 'ここにドラッグ または {0}',
    click: 'コンテンツを選択',
    dragging: 'ファイルを置いてください',
  },
};
