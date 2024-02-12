<script setup lang="ts">
import { ref } from 'vue';
import { useQuasar } from 'quasar';
import {
  AllVanillaVersion,
  VanillaVersion,
} from 'app/src-electron/schema/version';
import { useMainStore } from 'src/stores/MainStore';
import { useConsoleStore } from 'src/stores/ConsoleStore';
import { dangerDialogProp } from 'src/components/util/danger/iDangerDialog';
import { newerVerIdx } from './versionComparator';
import SsSelect from 'src/components/util/base/ssSelect.vue';
import DangerDialog from 'src/components/util/danger/DangerDialog.vue';

interface Prop {
  versionData: AllVanillaVersion;
}
const prop = defineProps<Prop>();

const $q = useQuasar();
const mainStore = useMainStore();
const consoleStore = useConsoleStore();

const isRelease = ref(true);
const vanillaOps = () => {
  return prop.versionData?.map((ver) => {
    return { id: ver.id, type: 'vanilla' as const, release: ver.release };
  });
};
const latestReleaseID = vanillaOps().find((ops) => ops.release)?.id;

// vanillaでないときには最新のバージョンを割り当てる
if (mainStore.world.version.type !== 'vanilla') {
  mainStore.world.version =
    vanillaOps().find((ops) => ops.release) ?? vanillaOps()[0];
}
let currentVersion = mainStore.world.version;

/**
 * 警告画面は新規ワールド（配布ワールドやバックアップを含む）ではないワールドに対して，バージョンダウンを行うときに警告する
 * 
 * ただし，複製で追加された新規ワールドに対しては，通常ワールド同様に警告を出す
 */
async function openWarningDialog(newVer: VanillaVersion) {
  const verComp = await newerVerIdx(vanillaOps(), currentVersion, newVer);
  if (!mainStore.isNewWorld(mainStore.world.id) && verComp === -1) {
    $q.dialog({
      component: DangerDialog,
      componentProps: {
        dialogTitle: 'バージョンダウンの確認',
        dialogDesc:
          'サーバーのバージョンを下げる操作は，ワールドデータが破損する恐れがあります．<br>危険性を理解した上でバージョンの変更を行いますか？',
        okBtnTxt: '危険性を理解して変更する',
      } as dangerDialogProp,
    })
    .onOk(() => {
      currentVersion = newVer;
    })
    .onCancel(() => {
      mainStore.world.version = currentVersion;
    });
  } else {
    currentVersion = newVer;
  }
}
</script>

<template>
  <div class="row justify-between q-gutter-md items-center">
    <SsSelect
      v-model="mainStore.world.version"
      @update:model-value="(newVal) => openWarningDialog(newVal)"
      :options="
        vanillaOps()
          ?.filter((ver, idx) => !isRelease || idx == 0 || ver['release'])
          .map((ver, idx) => {
            return {
              data: ver,
              label:
                ver.id === latestReleaseID
                  ? `${ver.id}【${$t('home.version.latestRelease')}】`
                  : idx === 0
                  ? `${ver.id}【${$t('home.version.latestSnapshot')}】`
                  : ver.id,
            };
          })
      "
      :label="$t('home.version.versionType')"
      option-label="label"
      option-value="data"
      :disable="consoleStore.status(mainStore.world.id) !== 'Stop'"
      class="col"
      style="min-width: 8rem"
    />
    <q-toggle
      v-model="isRelease"
      :label="
        isRelease
          ? $t('home.version.onlyReleased')
          : $t('home.version.allVersions')
      "
      left-label
      :disable="consoleStore.status(mainStore.world.id) !== 'Stop'"
      style="width: fit-content"
    />
  </div>
</template>
