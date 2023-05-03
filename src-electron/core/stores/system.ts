import Store from 'electron-store';
import { SystemSettings } from 'app/src-electron/api/schema';
import { DEFAULT_MEMORY, mainPath } from '../const';
import { defaultServerProperties } from '../settings/properties';
import { deepCopy } from 'src/scripts/deepCopy';

export async function setSystemSettings(
  settings: SystemSettings
): Promise<undefined> {
  systemSettings.store = settings;
  return undefined;
}

export async function getSystemSettings(): Promise<SystemSettings> {
  return systemSettings.store;
}

export function fixSystemSettings() {
  const store = systemSettings.store;

  const fixed = fix<SystemSettings>(store, {
    container: { default: 'servers', custom: {} },
    player: { players: [], groups: [] },
    remote: { github: { accounts: [] } },
    world: {
      memory: DEFAULT_MEMORY,
      properties: defaultServerProperties,
    },
    user: {
      autoShutDown: false,
      eula: false,
      // デフォルト言語 ja で OK?
      language: 'ja',
      owner: undefined,
    },
  });

  systemSettings.store = fixed;
}

function fix<T extends { [x: string]: unknown }>(
  value: DeepPartial<T> | undefined,
  defaultValue: T
): T {
  if (value === undefined) return deepCopy(defaultValue);

  return Object.fromEntries(
    Object.entries(defaultValue).map(([k, v]) => {
      const val = value?.[k];

      if (v instanceof Array) {
        if (val instanceof Array) {
          return [k, val];
        }
        return [k, deepCopy(v)];
      }

      if (typeof v === 'object' && v !== null) {
        return [
          k,
          fix(val as { [x: string]: unknown }, v as { [x: string]: unknown }),
        ];
      }
      return [k, val ?? deepCopy(v)];
    })
  ) as T;
}

type DeepPartial<T> = T extends object
  ? { [P in keyof T]?: DeepPartial<T[P]> | undefined }
  : T;

export const systemSettings = new Store<SystemSettings>({
  cwd: mainPath.str(),
  name: 'serverstarter',
  fileExtension: 'json',
});

// 足りない情報を補完する
fixSystemSettings();
