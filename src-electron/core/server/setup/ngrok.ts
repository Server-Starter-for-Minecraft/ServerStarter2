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

  return listener
}

/**
 * Ngrokを止める
 */
export async function closeNgrok(listener: ngrok.Listener) {
  await listener.close()
}