export const jaShareWorld = {
  title: 'ワールド共有設定 (ShareWorld)',
  desc: '\
  ワールド共有機能（ShareWorld）は複数のプレイヤー間で、どのプレイヤーがサーバーを起動しても常に最新のワールドを遊べるようにするための機能です。\
  使い方の詳細は{0}をご参照ください。',
  link: '公式HP',
  descriptRemote: 'ワールド共有機能（ShareWorld）を利用するためのデータ保管場所を登録します',
  registerNewRemote: '新規リモートの登録',
  register: '登録',
  addRemote: {
    title: 'リモートを追加',
    dialogTitle: '新規ShareWorldの登録',
    account: 'アカウントの種類',
    user: 'ユーザー名',
    repository: 'レポジトリ名',
    inputValue: '値を入力してください'
  },
  githubCard: {
    account: 'アカウント',
    repository: 'レポジトリ',
    updatePAT: 'Personal Access Token を更新',
    update: 'Tokenを更新',
    inputPAT: 'Personal Access Token を入力',
    useRemote: 'このリモートを利用する',
    unresister: {
      remote: 'リモートの登録を解除',
      dialog: '{name} を解除',
      decide: '登録を解除',
      desc: '\
        ServerStarter2 から 「{owner} / {repo}」の登録を解除します。<br>\
        GitHub上のリポジトリは削除されませんが、「{owner} / {repo}」を用いてワールドを再共有することは出来なくなります。',
    }
  }, 
}