import { ImageURI, PlayerAvatar, PlayerUUID } from '../../schema/player';
import { ok, Result } from '../../util/base';
import { Png } from '../../util/binary/png';
import { GetProfile, UsernameToUUID } from './minecraftAvatarAPI';

const steveB64 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAADOSURBVBhXY9RX4P3zj4GFkenn3z9//vxlYmJiZWH+/5+BCSgKBH/+/+PmYJMT4pIU4GZkYPz3/x8LULQ7O56dlY2Tg+/7108MzEzvXzzrWL+DcVVtGhc7+7efP5mZ2d9/ei8vLvbwwS2gaiagqHf1pBUHlDl+/wKKTt8injxtM5+IFOOcZDdxCRkWdoHN+/YBFYZ42Dx5dPvey7fMTroKXz+/m71xs6mMvAAb+8Idu2QkRH79ZmC5//zlv38gl+24eJaZFeSWL9///vz9CwC6elD7wuNtxAAAAABJRU5ErkJggg==' as ImageURI;

const alexB64 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAIBAMAAAA2IaO4AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAqUExUReWZR+WNP9yTPOvTs/LauuTLqfv7+yNiJPLdwu7Wtu/Zu/Lbve7Xue+7sXKhgB0AAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAwSURBVBjTY2BkFBBgEBBQYGRgZDJmZFBSdg1gCCtpT2WY5eF9hMHD94ozg0uLRwsAa8oIXIiubzgAAAAASUVORK5CYII=' as ImageURI;

const clearB64 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAOSURBVChTYxgFQMDAAAABCAABwQSzUgAAAABJRU5ErkJggg==' as ImageURI;

/**
 * プレイヤー名からPlayerのAvatar情報を取得する
 */
export async function searchPlayerFromName(
  name: string
): Promise<Result<PlayerAvatar>> {
  const res = await UsernameToUUID(name);
  if (res.isErr) return res;
  return searchPlayerFromUUID(res.value().id);
}

/**
 * UUIDからPlayerのAvatar情報を取得する
 */
export async function searchPlayerFromUUID(
  uuid: PlayerUUID
): Promise<Result<PlayerAvatar>> {
  let avatar: ImageURI;
  let avatar_overlay: ImageURI;

  const profile = await GetProfile(uuid);
  if (profile.isErr) return profile;

  const skin = profile.value().skin;
  if (skin) {
    const imgs = await constructFaceImg(skin);
    if (imgs.isErr) return imgs;
    avatar = imgs.value()[0];
    avatar_overlay = imgs.value()[1];
  } else {
    avatar_overlay = clearB64;
    avatar = profile.value().slim ? alexB64 : steveB64;
  }

  return ok({
    name: profile.value().name,
    uuid: profile.value().uuid,
    avatar,
    avatar_overlay,
  });
}

/** プレイヤーのスキンから顔面を抽出 */
async function constructFaceImg(skin: Png): Promise<Result<ImageURI[]>> {
  const cropRegion = (left: number) => {
    return {
      top: 8,
      left: left,
      width: 8,
      height: 8,
    };
  };
  // 顔写真本体とオーバーレイに使用する画像を取得
  const avatarLeftPosition = 8;
  const avatarOverlayLeftPosition = 40;
  const avatarImgs = Result.all(
    await skin.crop(cropRegion(avatarLeftPosition)),
    await skin.crop(cropRegion(avatarOverlayLeftPosition))
  );
  if (avatarImgs.isErr) return avatarImgs;

  const encodeUris = await Promise.all(
    avatarImgs.value().map((img) => img.encodeURI())
  );
  const encodeUriErrors = encodeUris.filter((img) => img.isErr);
  if (encodeUriErrors.length > 0) return encodeUriErrors[0];

  return ok(encodeUris.map((img) => img.value()));
}

/** In Source Testing */
if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;

  const players: { name: string; uuid: string }[] = [
    { name: 'CivilTT', uuid: '7aa8d952-5617-4a8c-8f4f-8761999a1f1a' },
    { name: 'txkodo', uuid: 'e19851cc-9493-4875-8d67-493b8474564f' },
  ];

  test.each(players)('searchCheck', async ({ name, uuid }) => {
    expect((await searchPlayerFromName(name)).value().uuid).toBe(uuid);
    expect(
      (await searchPlayerFromUUID(PlayerUUID.parse(uuid))).value().name
    ).toBe(name);
  });
}
