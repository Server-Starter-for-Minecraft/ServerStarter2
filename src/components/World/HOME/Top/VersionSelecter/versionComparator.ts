import { QVueGlobals } from 'quasar';
import { Version } from 'app/src-electron/schema/version';
import { $T } from 'src/i18n/utils/tFunc';
import { getHashData } from 'src/scripts/obj';
import { useMainStore } from 'src/stores/MainStore';
import { dangerDialogProp } from 'src/components/util/danger/iDangerDialog';
import DangerDialog from 'src/components/util/danger/DangerDialog.vue';

/**
 * 新しい方のバージョンの引数番号を返す
 *
 * `ops`にはバージョン一覧を格納するが，これは最新バージョンが0番目に来ている必要アリ
 *
 * - `ver_1`が新しい場合，戻り値は`-1`
 * - `ver1`が新しい場合，戻り値は`1`
 * - 両者が同じ場合，戻り値は`0`
 */
function newerVerIdx<T extends Version>(
  ops: any[],
  ver_1: T,
  ver1: T,
  prop: keyof T
) {
  const idx_1 = ops.indexOf(ver_1[prop]);
  const idx1 = ops.indexOf(ver1[prop]);

  const returnVal = idx_1 - idx1;
  return idx_1 === idx1 ? 0 : returnVal / Math.abs(returnVal);
}

/**
 * 配列内のすべてのデータをHash化して，Hashの一覧を返す
 */
export function getHashs<T>(ops: T[]) {
  return Promise.all(ops.map((v) => getHashData(v)));
}

/**
 * 警告画面は新規ワールド（配布ワールドやバックアップを含む）ではないワールドに対して，バージョンダウンを行うときに警告する
 *
 * ただし，複製で追加された新規ワールドに対しては，通常ワールド同様に警告を出す
 */
export async function openWarningDialog<T extends Version>(
  $q: QVueGlobals,
  ops: any[],
  currentVer: T,
  newVer: T,
  prop: keyof T
) {
  const mainStore = useMainStore();
  const verComp = newerVerIdx(ops, currentVer, newVer, prop);
  if (!mainStore.isNewWorld(mainStore.world.id) && verComp === -1) {
    $q.dialog({
      component: DangerDialog,
      componentProps: {
        dialogTitle: $T('home.versionDown.title'),
        dialogDesc: $T('home.versionDown.desc'),
        okBtnTxt: $T('home.versionDown.okbtn'),
      } as dangerDialogProp,
    }).onOk(() => {
      mainStore.world.version = newVer;
    });
  }
  else {
    mainStore.world.version = newVer;
  }
}
