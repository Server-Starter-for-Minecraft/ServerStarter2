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
      binPath: (path) => path.replace('app.asar', 'app.asar.unpacked'),
    });

    return listener;
  } catch (e) {
    if (
      (e as NgrokError)?.errorCode === 'ERR_NGROK_307' &&
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

type NgrokError = {
  errorCode: 'ERR_NGROK_307';
};

/**
 * Ngrokを止める
 */
export async function closeNgrok(listener: ngrok.Listener) {
  await listener.close();
}
