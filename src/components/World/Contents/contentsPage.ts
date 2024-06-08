import {
  AllFileData,
  CacheFileData,
  DatapackData,
  ModData,
  NewFileData,
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
 * コンテンツを新規導入
 */
export async function importNewContent(cType: ContentsType, isFile = false) {
  // エラー回避のため、意図的にswitchで分岐して表現を分かりやすくしている
  switch (cType) {
    case 'datapack':
      checkError(
        await window.API.invokePickDialog({ type: 'datapack', isFile: isFile }),
        (c) => addContent2World(cType, c),
        (e) => tError(e, { ignoreErrors: ['data.path.dialogCanceled'] })
      );
      break;
    case 'plugin':
      checkError(
        await window.API.invokePickDialog({ type: 'plugin' }),
        (c) => addContent2World(cType, c),
        (e) => tError(e, { ignoreErrors: ['data.path.dialogCanceled'] })
      );
      break;
    case 'mod':
      checkError(
        await window.API.invokePickDialog({ type: 'mod' }),
        (c) => addContent2World(cType, c),
        (e) => tError(e, { ignoreErrors: ['data.path.dialogCanceled'] })
      );
      break;
  }
}

/**
 * コンテンツを各種データベースに登録
 */
function addContent2World(
  cType: ContentsType,
  content: NewFileData<ContentsData>
) {
  const sysStore = useSystemStore();
  const mainStore = useMainStore();
  function NewFile2CacheFile(): CacheFileData<ContentsData> {
    if (content.kind === 'datapack') {
      return {
        kind: 'datapack',
        description: content.description,
        type: 'system',
        name: content.name,
        ext: content.ext,
        isFile: content.isFile,
      };
    } else {
      return {
        kind: content.kind,
        type: 'system',
        name: content.name,
        ext: content.ext,
        isFile: content.isFile,
      };
    }
  }
  (mainStore.world.additional[`${cType}s`] as AllFileData<ContentsData>[]).push(content);
  (sysStore.cacheContents[`${cType}s`] as CacheFileData<ContentsData>[]).push(
    NewFile2CacheFile()
  );
}

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
        return await window.API.invokeGetWorldPaths(
          mainStore.world.id,
          `${cType}s`
        );
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
