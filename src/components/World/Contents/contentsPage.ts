import { useQuasar } from 'quasar';
import {
  AllFileData,
  CacheFileData,
  DatapackData,
  ModData,
  NewFileData,
  PluginData,
} from 'app/src-electron/schema/filedata';
import { Version } from 'app/src-electron/schema/version';
import { $T, tError } from 'src/i18n/utils/tFunc';
import { useMainStore } from 'src/stores/MainStore';
import { useSystemStore } from 'src/stores/SystemStore';
import { useContentsStore } from 'src/stores/WorldTabs/ContentsStore';
import { checkError } from 'src/components/Error/Error';
import { dangerDialogProp } from 'src/components/util/danger/iDangerDialog';
import DangerDialog from 'src/components/util/danger/DangerDialog.vue';

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
 * 既に存在するコンテンツ一覧を取得する
 */
export type OptContents = {
  wNames: string[];
  file: AllFileData<ContentsData>;
  name: string;
};
export function getAllContents(cType: ContentsType): OptContents[] {
  function __converter(
    content: AllFileData<ContentsData>,
    worldName?: string
  ): OptContents {
    return {
      wNames: worldName ? [worldName] : [],
      file: content,
      name: content.name,
    };
  }

  const sysStore = useSystemStore();
  const mainStore = useMainStore();

  // TODO: Hashが同じでもワールド（＝ShareWorld）ごとに名前が違うコンテンツはどのように表示？
  const returnArray = sysStore.cacheContents[`${cType}s`].map((c) =>
    __converter(c)
  );
  mainStore
    .getFromAllWorld((w) =>
      w.additional[`${cType}s`].map((c) => __converter(c, w.name))
    )
    .flat()
    .forEach((c) => {
      // TODO: 統合時の条件には，名前ではなく，Hashが同じコンテンツがすでに存在するか否かで検証する
      const sameContentIdxInReturn = returnArray.findIndex((_c) => _c.name === c.name)
      if (sameContentIdxInReturn > -1) {
        returnArray[sameContentIdxInReturn].wNames.push(c.wNames[0])
      } else {
        returnArray.push(c);
      }
    });
  return returnArray;
}

export const showingContentName = (content: AllFileData<ContentsData>) =>
  content.name.replace(/§./g, '').trim();
export const showingContentDescription = (content: AllFileData<ContentsData>) =>
  'description' in content ? content.description.replace(/§./g, '').trim() : '';

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
  (mainStore.world.additional[`${cType}s`] as AllFileData<ContentsData>[]).push(
    content
  );
  (sysStore.cacheContents[`${cType}s`] as CacheFileData<ContentsData>[]).push(
    NewFile2CacheFile()
  );
}

/**
 * 指定したコンテンツを追加する
 */
export function addContent(
  cType: ContentsType,
  content: AllFileData<ContentsData>
) {
  const mainStore = useMainStore();
  (mainStore.world.additional[`${cType}s`] as AllFileData<ContentsData>[]).push(
    content
  );
}

export function deleteContent(
  cType: ContentsType,
  content: AllFileData<ContentsData>
) {
  const mainStore = useMainStore();
  const contentsStore = useContentsStore();

  function __delete() {
    mainStore.world.additional[`${cType}s`].splice(
      mainStore.world.additional[`${cType}s`]
        .map((c) => c.name)
        .indexOf(content.name),
      1
    );
  }

  // 起動前に登録された追加コンテンツに対して警告を出さない
  if (contentsStore.isNewContents(content)) {
    __delete();
  } else {
    const $q = useQuasar();
    $q.dialog({
      component: DangerDialog,
      componentProps: {
        dialogTitle: $T('additionalContents.deleteDialog.title', {
          type: cType,
        }),
        dialogDesc: $T('additionalContents.deleteDialog.desc', {
          type: cType,
        }),
        okBtnTxt: $T('additionalContents.deleteDialog.okbtn'),
      } as dangerDialogProp,
    }).onOk(() => {
      __delete();
    });
  }
}

/**
 * 保存済みデータのフォルダを開く
 *
 * Stopの時にはキャッシュ側のフォルダを開き，動作中はワールドデータ側のフォルダを開く
 */
export async function openSavedFolder(cType: ContentsType) {
  const mainStore = useMainStore();
  const path = await window.API.invokeGetWorldPaths(
    mainStore.world.id,
    `${cType}s`
  );

  checkError(
    path,
    async (p) => {
      const res = await window.API.sendOpenFolder(p, true);
      checkError(res, undefined, (e) => tError(e));
    },
    (e) => tError(e)
  );
}
