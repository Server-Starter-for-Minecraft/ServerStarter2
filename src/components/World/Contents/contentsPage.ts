import { QVueGlobals } from 'quasar';
import { values } from 'app/src-public/scripts/obj/obj';
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
import AddContentsDialog from './AddContentsFromWorld/AddContentsDialog.vue';
import {
  AddContentProp,
  AddContentsReturns,
} from './AddContentsFromWorld/iAddContents';

export type ContentsData = DatapackData | ModData | PluginData;
export type ContentsType = 'datapack' | 'plugin' | 'mod';

type ContentExists = {
  [ver in Version['type']]: {
    datapack: boolean;
    plugin: boolean;
    mod: boolean;
  };
};
export const isContentsExists: ContentExists = {
  vanilla: { datapack: true, plugin: false, mod: false },
  spigot: { datapack: true, plugin: true, mod: false },
  papermc: { datapack: true, plugin: true, mod: false },
  forge: { datapack: true, plugin: false, mod: true },
  mohistmc: { datapack: true, plugin: true, mod: true },
  fabric: { datapack: true, plugin: false, mod: true },
};

export function isSameContent(
  c1: AllFileData<ContentsData>,
  c2: AllFileData<ContentsData>
) {
  // TODO: HASHによる検証に切り替える
  return c1.name === c2.name;
}

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
  values(mainStore.allWorlds.readonlyWorlds).forEach((wItem) => {
    if (wItem.type === 'abbr') {
      return;
    }

    wItem.world.additional[`${cType}s`].forEach((c) => {
      const sameContentIdxInReturn = returnArray.findIndex((_c) =>
        isSameContent(_c.file, c)
      );
      if (sameContentIdxInReturn > -1) {
        returnArray[sameContentIdxInReturn].wNames.push(wItem.world.name);
      } else {
        returnArray.push(__converter(c, wItem.world.name));
      }
    });
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
        (c) => addNewContent2World(cType, c),
        (e) => tError(e, { ignoreErrors: ['data.path.dialogCanceled'] })
      );
      break;
    case 'plugin':
      checkError(
        await window.API.invokePickDialog({ type: 'plugin' }),
        (c) => addNewContent2World(cType, c),
        (e) => tError(e, { ignoreErrors: ['data.path.dialogCanceled'] })
      );
      break;
    case 'mod':
      checkError(
        await window.API.invokePickDialog({ type: 'mod' }),
        (c) => addNewContent2World(cType, c),
        (e) => tError(e, { ignoreErrors: ['data.path.dialogCanceled'] })
      );
      break;
  }
}

/**
 * コンテンツをパスから新規導入
 */
export async function importNewContentFromPath(
  cType: ContentsType,
  path: string
) {
  // エラー回避のため、意図的にswitchで分岐して表現を分かりやすくしている
  switch (cType) {
    case 'datapack':
      checkError(
        await window.API.invokeGetAdditionalContent('datapack', path),
        (c) => addNewContent2World(cType, c),
        (e) => tError(e, { ignoreErrors: ['data.path.dialogCanceled'] })
      );
      break;
    case 'plugin':
      checkError(
        await window.API.invokeGetAdditionalContent('plugin', path),
        (c) => addNewContent2World(cType, c),
        (e) => tError(e, { ignoreErrors: ['data.path.dialogCanceled'] })
      );
      break;
    case 'mod':
      checkError(
        await window.API.invokeGetAdditionalContent('mod', path),
        (c) => addNewContent2World(cType, c),
        (e) => tError(e, { ignoreErrors: ['data.path.dialogCanceled'] })
      );
      break;
  }
}

/**
 * 複数のコンテンツをまとめて追加するためのダイアログを表示
 */
export function importMultipleContents($q: QVueGlobals, cType: ContentsType) {
  // TODO: ワールド一覧 -> 導入コンテンツの選択 -> 導入 のダイアログを作成
  $q.dialog({
    component: AddContentsDialog,
    componentProps: {
      contentType: cType,
    } as AddContentProp,
  }).onOk((p: AddContentsReturns) => {
    p.importContents.forEach((content) => addNewContent2World(cType, content));
  });
}

/**
 * 追加された新規コンテンツを各種データベースに登録
 */
function addNewContent2World<T extends ContentsData>(
  cType: ContentsType,
  content: NewFileData<T> | AllFileData<T>
) {
  // 当該ワールドに追加
  addContent(cType, content);

  // システムに追加
  const sysStore = useSystemStore();
  if (
    (sysStore.cacheContents[`${cType}s`] as CacheFileData<T>[]).some((c) =>
      isSameContent(c, content)
    )
  ) {
    addCacheContent(cType, content);
  }
}

/**
 * 指定したコンテンツを追加する
 */
export function addContent(
  cType: ContentsType,
  content: AllFileData<ContentsData>
) {
  const mainStore = useMainStore();
  if (mainStore.world) {
    (
      mainStore.world.additional[`${cType}s`] as AllFileData<ContentsData>[]
    ).push(content);
  }
}

/**
 * 指定したキャッシュコンテンツを追加する
 */
function addCacheContent(
  cType: ContentsType,
  content: AllFileData<ContentsData>
) {
  const newContent = (): CacheFileData<ContentsData> => {
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
  };

  const sysStore = useSystemStore();
  (sysStore.cacheContents[`${cType}s`] as CacheFileData<ContentsData>[]).push(
    newContent()
  );
}

export function deleteContent(
  $q: QVueGlobals,
  cType: ContentsType,
  content: AllFileData<ContentsData>
) {
  const mainStore = useMainStore();
  const contentsStore = useContentsStore();

  function __delete() {
    if (!mainStore.world) {
      return;
    }

    mainStore.world.additional[`${cType}s`].splice(
      mainStore.world.additional[`${cType}s`].findIndex((c) =>
        isSameContent(c, content)
      ),
      1
    );
  }

  // 起動前に登録された追加コンテンツに対して警告を出さない
  if (contentsStore.isNewContents(content)) {
    __delete();
  } else {
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
    mainStore.selectedWorldID,
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
