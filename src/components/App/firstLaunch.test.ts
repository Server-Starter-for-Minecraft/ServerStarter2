import { describe, expect, test } from 'vitest';
import { ImageURI, PlayerUUID } from 'app/src-electron/schema/brands';
import { Player } from 'app/src-electron/schema/player';
import { SystemUserSetting } from 'app/src-electron/schema/system';
import { runFirstLaunch } from './firstLaunch';

type FirstLaunchSettings = Pick<SystemUserSetting, 'eula' | 'owner'>;

const ownerPlayer: Player = {
  name: 'Owner',
  uuid: PlayerUUID.parse('01234567-89ab-cdef-0123-456789abcdef'),
  avatar: ImageURI.parse(''),
  avatar_overlay: ImageURI.parse(''),
};

describe('runFirstLaunch', () => {
  test('オーナー登録をスキップしても初回起動処理が完了する', async () => {
    const settings: FirstLaunchSettings = { eula: false };
    const launched = runFirstLaunch(settings, {
      showWelcome: async () => ({ ok: true, payload: undefined }),
      showOwnerRegister: async () => ({ ok: false }),
    });

    await expect(launched).resolves.toBeUndefined();
    expect(settings.eula).toBe(true);
    expect(settings.owner).toBeUndefined();
  });

  test('オーナーを登録した場合はユーザー設定に保存される', async () => {
    const settings: FirstLaunchSettings = { eula: false };
    await runFirstLaunch(settings, {
      showWelcome: async () => ({ ok: true, payload: undefined }),
      showOwnerRegister: async () => ({ ok: true, payload: { ownerPlayer } }),
    });

    expect(settings.eula).toBe(true);
    expect(settings.owner).toBe(ownerPlayer.uuid);
  });

  test('利用規約のダイアログがOK以外で閉じられた場合は同意扱いにしない', async () => {
    const settings: FirstLaunchSettings = { eula: false };
    await runFirstLaunch(settings, {
      showWelcome: async () => ({ ok: false }),
      showOwnerRegister: async () => ({ ok: false }),
    });

    expect(settings.eula).toBe(false);
  });
});
