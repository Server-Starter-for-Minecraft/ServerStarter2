<script setup lang="ts">
import { computed, ref } from 'vue';
import { useQuasar } from 'quasar';
import {
  AllFabricVersion,
  FabricVersion,
  VersionId,
} from 'app/src-electron/schema/version';
import { $T } from 'src/i18n/utils/tFunc';
import { useConsoleStore } from 'src/stores/ConsoleStore';
import { useMainStore } from 'src/stores/MainStore';
import SsSelect from 'src/components/util/base/ssSelect.vue';
import { openWarningDialog } from './versionComparator';

interface Prop {
  versionData: AllFabricVersion;
}
const prop = defineProps<Prop>();

const $q = useQuasar();
const mainStore = useMainStore();
const consoleStore = useConsoleStore();

const isRelease = ref(true);
const latestReleaseID = prop.versionData.games.find((ops) => ops.release)?.id;

function buildFabricVer(
  ver: { id: VersionId; release: boolean },
  installer: string,
  loader: string
): FabricVersion {
  return {
    id: ver.id,
    type: 'fabric' as const,
    release: ver.release,
    installer: installer,
    loader: loader,
  };
}
/**
 * ワールドオブジェクトのバージョン情報を書き換える
 */
function updateWorldVersion(
  ver: { id: VersionId; release: boolean },
  installer: string,
  loader: string
) {
  if (mainStore.world?.version) {
    mainStore.world.version = buildFabricVer(ver, installer, loader);
  }
}

const fabricVer = computed({
  get: () => {
    const ver = mainStore.world?.version;
    if (!ver || ver.type === 'unknown') return '';
    // 前のバージョンがFabricに存在しないバージョンの時は，最新バージョンを割り当てる
    const findVer = prop.versionData.games.find((ops) => ops.id === ver.id);
    if (!findVer) {
      return (
        prop.versionData.games.find((ops) => ops.release) ??
        prop.versionData.games[0]
      );
    }
    return findVer;
  },
  set: (val) => {
    if (val === '') return;
    const newVer = buildFabricVer(
      val,
      fabricInstaller.value,
      fabricLoader.value
    );
    if (mainStore.worldBack?.version?.type !== 'unknown') {
      openWarningDialog(
        $q,
        prop.versionData.games.map((ops) => ops.id),
        mainStore.worldBack?.version ?? newVer,
        newVer,
        'id'
      );
    }
  },
});

const recommendInstallerIdx = prop.versionData.installers.findIndex(
  (i) => i.stable
);
const fabricInstaller = ref(
  prop.versionData.installers[recommendInstallerIdx].version
);
const recommendLoaderIdx = prop.versionData.loaders.findIndex((i) => i.stable);
const fabricLoader = ref(prop.versionData.loaders[recommendLoaderIdx].version);

// 表示内容と内部データを整合させる
if (fabricVer.value !== '') {
  updateWorldVersion(
    fabricVer.value,
    fabricInstaller.value,
    fabricLoader.value
  );
}
</script>

<template>
  <div class="row justify-between q-gutter-md q-pb-md items-center">
    <SsSelect
      v-model="fabricVer"
      :options="
        versionData.games
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

  <div class="row justify-between q-gutter-md">
    <SsSelect
      v-model="fabricInstaller"
      @update:modelValue="(newVal: string) => {
        if (fabricVer !== '') updateWorldVersion(fabricVer, newVal, fabricLoader)
      }"
      :options="
        prop.versionData.installers.map((installer, i) => {
          return {
            data: installer,
            label:
              i === recommendInstallerIdx
                ? `${installer} (${$T('home.version.recommend')})`
                : installer,
          };
        })
      "
      :label="$T('home.version.installer')"
      option-label="label"
      option-value="data"
      :disable="consoleStore.status(mainStore.selectedWorldID) !== 'Stop'"
      class="col"
      style="min-width: 10rem"
    />
    <SsSelect
      v-model="fabricLoader"
      @update:modelValue="(newVal: string) => {
        if (fabricVer !== '') updateWorldVersion(fabricVer, fabricInstaller, newVal)
      }"
      :options="
        prop.versionData.loaders.map((loader, i) => {
          return {
            data: loader,
            label:
              i === recommendLoaderIdx
                ? `${loader} (${$T('home.version.recommend')})`
                : loader,
          };
        })
      "
      :label="$T('home.version.loader')"
      option-label="label"
      option-value="data"
      :disable="consoleStore.status(mainStore.selectedWorldID) !== 'Stop'"
      class="col"
      style="min-width: 10rem"
    />
  </div>
</template>
