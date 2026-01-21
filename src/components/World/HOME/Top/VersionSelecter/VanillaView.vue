<script setup lang="ts">
import { computed, ref } from 'vue';
import { useQuasar } from 'quasar';
import {
  AllVanillaVersion,
  VanillaVersion,
} from 'app/src-electron/schema/version';
import { $T } from 'src/i18n/utils/tFunc';
import { useConsoleStore } from 'src/stores/ConsoleStore';
import { useMainStore } from 'src/stores/MainStore';
import SsSelect from 'src/components/util/base/ssSelect.vue';
import { openWarningDialog } from './versionComparator';

interface Prop {
  versionData: AllVanillaVersion;
}
const prop = defineProps<Prop>();

const $q = useQuasar();
const mainStore = useMainStore();
const consoleStore = useConsoleStore();

const isRelease = ref(true);
const latestReleaseID = prop.versionData.find((ops) => ops.release)?.id;

function buildVanillaVer(ver: AllVanillaVersion[number]): VanillaVersion {
  return {
    id: ver.id,
    type: 'vanilla' as const,
    release: ver.release,
  };
}
/**
 * ワールドオブジェクトのバージョン情報を書き換える
 */
function updateWorldVersion(ver: AllVanillaVersion[number]) {
  if (mainStore.world?.version) {
    mainStore.world.version = buildVanillaVer(ver);
  }
}

/**
 * デフォルトバージョン（最新リリース版または最新のバージョン）を取得する
 */
function getDefaultVersion() {
  return prop.versionData.find((ops) => ops.release) ?? prop.versionData[0];
}

const vanillaVer = computed({
  get: () => {
    const ver = mainStore.world?.version;
    if (!ver || ver.type === 'unknown') return getDefaultVersion();

    // 前のバージョンがVanillaに存在しないバージョンの時は，最新バージョンを割り当てる
    const findVer = prop.versionData.find((ops) => ops.id === ver.id);
    if (!findVer) return getDefaultVersion();

    return findVer;
  },
  set: (val) => {
    const newVer = buildVanillaVer(val);
    if (mainStore.worldBack?.version.type !== 'unknown') {
      openWarningDialog(
        $q,
        prop.versionData.map((ops) => ops.id),
        mainStore.worldBack?.version ?? newVer,
        newVer,
        'id'
      );
    }
  },
});

// 表示内容と内部データを整合させる
updateWorldVersion(vanillaVer.value);
</script>

<template>
  <div class="row justify-between q-gutter-md items-center">
    <SsSelect
      v-model="vanillaVer"
      :options="
        versionData
          .filter((ver, idx) => !isRelease || idx == 0 || ver.release)
          .map((ver, idx) => {
            return {
              data: ver,
              label:
                ver.id === latestReleaseID
                  ? `${ver.id}【${$T('home.version.latestRelease')}】`
                  : idx === 0
                  ? `${ver.id}【${$T('home.version.latestSnapshot')}】`
                  : ver.id,
            };
          })
      "
      :label="$T('home.version.versionType')"
      option-label="label"
      option-value="data"
      :disable="consoleStore.status(mainStore.selectedWorldID) !== 'Stop'"
      class="col"
      style="min-width: 8rem"
    />
    <q-toggle
      v-model="isRelease"
      :label="
        isRelease
          ? $T('home.version.onlyReleased')
          : $T('home.version.allVersions')
      "
      left-label
      :disable="consoleStore.status(mainStore.selectedWorldID) !== 'Stop'"
      style="width: fit-content"
    />
  </div>
</template>
