export const jaShareWorld = {
  github: 'GitHub',
  title: 'ワールド共有設定 (ShareWorld)',
  desc: '\
  ワールド共有機能（ShareWorld）は複数のプレイヤー間で、どのプレイヤーがサーバーを起動しても常に最新のワールドを遊べるようにするための機能です。{0}\
  使い方の詳細は{1}をご参照ください。',
  link: '公式HP',
  descriptRemote: 'ワールド共有機能（ShareWorld）を利用するためのデータ保管場所を登録します',
  registerNewRemote: '新規リモートの登録',
  register: '登録',
  cannotEdit: '起動中のワールドがある状態でリモート設定を編集することはできません',
  addRemote: {
    title: 'リモートを追加',
    dialogTitle: '新規ShareWorldの登録',
    account: 'アカウントの種類',
    user: 'ユーザー名',
    repository: 'リポジトリ名',
    inputValue: '値を入力してください'
  },
  githubCard: {
    account: 'アカウント',
    repository: 'リポジトリ',
    updatePAT: 'Personal Access Token を更新',
    update: 'Tokenを更新',
    inputPAT: 'Personal Access Token を入力',
    useRemote: 'このリモートを利用する',
    worldName: '同期先ワールド名',
    unregister: {
      remote: 'リモートの登録を解除',
      dialog: '{name} を解除',
      decide: '登録を解除',
      desc: '\
        ServerStarter2 から 「{owner}/{repo}」の登録を解除します。<br>\
        GitHub上のリポジトリは削除されませんが、「{owner}/{repo}」を用いてワールドを再共有することは出来なくなります。',
    }
  }, 
  sync: '{path}と同期',
  existedDialog: '\
    {rWorldName}とワールドデータを同期します。<br>\
    このワールドのデータは選択したShareWorldのデータによって上書きされます。<br>\
    ワールドを同期しますか？',
  selectRemote: {
    title: 'ShareWorldを新規登録',
    makeShareWorld: '新規ShareWorldを作成して同期',
    syncExistWorld: '既存のShareWorldと同期',
    loading: 'ShareWorldを読み込み中',
    notFound: '既存のShareWorldは見つかりませんでした',
  },
  newRemote: {
    title: '新規ShareWorldと同期',
    btn: '新規データで同期',
    desc: '\
      新規ShareWorldを作成して同期データを作成します。{0}\
      同期する際に用いるShareWorldの名称を入力してください。{1}{2}',
    caution: 'この名称は後から変更することができません。',
    inputName: '新規ShareWorldの名称を入力',
    unavailName: 'ShareWorldの新規名称として使用できません',
  },
  existRemote: {
    syncWorldTitle: '同期中のShareWorldデータ',
    syncWorldDesc: '\
      このワールドは{0}と同期されています。{1}\
      {2}ではこの同期データをブラウザ上で確認することができます。',
    unregister: {
      unregistSyncTitle: 'ワールドの同期を解除',
      unregistSyncDesc: '\
        {remotePath}との同期を解除します。<br>\
        ShareWorldが削除されることはありませんが、{worldName}の更新データは共有されなくなります。',
      dialogTitle: '同期を解除します',
      dialogDesc: '\
        同期を解除すると、これ以降にこのサーバーで遊んだ内容は同期されません。<br>\
        共有を解除しますか？',
    },
    delete: {
      title: 'ShareWorldを削除する',
      desc: '\
        {remotePath}の共有データを完全に削除します。<br>\
        共有しているShareWorldのデータは削除されますが、全ての参加者はローカルワールドとして引き続きこのワールドを起動することができます。',
      btn: 'ShareWorldを削除',
      dialogTitle: 'リモートデータを削除します',
      dialogDesc: '\
        このワールドはShareWorldのデータが削除されるため、共有相手も同期が解除されます。<br>\
        このワールドのShareWorldデータを削除しますか？',
    }
  }
}