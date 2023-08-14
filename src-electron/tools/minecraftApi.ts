import { Failable } from '../util/error/failable';
import { PlayerUUID } from '../schema/brands';
import { BytesData } from '../util/bytesData';
import { Png } from '../util/png';
import { formatUUID } from './uuid';
import { isError } from '../util/error/error';
import { errorMessage } from '../util/error/construct';

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

  const jsonData = await res.json<{ name: string; id: PlayerUUID }>();
  if (isError(jsonData)) return jsonData;
  return {
    name: jsonData.name,
    uuid: jsonData.id,
  };
}

type Profile = {
  id: PlayerUUID;
  name: string;
  properties: [
    {
      name: 'textures';
      value: string;
    }
  ];
};

type ProfileTextures = {
  timestamp: string;
  profileId: PlayerUUID;
  profileName: string;
  textures: {
    SKIN?: {
      url: string;
      metadata?: {
        model: 'slim';
      };
    };
    CAPE?: {
      url: string;
    };
  };
};

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

  const profile = await res.json<Profile>();
  if (isError(profile)) return profile;

  const texturesB64 = await BytesData.fromBase64(profile.properties[0].value);
  if (isError(texturesB64)) return texturesB64;

  const textures = await texturesB64.json<ProfileTextures>();
  if (isError(textures)) return textures;

  const skin = textures.textures.SKIN;

  const uuid = formatUUID(textures.profileId) as PlayerUUID;
  const name = textures.profileName;

  if (skin === undefined) {
    const slim = getDefaultIsSlim(id);
    return { uuid, name, slim };
  } else {
    const slim = skin.metadata?.model === 'slim';
    const skin_image = await BytesData.fromURL(skin.url);
    if (isError(skin_image)) return skin_image;
    const skin_png = await skin_image.png();
    if (isError(skin_png)) return skin_png;
    return { uuid, name, slim, skin: skin_png };
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
