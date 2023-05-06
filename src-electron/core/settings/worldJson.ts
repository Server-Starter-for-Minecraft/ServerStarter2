import { Failable, isFailure } from '../../api/failable';
import { Path } from '../../util/path';
import { WorldSettings } from 'src-electron/schema/world';
import {
  FabricVersion,
  ForgeVersion,
  MohistmcVersion,
  PapermcVersion,
  SpigotVersion,
  VanillaVersion,
  Version,
} from 'src-electron/schema/version';
import {
  FAIL,
  Fixer,
  arrayFixer,
  booleanFixer,
  literalFixer,
  numberFixer,
  objectFixer,
  optionalFixer,
  recordFixer,
  stringFixer,
  unionFixer,
} from '../../util/detaFixer/fixer';
import { MemorySettings } from 'src-electron/schema/memory';
import {
  OpSetting,
  Player,
  PlayerGroupSetting,
  PlayerSetting,
} from 'src-electron/schema/player';
import { systemSettings } from '../stores/system';
import { GithubRemote, Remote } from 'src-electron/schema/remote';
import { ServerPropertiesMap } from 'src-electron/schema/serverproperty';

export const server_settings_file_name = 'server_settings.json';

export function getWorldJsonPath(cwd: Path) {
  return cwd.child(server_settings_file_name);
}

export async function loadWorldJson(
  cwd: Path
): Promise<Failable<WorldSettings>> {
  const jsonpath = getWorldJsonPath(cwd);
  if (!jsonpath.exists()) return new Error(`${jsonpath.str()} not exists.`);

  const json = await jsonpath.readJson<WorldSettings>();
  if (isFailure(json)) return json;

  const fixed = worldSettingsFixer()(json);
  if (fixed === FAIL)
    return new Error(
      `failed to fix data as WorldSettings: ${JSON.stringify(json)}`
    );

  return json;
}

export async function saveWorldJson(cwd: Path, json: WorldSettings) {
  const jsonpath = getWorldJsonPath(cwd);
  await jsonpath.writeText(JSON.stringify(json));
}

const memorySettingsFixer = (): Fixer<MemorySettings> =>
  objectFixer<MemorySettings>(
    {
      size: numberFixer(2),
      unit: literalFixer(
        ['', 'B', 'KB', 'MB', 'GB', 'TB', 'K', 'M', 'G', 'T'],
        'GB'
      ),
    },
    true
  );

const opSettingFixer = (): Fixer<OpSetting | FAIL> =>
  objectFixer<OpSetting>(
    {
      level: literalFixer([1, 2, 3, 4]),
      bypassesPlayerLimit: booleanFixer(false),
    },
    true
  );

const playerGroupSettingFixer = (): Fixer<PlayerGroupSetting | FAIL> =>
  objectFixer<PlayerGroupSetting>(
    {
      name: stringFixer(),
      uuid: stringFixer(),
      op: optionalFixer(opSettingFixer()),
      whitelist: booleanFixer(false),
    },
    true
  );

const playerSettingFixer = (): Fixer<PlayerSetting | FAIL> =>
  objectFixer<PlayerSetting>(
    {
      name: stringFixer(),
      uuid: stringFixer(),
      op: optionalFixer(opSettingFixer()),
      whitelist: booleanFixer(false),
    },
    true
  );

const playerFixer = (): Fixer<Player | FAIL> =>
  objectFixer<Player>(
    {
      name: stringFixer(),
      uuid: stringFixer(),
    },
    true
  );

const javaArgumentsFixer = (): Fixer<string | undefined> => {
  const sys = systemSettings.get('world').javaArguments;
  if (sys === undefined) return optionalFixer(stringFixer());
  return stringFixer(sys);
};

const vanillaVersionFixer = (): Fixer<VanillaVersion | FAIL> =>
  objectFixer<VanillaVersion>(
    {
      id: stringFixer(),
      type: literalFixer(['vanilla']),
      release: booleanFixer(),
    },
    false
  );

const spigotVersionFixer = (): Fixer<SpigotVersion | FAIL> =>
  objectFixer<SpigotVersion>(
    {
      id: stringFixer(),
      type: literalFixer(['spigot']),
    },
    false
  );

const papermcVersionFixer = (): Fixer<PapermcVersion | FAIL> =>
  objectFixer<PapermcVersion>(
    {
      id: stringFixer(),
      type: literalFixer(['papermc']),
      build: numberFixer(),
    },
    false
  );

const forgeVersionFixer = (): Fixer<ForgeVersion | FAIL> =>
  objectFixer<ForgeVersion>(
    {
      id: stringFixer(),
      type: literalFixer(['forge']),
      forge_version: stringFixer(),
    },
    false
  );

const mohistmcVersionFixer = (): Fixer<MohistmcVersion | FAIL> =>
  objectFixer<MohistmcVersion>(
    {
      id: stringFixer(),
      type: literalFixer(['mohistmc']),
      forge_version: stringFixer(),
      number: numberFixer(),
    },
    false
  );

const fabricVersionFixer = (): Fixer<FabricVersion | FAIL> =>
  objectFixer<FabricVersion>(
    {
      id: stringFixer(),
      type: literalFixer(['fabric']),
      release: booleanFixer(),
      loader: stringFixer(),
      installer: stringFixer(),
    },
    false
  );

const versionFixer = (): Fixer<Version | FAIL> =>
  unionFixer(
    vanillaVersionFixer(),
    spigotVersionFixer(),
    papermcVersionFixer(),
    forgeVersionFixer(),
    mohistmcVersionFixer(),
    fabricVersionFixer()
  );

const githubRemoteFixer = (): Fixer<GithubRemote | FAIL> =>
  objectFixer<GithubRemote>(
    {
      type: literalFixer(['github']),
      owner: stringFixer(),
      repo: stringFixer(),
      branch: stringFixer(),
    },
    false
  );

const remoteFixer = (): Fixer<Remote | FAIL> => githubRemoteFixer();

const serverPropertiesMapFixer = (): Fixer<ServerPropertiesMap> =>
  recordFixer<string, string | number | boolean>(
    unionFixer(stringFixer(), numberFixer(), booleanFixer()),
    true
  );

const worldSettingsFixer = (): Fixer<WorldSettings | FAIL> =>
  objectFixer<WorldSettings>(
    {
      memory: memorySettingsFixer(),
      javaArguments: javaArgumentsFixer(),
      version: versionFixer(),
      remote: optionalFixer(remoteFixer()),
      last_date: optionalFixer(numberFixer()),
      last_user: optionalFixer(playerFixer()),
      using: optionalFixer(booleanFixer()),
      properties: serverPropertiesMapFixer(),
      players: arrayFixer(playerSettingFixer(), true),
    },
    false
  );

export const testWorldSettingsFixer = worldSettingsFixer;
