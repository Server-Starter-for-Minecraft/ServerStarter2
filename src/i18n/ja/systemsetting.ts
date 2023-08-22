export const jaSystemSetting = {
  title: 'システム設定',
  general: {
    lang: '言語',
    langDesc: '言語を選択してください',
    colorMode: '配色モード',
    autoShutdown: '自動シャットダウン',
    shutdownDesc: 'サーバー終了後に自動でPCをシャットダウンする',
  },
  property: {
    description:
      '新規ワールドの作成時などに使用するデフォルトのプロパティを設定する',
    search: 'プロパティを検索',
  },
  remote: {},
  folder: {
    unregistTitle: '{name}の登録を解除します',
    unregistDialog: '\
      ServerStarterのワールド保存先一覧より{name}の登録を解除します。<br>\
      解除したフォルダとその内部データが削除されることはありません。',
    tooltipVisible: 'ワールド一覧にこのフォルダに保存されたワールドを表示する',
    tooltipInvisible: 'ワールド一覧にこのフォルダに保存されたワールドを表示しない',
    unregist: '登録解除',
  },
  info: {
    systemVersion: 'システムバージョン',
    latest: '(最新)',
    update: '最新版に更新',
    finalUpdate: '最終更新日：{datetime}',
    externalLink: '外部リンク',
    homepage: '公式ホームページ',
    contact: 'お問い合わせ',
    dm: '（DMよりご連絡ください）',
    license: 'ライセンス',
    MIT: 'MIT License',
    licenseDesc: '\
      製作者への許可なくシステムを改変して再配布することを禁じています。<br>\
      詳細はServerStarter2の利用規約、並びにライセンス条項をご確認ください。',
    developer: '製作者',
    productionManager: '製作責任者',
    technicalManager: '技術責任者',
    support: '実装補助',
  },
};
