import { app } from 'electron';

/**
 * ServerStarter本体のバージョンを取得
 */
export async function getSystemVersion() {
  if (import.meta.env.QUASAR_DEBUG)
    return (await import('../../package.json')).version;
  return app.getVersion();
}
