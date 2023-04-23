import {
  FabricVersion,
  VanillaVersion,
  Version,
} from 'app/src-electron/api/scheme';
import { isFailure } from '../../../api/failable';
import { BytesData } from '../../utils/bytesData/bytesData';
import { getJavaComponent, vanillaVersionLoader } from './vanilla';
import { versionsPath } from '../const';
import { VersionLoader, genGetAllVersions } from './base';
import { Path } from '../../utils/path/path';
import { getVersionMainfest } from './mainfest';

export const fabricVersionLoader: VersionLoader = {
  /** fabricのサーバーデータをダウンロード */
  async readyVersion(version: FabricVersion) {},

  /** fabricのバージョンの一覧返す */
  getAllVersions: genGetAllVersions('fabric', getAllFabricVersions),

  async defineLevelName(worldPath) {},
};

type FabricVersionsGame = {
  version: string;
  stable: boolean;
}[];

const VERSIONS_URL = 'https://meta.fabricmc.net/v2/versions/game';

// TODO: ローカルに保存
async function getAllFabricVersions() {
  const data = await BytesData.fromURL(VERSIONS_URL);
  if (isFailure(data)) return data;

  const json = await data.json<FabricVersionsGame>();
  if (isFailure(json)) return json;

  const vanilla = await vanillaVersionLoader.getAllVersions();
  if (isFailure(vanilla)) return vanilla;

  const versions: FabricVersion[] = json
    .map((x) => vanilla.find((y) => y.id === x.version))
    .filter<Version>((x): x is Version => x !== undefined)
    .map(({ release, id }) => ({ id, type: 'fabric', release }));

  return versions;
}
