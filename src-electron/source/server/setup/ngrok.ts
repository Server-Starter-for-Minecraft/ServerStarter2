import ngrok from '@ngrok/ngrok';
import { Failable } from 'app/src-electron/schema/error';
import { errorMessage } from 'app/src-electron/util/error/construct';

/**
 * Ngrokを起動する
 */
export async function runNgrok(
  token: string,
  port: number,
  remote_addr?: string
): Promise<Failable<ngrok.Listener>> {
  // Establish connectivity

  try {
    const listener = await ngrok.forward({
      proto: 'tcp',
      addr: port,
      authtoken: token,
      remote_addr,
      // binPath: (path) => path.replace('app.asar', 'app.asar.unpacked'),
    });

    return listener;
  } catch (e) {
    if (
      isNgrokError(e) &&
      e.errorCode === 'ERR_NGROK_307' &&
      remote_addr !== undefined
    ) {
      return errorMessage.lib.ngrok.unreservedAdress({
        adress: remote_addr,
      });
    }
    return errorMessage.lib.ngrok.unknown({
      message: e?.toString?.() ?? '',
    });
  }
}

/**
 * Ngrok の例外が，エラーコード（`errorCode`）を持つかを判定する
 *
 * @param e 捕捉した例外
 * @returns エラーコードを持てば true
 */
function isNgrokError(e: unknown): e is { errorCode: unknown } {
  return typeof e === 'object' && e !== null && 'errorCode' in e;
}

/**
 * Ngrokを止める
 */
export async function closeNgrok(listener: ngrok.Listener) {
  await listener.close();
}
