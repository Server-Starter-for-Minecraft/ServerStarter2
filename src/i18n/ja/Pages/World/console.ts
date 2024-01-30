export const jaConsole = {
  init: 'ServerStarter2を起動中...',
  boot: '<span class="text-omit col">{name}</span> &nbsp; を起動',
  booting: '{id} ({type})/{name}を起動中',
  abnormalEnd: 'サーバーが異常終了しました',
  showLog: '直前のサーバログを表示',
  stop: {
    btn: '停止',
    withName: '<span class="text-omit col">{name}</span> &nbsp; を停止',
    progress: '停止処理中',
    progressWithName:
      '<span class="text-omit col">{name}</span> &nbsp; を停止しています',
  },
  reboot: {
    btn: '再起動',
    progress: '再起動中',
    progressWithName:
      '<span class="text-omit col">{name}</span> &nbsp; を再起動しています',
  },
  status: {
    Stop: '停止中',
    Ready: '準備中',
    Running: '起動中',
    CheckLog: 'ログ確認中',
  },
  shutdownServer: 'サーバーをシャットダウン中',
  command: 'コマンドを入力',
};
