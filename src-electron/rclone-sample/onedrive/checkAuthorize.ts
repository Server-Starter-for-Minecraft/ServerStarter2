import onedrive from 'onedrive-api';
import { Path } from 'src-electron/v2/util/binary/path';
import ini from 'ini';

/** In Source Testing */
if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;

  test('checkAuthorizedAccount', async () => {
    const configPath = new Path('src-electron/rclone-sample/rclone.conf');
    const config = await configPath.readText();
    if (config.isOk) {
      const tokenSection=ini.parse(config.value())
      if (tokenSection) {
        const token = JSON.parse(tokenSection.onedrive.token);
        console.log(token.access_token);
        const driveId = tokenSection.onedrive.drive_id
        const userInfo = await onedrive.items.customEndpoint({
          accessToken: token.access_token,
          url: `/drives/${driveId}`,
          method: 'GET'
        });
        console.log(userInfo);
      }

    }},50000)}
