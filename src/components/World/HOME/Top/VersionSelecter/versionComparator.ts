import { QVueGlobals } from 'quasar';
import { Version } from 'app/src-electron/schema/version';
import { $T } from 'src/i18n/utils/tFunc';
import { getHashData } from 'src/scripts/obj';
import { useMainStore } from 'src/stores/MainStore';
import { dangerDialogProp } from 'src/components/util/danger/iDangerDialog';
import DangerDialog from 'src/components/util/danger/DangerDialog.vue';

let firstSelectedVersion: Version;

/**
 * 新しい方のバージョンの引数番号を返す
 *
 * `ops`にはバージョン一覧を格納するが，これは最新バージョンが0番目に来ている必要アリ
 *
 * - `ver_1`が新しい場合，戻り値は`-1`
 * - `ver1`が新しい場合，戻り値は`1`
 * - 両者が同じ場合，戻り値は`0`
 */
export async function newerVerIdx<T extends Version>(
  ops: T[],
  ver_1: T,
  ver1: T
) {
  const hashs = await getHashs(ops);
  const idx_1 = hashs.indexOf(await getHashData(ver_1));
  const idx1 = hashs.indexOf(await getHashData(ver1));

  const returnVal = idx_1 - idx1;
  return idx_1 === idx1 ? 0 : returnVal / Math.abs(returnVal);
}

function getHashs<T extends Version>(ops: T[]) {
  return Promise.all(ops.map((v) => getHashData(v)));
}

/**
 * ワールド読み込み時に選択されているワールドを登録
 */
export function setCurrentServerVersion(ver: Version) {
  firstSelectedVersion = ver;
}

/**
 * 警告画面は新規ワールド（配布ワールドやバックアップを含む）ではないワールドに対して，バージョンダウンを行うときに警告する
 *
 * ただし，複製で追加された新規ワールドに対しては，通常ワールド同様に警告を出す
 */
export async function openWarningDialog<T extends Version>(
  $q: QVueGlobals,
  vers: T[],
  newVer: T
) {
  const mainStore = useMainStore();
  const verComp = await newerVerIdx(vers, firstSelectedVersion, newVer);
  if (!mainStore.isNewWorld(mainStore.world.id) && verComp === -1) {
    $q.dialog({
      component: DangerDialog,
      componentProps: {
        dialogTitle: $T('home.versionDown.title'),
        dialogDesc: $T('home.versionDown.desc'),
        okBtnTxt: $T('home.versionDown.okbtn'),
      } as dangerDialogProp,
    }).onCancel(() => {
      mainStore.world.version = firstSelectedVersion;
    });
  }
}
