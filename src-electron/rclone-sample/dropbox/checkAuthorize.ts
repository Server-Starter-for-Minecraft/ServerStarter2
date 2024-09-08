import { Path } from 'src-electron/v2/util/binary/path';
import ini from 'ini';
import { Dropbox } from 'dropbox';
/** In Source Testing */
if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;
  test('authorizeCheckTest', async () => {
    const configPath = new Path('src-electron/rclone-sample/rclone.conf');
    const config = await configPath.readText();
    if (config.isOk) {
      const tokenSection=ini.parse(config.value())
      if (tokenSection) {
        const token = JSON.parse(tokenSection.dropbox.token);
        const accessToken=token.access_token
        const dropbox = new Dropbox({ accessToken: accessToken });
        const response = dropbox.usersGetCurrentAccount();
        const mailAddress = (await response).result.email;
        expect(mailAddress).toBe('serverstarter.contact@gmail.com');
      }
    }
  }, 500000)
}
