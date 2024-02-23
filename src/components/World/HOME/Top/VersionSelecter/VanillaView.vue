<script setup lang="ts">
import { computed, ref } from 'vue';
import { useQuasar } from 'quasar';
import {
  AllVanillaVersion,
  VanillaVersion,
} from 'app/src-electron/schema/version';
import { useMainStore } from 'src/stores/MainStore';
import { useConsoleStore } from 'src/stores/ConsoleStore';
import { openWarningDialog } from './versionComparator';
import SsSelect from 'src/components/util/base/ssSelect.vue';

interface Prop {
  versionData: AllVanillaVersion;
}
const prop = defineProps<Prop>();

const $q = useQuasar();
const mainStore = useMainStore();
const consoleStore = useConsoleStore();

const isRelease = ref(true);
const latestReleaseID = prop.versionData.find((ops) => ops.release)?.id;
let currentVanillaVer: VanillaVersion;

function buildVanillaVer(ver: { id: string; release: boolean }) {
  return {
    id: ver.id,
    type: 'vanilla' as const,
    release: ver.release,
  };
}

const vanillaVer = computed({
  get: () => {
    // 前のバージョンがVanillaに存在しないバージョンの時は，最新バージョンを割り当てる
    const findVer = prop.versionData.find(
      (ops) => ops.id === mainStore.world.version.id
    );
    if (!findVer) {
      return prop.versionData.find((ops) => ops.release) ?? prop.versionData[0];
    }
    return findVer;
  },
  set: (val) => {
    const newVer = buildVanillaVer(val);
    openWarningDialog(
      $q,
      prop.versionData.map((ops) => ops.id),
      currentVanillaVer,
      newVer,
      'id'
    );
  },
});

// 表示内容と内部データを整合させる
currentVanillaVer = buildVanillaVer(vanillaVer.value);
mainStore.world.version = currentVanillaVer;
</script>

<template>
  <div class="row justify-between q-gutter-md items-center">
    <SsSelect
      v-model="vanillaVer"
      :options="
        versionData
          .filter((ver, idx) => !isRelease || idx == 0 || ver['release'])
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
