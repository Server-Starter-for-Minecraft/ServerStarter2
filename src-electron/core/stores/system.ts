import Store from 'electron-store';
import { DEFAULT_MEMORY, DEFAULT_WORLD_CONTAINER, mainPath } from '../const';
import { SystemSettings } from 'src-electron/schema/system';
import { fix } from 'src-electron/util/fix';
import { objectFixer } from 'app/src-electron/util/detaFixer/fixer';

export async function setSystemSettings(
  settings: SystemSettings
): Promise<SystemSettings> {
  systemSettings.store = settings;
  return settings;
}

export async function getSystemSettings(): Promise<SystemSettings> {
  return systemSettings.store;
}

function fixSystemSettings() {
  const store = systemSettings.store;

  //console.log(store);

  const fixed = fix<SystemSettings>(store, {
    container: { default: DEFAULT_WORLD_CONTAINER, custom: {} },
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
    cache: {},
  });

  systemSettings.store = fixed;
}
export const systemSettings = new Store<SystemSettings>({
  cwd: mainPath.str(),
  name: 'serverstarter',
  fileExtension: 'json',
});

// 足りない情報を補完する
fixSystemSettings();
