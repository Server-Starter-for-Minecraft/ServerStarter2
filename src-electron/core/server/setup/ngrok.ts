import ngrok from '@ngrok/ngrok'

/**
 * Ngrokを起動する
 */
export async function runNgrok(token: string, port: number) {
  // Establish connectivity
  const listener = await ngrok.forward({ 
    proto: 'tcp',
    addr: port,
    authtoken: token
  });

  // TODO: このURLが発行されたら，サーバーごとにフロントから確認できるようにする
  // 確認できるようにしたらこのコンソール出力を削除
  console.log(listener.url())

  return listener
}

/**
 * Ngrokを止める
 */
export async function closeNgrok(listener: ngrok.Listener) {
  await listener.close()
}