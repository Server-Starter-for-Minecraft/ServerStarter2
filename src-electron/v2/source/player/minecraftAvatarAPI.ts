import sharp from 'sharp';
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
export async function UsernameToUUID(
  username: string
): Promise<Result<UserProfile>> {
  const url = `https://api.mojang.com/users/profiles/minecraft/${username}`;
  const res = await new Url(url).into(Bytes);
  if (res.isErr) {
    // TODO: 1分あたり200リクエストの制限に抵触した場合とエラーを使い分ける？
    return err.error('INVALID_USER_NAME');
  }

  const userprofileJson = new Json(
    z.object({ name: z.string(), id: z.string() })
  );
  const jsonData = await res.value().into(userprofileJson);
  if (jsonData.isErr) return jsonData;

  const parseRes = Result.all(
    Result.fromZod(PlayerName.safeParse(formatUUID(jsonData.value().name))),
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

/** mojangのapiからUUIDでプレイヤー情報を取得 */
// TODO: 1分当たり200リクエスト制限があるので対応
export async function GetProfile(
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
    // TODO: PNG化の処理をStreamを使ったものに変更
    const slim = skin.metadata?.model === 'slim';
    const skin_image = await new Url(skin.url).into(Bytes);
    if (skin_image.isErr) return skin_image;

    const skin_png = new Png(sharp(skin_image.value().data));
    return ok({ uuid: id, name, slim, skin: skin_png });
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
