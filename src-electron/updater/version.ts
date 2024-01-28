import { app } from 'electron';

/**
 * ServerStarter本体のバージョンを取得
 */
export async function getSystemVersion() {
  if (process.env.DEBUGGING) return (await import('package.json')).version;
  return app.getVersion();
}
