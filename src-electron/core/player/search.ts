import { ImageURI, PlayerUUID } from 'src-electron/schema/brands';
import { Player } from 'src-electron/schema/player';
import { GetProfile, UsernameToUUID } from 'src-electron/tools/minecraftApi';
import { isError } from 'app/src-electron/util/error/error';
import { Failable } from 'app/src-electron/util/error/failable';

export async function searchPlayerFromName(
  name: string
): Promise<Failable<Player>> {
  const res = await UsernameToUUID(name);
  if (isError(res)) return res;
  return await searchPlayerFromUUID(res.uuid);
}

const steveB64 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAADOSURBVBhXY9RX4P3zj4GFkenn3z9//vxlYmJiZWH+/5+BCSgKBH/+/+PmYJMT4pIU4GZkYPz3/x8LULQ7O56dlY2Tg+/7108MzEzvXzzrWL+DcVVtGhc7+7efP5mZ2d9/ei8vLvbwwS2gaiagqHf1pBUHlDl+/wKKTt8injxtM5+IFOOcZDdxCRkWdoHN+/YBFYZ42Dx5dPvey7fMTroKXz+/m71xs6mMvAAb+8Idu2QkRH79ZmC5//zlv38gl+24eJaZFeSWL9///vz9CwC6elD7wuNtxAAAAABJRU5ErkJggg==' as ImageURI;

const alexB64 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAIBAMAAAA2IaO4AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAqUExUReWZR+WNP9yTPOvTs/LauuTLqfv7+yNiJPLdwu7Wtu/Zu/Lbve7Xue+7sXKhgB0AAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAwSURBVBjTY2BkFBBgEBBQYGRgZDJmZFBSdg1gCCtpT2WY5eF9hMHD94ozg0uLRwsAa8oIXIiubzgAAAAASUVORK5CYII=' as ImageURI;

const clearB64 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAOSURBVChTYxgFQMDAAAABCAABwQSzUgAAAABJRU5ErkJggg==' as ImageURI;

export async function searchPlayerFromUUID(
  uuid: PlayerUUID
): Promise<Failable<Player>> {
  let avatar: ImageURI;
  let avatar_overlay: ImageURI;

  const profile = await GetProfile(uuid);
  if (isError(profile)) return profile;
  if (profile.skin) {
    const skin = profile.skin;

    async function crop(left: number) {
      const crop = await skin.crop({
        top: 8,
        left: left,
        width: 8,
        height: 8,
      });
      const data = await crop.toBeyesData();
      if (isError(data)) return data;
      return (await data.encodeURI('image/png')) as ImageURI;
    }

    const avatarPromise = crop(8);
    const avatarOverlayPromise = crop(40);

    const _avatar = await avatarPromise;
    if (isError(_avatar)) return _avatar;
    const _avatar_overlay = await avatarOverlayPromise;
    if (isError(_avatar_overlay)) return _avatar_overlay;
    avatar_overlay = _avatar_overlay;
    avatar = _avatar;
  } else {
    avatar_overlay = clearB64;
    avatar = profile.slim ? alexB64 : steveB64;
  }

  return {
    name: profile.name,
    uuid: profile.uuid,
    avatar,
    avatar_overlay,
  };
}

/** In Source Testing */
if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;
  test('searchPlayerFromName', async () => {
    const { isValid } = await import('app/src-electron/util/error/error');

    const res = await searchPlayerFromName('Notch');

    expect(isValid(res)).toBe(true);
    if (isValid(res)) {
      expect(res).not.toBeNull();
      expect(res.name).toBe('Notch');
      expect(res.uuid).toBe('069a79f4-44e9-4726-a5be-fca90e38aaf5');
      expect(res.avatar).not.toBeNull();
      expect(res.avatar_overlay).not.toBeNull();
    }
  });
}
