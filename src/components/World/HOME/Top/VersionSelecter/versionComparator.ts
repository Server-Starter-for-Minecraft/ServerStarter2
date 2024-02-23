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
function newerVerIdx<T>(ops: any[], ver_1: T, ver1: T, prop?: keyof T) {
  const idx_1 = ops.indexOf(prop === void 0 ? ver_1 : ver_1[prop]);
  const idx1 = ops.indexOf(prop === void 0 ? ver1 : ver1[prop]);

  const returnVal = idx_1 - idx1;
  return idx_1 === idx1 ? 0 : returnVal / Math.abs(returnVal);
}

/**
 * 配列内のすべてのデータをHash化して，Hashの一覧を返す
 */
export function getHashs<T>(ops: T[]) {
  return Promise.all(ops.map((v) => getHashData(v)));
}

export function openVerTypeWarningDialog<T extends Version['type']>(
  $q: QVueGlobals,
  currentType: T,
  newType: T
) {
  const mainStore = useMainStore();
  __openWarningDialog(
    $q,
    [currentType, newType],
    currentType,
    newType,
    () => {
      mainStore.selectedVersionType = newType;
    },
    'versionChange'
  );
}

/**
 * 警告画面は新規ワールド（配布ワールドやバックアップを含む）ではないワールドに対して，バージョンダウンを行うときに警告する
 *
 * ただし，複製で追加された新規ワールドに対しては，通常ワールド同様に警告を出す
 */
export function openWarningDialog<T extends Version>(
  $q: QVueGlobals,
  ops: any[],
  currentVer: T,
  newVer: T,
  prop: keyof T
) {
  const mainStore = useMainStore();
  __openWarningDialog(
    $q,
    ops,
    currentVer,
    newVer,
    () => {
      mainStore.world.version = newVer;
    },
    'versionDown',
    prop
  );
}

function __openWarningDialog<T>(
  $q: QVueGlobals,
  ops: any[],
  currentVal: T,
  newVal: T,
  successFunc: () => void,
  dialogTextKey: string,
  prop?: keyof T
) {
  const verComp = newerVerIdx(ops, currentVal, newVal, prop);
  if (verComp === -1) {
    $q.dialog({
      component: DangerDialog,
      componentProps: {
        dialogTitle: $T(`home.${dialogTextKey}.title`),
        dialogDesc: $T(`home.${dialogTextKey}.desc`),
        okBtnTxt: $T(`home.${dialogTextKey}.okbtn`),
      } as dangerDialogProp,
    }).onOk(() => {
      successFunc();
    });
  } else {
    successFunc();
  }
}
