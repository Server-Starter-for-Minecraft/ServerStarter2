import { z } from 'zod';
import { PlayerName, PlayerUUID } from '../../schema/player';
import { err, ok, Result } from '../../util/base';
import { Bytes } from '../../util/binary/bytes';
import { fromBase64 } from '../../util/binary/converter/base64';
import { Json } from '../../util/binary/json';
import { Png } from '../../util/binary/png';
import { Url } from '../../util/binary/url';
import { formatUUID } from '../../util/random/uuid';

const UserProfile = z.object({
  name: PlayerName,
  id: PlayerUUID,
});
type UserProfile = z.infer<typeof UserProfile>;

/** mojangのapiからプレイヤーの名前で検索(過去の名前も検索可能) 戻り値のnameは現在の名前 */
export async function usernameToUUID(
  username: string
): Promise<Result<UserProfile>> {
  const url = `https://api.mojang.com/users/profiles/minecraft/${username}`;
  const res = await new Url(url).into(Bytes);
  if (res.isErr) return res;

  const resTxt = res.value().toStr();
  if (resTxt.isErr) return resTxt;

  // 1分あたり200リクエストの制限に抵触した場合
  if (resTxt.value().startsWith('<!DOCTYPE')) {
    return err.error('USER_PROFILE_REQUEST_IS_BLOCKED');
  }

  // 無効な名前の場合
  const invalidNameJson = new Json(z.object({ path: z.string() }));
  if ((await res.value().into(invalidNameJson)).isOk) {
    return err.error('INVALID_USER_NAME');
  }

  const userprofileJson = new Json(
    z.object({ name: z.string(), id: z.string() })
  );
  const jsonData = await res.value().into(userprofileJson);
  if (jsonData.isErr) return jsonData;

  const parseRes = Result.all(
    Result.fromZod(PlayerName.safeParse(jsonData.value().name)),
    Result.fromZod(PlayerUUID.safeParse(formatUUID(jsonData.value().id)))
  );
  if (parseRes.isErr) return parseRes;
  return ok({
    name: parseRes.value()[0],
    id: parseRes.value()[1],
  });
}

const Profile = z.object({
  id: z.string(),
  name: PlayerName,
  properties: z
    .object({
      name: z.enum(['textures']),
      value: z.string(),
    })
    .array(),
});
type Profile = z.infer<typeof Profile>;

const ProfileTextures = z.object({
  timestamp: z.number(),
  profileId: z.string(),
  profileName: z.string(),
  textures: z.object({
    SKIN: z
      .object({
        url: z.string(),
        metadata: z
          .object({
            model: z.enum(['slim']),
          })
          .optional(),
      })
      .optional(),
    CAPE: z
      .object({
        url: z.string(),
      })
      .optional(),
  }),
});
type ProfileTextures = z.infer<typeof ProfileTextures>;

type PlayerProfile = {
  uuid: PlayerUUID;
  name: PlayerName;
  slim: boolean;
  skin?: Png;
};

/**
 * mojangのapiからUUIDでプレイヤー情報を取得
 *
 * ※短時間に大量のリクエストを送ってもエラーにならないことを確認済み（24/08/03 現在）
 */
export async function getProfile(
  id: PlayerUUID
): Promise<Result<PlayerProfile>> {
  const profileJson = new Json(Profile);
  const res = await new Url(
    `https://sessionserver.mojang.com/session/minecraft/profile/${id}`
  ).into(Bytes);
  if (res.isErr) return res;

  const profile = await res.value().into(profileJson);
  if (profile.isErr) return profile;

  const profileTexturesJson = new Json(ProfileTextures);
  const textures = await Bytes.fromString(profile.value().properties[0].value)
    .convert(fromBase64())
    .into(profileTexturesJson);
  if (textures.isErr) return textures;

  const name = profile.value().name;
  const skin = textures.value().textures.SKIN;

  if (skin === undefined) {
    const slim = getDefaultIsSlim(id.replace('-', ''));
    return ok({ uuid: id, name, slim });
  } else {
    const slim = skin.metadata?.model === 'slim';
    const skin_image = await new Url(skin.url).into(Png);
    if (skin_image.isErr) return skin_image;
    return ok({ uuid: id, name, slim, skin: skin_image.value() });
  }
}

// https://github.com/crafatar/crafatar/blob/9d2fe0c45424de3ebc8e0b10f9446e7d5c3738b2/lib/skins.js#L90-L108
// returns "alex" or "steve" calculated by the +uuid+
// ハイフンなしuuid
function getDefaultIsSlim(uuid: string) {
  // great thanks to Minecrell for research into Minecraft and Java's UUID hashing!
  // https://git.io/xJpV
  // MC uses `uuid.hashCode() & 1` for alex
  // that can be compacted to counting the LSBs of every 4th byte in the UUID
  // an odd sum means alex, an even sum means steve
  // XOR-ing all the LSBs gives us 1 for alex and 0 for steve
  const slim =
    parseInt(uuid[7], 16) ^
    parseInt(uuid[15], 16) ^
    parseInt(uuid[23], 16) ^
    parseInt(uuid[31], 16);
  return slim ? true : false;
}

/** In Source Testing */
if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;

  const testPlayer = {
    name: 'CivilTT',
    uuid: PlayerUUID.parse('7aa8d952-5617-4a8c-8f4f-8761999a1f1a'),
  };

  // 不用意に実行するとBANされる危険性があるため普段はスキップ
  test.skip('mojang api (UsernameToUUID)', async () => {
    // 210回リクエストを送り，エラーの内容を調査
    const processes = [];
    const REQUEST_TIMES = 210;
    for (let i = 0; i < REQUEST_TIMES; i++) {
      processes.push(usernameToUUID(testPlayer.name));
    }
    const res = await Promise.all(processes);

    // エラーの内容をチェック
    expect(res.filter((obj) => obj.isErr)[0].error().name).toBe(
      'USER_PROFILE_REQUEST_IS_BLOCKED'
    );
  });

  // 不用意に実行するとBANされる危険性があるため普段はスキップ
  test.skip(
    'mojang api (getProfile)',
    async () => {
      // 1000回リクエストを送り，エラーの内容を調査
      const processes = [];
      const REQUEST_TIMES = 1000;
      for (let i = 0; i < REQUEST_TIMES; i++) {
        processes.push(getProfile(testPlayer.uuid));
      }
      const res = await Promise.all(processes);

      // エラーをチェック
      // 1000回リクエストを送ってもエラーが起きなかったため，下記は失敗するテスト
      expect(res.filter((obj) => obj.isErr).length > 0).toBe(true);
    },
    1000 * 100
  );

  test('get user data', async () => {
    const validUser = await usernameToUUID(testPlayer.name);
    expect(validUser.isOk).toBe(true);
    expect(validUser.value().id).toBe(testPlayer.uuid);

    const invalidUser = await usernameToUUID('a');
    expect(invalidUser.isErr).toBe(true);
    expect(invalidUser.error().message).toBe('INVALID_USER_NAME');
  });
}
