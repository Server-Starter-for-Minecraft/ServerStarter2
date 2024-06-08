import {
  DatapackData,
  ModData,
  PluginData,
} from 'app/src-electron/schema/filedata';
import { Version } from 'app/src-electron/schema/version';
import { tError } from 'src/i18n/utils/tFunc';
import { useConsoleStore } from 'src/stores/ConsoleStore';
import { useMainStore } from 'src/stores/MainStore';
import { useSystemStore } from 'src/stores/SystemStore';
import { checkError } from 'src/components/Error/Error';

export type ContentsData = DatapackData | ModData | PluginData;
export type ContentsType = 'datapack' | 'plugin' | 'mod';

type contentExists = {
  [ver in Version['type']]: {
    datapack: boolean;
    plugin: boolean;
    mod: boolean;
  };
};
export const isContentsExists: contentExists = {
  vanilla: { datapack: true, plugin: false, mod: false },
  spigot: { datapack: true, plugin: true, mod: false },
  papermc: { datapack: true, plugin: true, mod: false },
  forge: { datapack: true, plugin: false, mod: true },
  mohistmc: { datapack: true, plugin: true, mod: true },
  fabric: { datapack: true, plugin: false, mod: true },
};

/**
 * 保存済みデータのフォルダを開く
 *
 * Stopの時にはキャッシュ側のフォルダを開き，動作中はワールドデータ側のフォルダを開く
 */
export async function openSavedFolder(cType: ContentsType) {
  const getPath = async () => {
    const mainStore = useMainStore();
    const consoleStore = useConsoleStore();
    switch (consoleStore.status(mainStore.world.id)) {
      case 'Stop':
        const sysStore = useSystemStore();
        return sysStore.staticResouces.paths.cache[cType];
      default:
        return await window.API.invokeGetWorldPaths(mainStore.world.id, `${cType}s`);
    }
  };
  const path = await getPath();

  checkError(
    path,
    async (p) => {
      const res = await window.API.sendOpenFolder(p, true);
      checkError(res, undefined, (e) => tError(e));
    },
    (e) => tError(e)
  );
}
