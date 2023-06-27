import { formatUUID } from 'src-electron/tools/uuid';
import { Failable, isFailure } from 'src-electron/api/failable';
import { ImageURI, UUID } from 'src-electron/schema/brands';
import { Player } from 'src-electron/schema/player';
import { GetProfile, UsernameToUUID } from 'src-electron/tools/minecraftApi';

export async function searchPlayer(
  nameOrUuid: string
): Promise<Failable<Player>> {
  const namePattern = /^[a-zA-Z0-9_]{2,16}$/gm;
  if (nameOrUuid.match(namePattern)) {
    const res = await UsernameToUUID(nameOrUuid);
    if (isFailure(res)) return res;
    return await searchPlayerFromUUID(res.uuid);
  }

  const uuid = formatUUID(nameOrUuid);

  if (isFailure(uuid)) {
    return new Error(
      'player name must match /[a-zA-Z0-9_]{2,16}/ and uuid must match /[0-9_]{8}-[0-9_]{4}-[0-9_]{4}-[0-9_]{4}-[0-9_]{12}/'
    );
  }

  return await searchPlayerFromUUID(uuid);
}

const steveB64 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAADOSURBVBhXY9RX4P3zj4GFkenn3z9//vxlYmJiZWH+/5+BCSgKBH/+/+PmYJMT4pIU4GZkYPz3/x8LULQ7O56dlY2Tg+/7108MzEzvXzzrWL+DcVVtGhc7+7efP5mZ2d9/ei8vLvbwwS2gaiagqHf1pBUHlDl+/wKKTt8injxtM5+IFOOcZDdxCRkWdoHN+/YBFYZ42Dx5dPvey7fMTroKXz+/m71xs6mMvAAb+8Idu2QkRH79ZmC5//zlv38gl+24eJaZFeSWL9///vz9CwC6elD7wuNtxAAAAABJRU5ErkJggg==' as ImageURI;

const alexB64 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAIBAMAAAA2IaO4AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAqUExUReWZR+WNP9yTPOvTs/LauuTLqfv7+yNiJPLdwu7Wtu/Zu/Lbve7Xue+7sXKhgB0AAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAwSURBVBjTY2BkFBBgEBBQYGRgZDJmZFBSdg1gCCtpT2WY5eF9hMHD94ozg0uLRwsAa8oIXIiubzgAAAAASUVORK5CYII=' as ImageURI;

const clearB64 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAOSURBVChTYxgFQMDAAAABCAABwQSzUgAAAABJRU5ErkJggg==' as ImageURI;

async function searchPlayerFromUUID(uuid: UUID): Promise<Failable<Player>> {
  let avatar: ImageURI;
  let avatar_overlay: ImageURI;

  const profile = await GetProfile(uuid);
  if (isFailure(profile)) return profile;
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
      if (isFailure(data)) return data;
      return (await data.encodeURI('image/png')) as ImageURI;
    }

    const avatarPromise = crop(8);
    const avatarOverlayPromise = crop(40);

    const _avatar = await avatarPromise;
    if (isFailure(_avatar)) return _avatar;
    const _avatar_overlay = await avatarOverlayPromise;
    if (isFailure(_avatar_overlay)) return _avatar_overlay;
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
