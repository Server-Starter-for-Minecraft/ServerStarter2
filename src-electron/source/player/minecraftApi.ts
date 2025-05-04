import { z } from 'zod';
import { PlayerUUID } from '../../schema/brands';
import { BytesData } from '../../util/binary/bytesData';
import { Png } from '../../util/binary/png';
import { errorMessage } from '../../util/error/construct';
import { isError } from '../../util/error/error';
import { Failable } from '../../util/error/failable';

const ApiRes = z.object({
  name: z.string(),
  id: PlayerUUID,
});
type ApiRes = z.infer<typeof ApiRes>;

/** mojangのapiからプレイヤーの名前で検索(過去の名前も検索可能) 戻り値のnameは現在の名前 */
export async function UsernameToUUID(
  username: string
): Promise<Failable<{ name: string; uuid: PlayerUUID }>> {
  const url = `https://api.mojang.com/users/profiles/minecraft/${username}`;
  const res = await BytesData.fromURL(url);
  if (isError(res)) {
    // エラーコード 429 (Too Many Requests) が返ってきた場合
    if (res.key === 'data.url.fetch' && res.arg.status === 429) {
      return errorMessage.data.url.tooManyRequest({ url: url });
    }
    return errorMessage.value.playerName({
      value: username,
    });
  }

  const jsonData = await res.json(ApiRes);
  if (isError(jsonData)) return jsonData;
  return {
    name: jsonData.name,
    uuid: jsonData.id,
  };
}

const Profile = z.object({
  id: PlayerUUID,
  name: z.string(),
  properties: z.array(
    z.object({
      name: z.literal('textures'),
      value: z.string(),
    })
  ),
});
type Profile = z.infer<typeof Profile>;

const ProfileTextures = z.object({
  timestamp: z.string(),
  profileId: PlayerUUID,
  profileName: z.string(),
  textures: z.object({
    SKIN: z
      .object({
        url: z.string(),
        metadata: z
          .object({
            model: z.literal('slim'),
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

export type PlayerProfile = {
  uuid: PlayerUUID;
  name: string;
  slim: boolean;
  skin?: Png;
};

/** mojangのapiからUUIDでプレイヤー情報を取得 */
// TODO: 1分当たり200リクエスト制限があるので対応
export async function GetProfile(id: string): Promise<Failable<PlayerProfile>> {
  const res = await BytesData.fromURL(
    `https://sessionserver.mojang.com/session/minecraft/profile/${id}`
  );
  if (isError(res)) return res;

  const profile = await res.json(Profile);
  if (isError(profile)) return profile;

  const texturesB64 = await BytesData.fromBase64(profile.properties[0].value);
  if (isError(texturesB64)) return texturesB64;

  const textures = await texturesB64.json(ProfileTextures);
  if (isError(textures)) return textures;

  const skin = textures.textures.SKIN;

  const uuid = PlayerUUID.safeParse(textures.profileId);
  const name = textures.profileName;

  if (!uuid.success) {
    return errorMessage.value.playerUUID({
      value: textures.profileId,
    });
  }

  if (skin === undefined) {
    const slim = getDefaultIsSlim(id);
    return { uuid: uuid.data, name, slim };
  } else {
    const slim = skin.metadata?.model === 'slim';
    const skin_image = await BytesData.fromURL(skin.url);
    if (isError(skin_image)) return skin_image;
    const skin_png = await skin_image.png();
    if (isError(skin_png)) return skin_png;
    return { uuid: uuid.data, name, slim, skin: skin_png };
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
