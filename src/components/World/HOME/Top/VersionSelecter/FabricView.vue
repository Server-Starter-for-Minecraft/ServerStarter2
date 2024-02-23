<script setup lang="ts">
import { computed, ref } from 'vue';
import { useQuasar } from 'quasar';
import { AllFabricVersion } from 'app/src-electron/schema/version';
import { useMainStore } from 'src/stores/MainStore';
import { useConsoleStore } from 'src/stores/ConsoleStore';
import { openWarningDialog } from './versionComparator';
import SsSelect from 'src/components/util/base/ssSelect.vue';

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
  ver: { id: string; release: boolean },
  installer: string,
  loader: string
) {
  return {
    id: ver.id,
    type: 'fabric' as const,
    release: ver.release,
    installer: installer,
    loader: loader,
  };
}

const fabricVer = computed({
  get: () => {
    // 前のバージョンがFabricに存在しないバージョンの時は，最新バージョンを割り当てる
    const findVer = prop.versionData.games.find(
      (ops) => ops.id === mainStore.world.version.id
    );
    if (!findVer) {
      return (
        prop.versionData.games.find((ops) => ops.release) ??
        prop.versionData.games[0]
      );
    }
    return findVer;
  },
  set: (val) => {
    const newVer = buildFabricVer(
      val,
      fabricInstaller.value,
      fabricLoader.value
    );
    openWarningDialog(
      $q,
      prop.versionData.games.map((ops) => ops.id),
      mainStore.worldBack?.version ?? newVer,
      newVer,
      'id'
    );
  },
});

const fabricInstaller = ref(prop.versionData.installers[0]);
const fabricLoader = ref(prop.versionData.loaders[0]);

// 表示内容と内部データを整合させる
mainStore.world.version = buildFabricVer(
  fabricVer.value,
  fabricInstaller.value,
  fabricLoader.value
);
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

  <div class="row justify-between q-gutter-md">
    <SsSelect
      v-model="fabricInstaller"
      @update:modelValue="(newVal: string) => {
        mainStore.world.version = buildFabricVer(fabricVer, newVal, fabricLoader)
      }"
      :options="
        prop.versionData.installers.map((installer, i) => {
          return {
            data: installer,
            label:
              i === 0
                ? `${installer} (${$t('home.version.recommend')})`
                : installer,
          };
        })
      "
      :label="$t('home.version.installer')"
      option-label="label"
      option-value="data"
      :disable="consoleStore.status(mainStore.world.id) !== 'Stop'"
      class="col"
      style="min-width: 10rem"
    />
    <SsSelect
      v-model="fabricLoader"
      @update:modelValue="(newVal: string) => {
        mainStore.world.version = buildFabricVer(fabricVer, fabricInstaller, newVal)
      }"
      :options="
        prop.versionData.loaders.map((loader, i) => {
          return {
            data: loader,
            label:
              i === 0 ? `${loader} (${$t('home.version.recommend')})` : loader,
          };
        })
      "
      :label="$t('home.version.loader')"
      option-label="label"
      option-value="data"
      :disable="consoleStore.status(mainStore.world.id) !== 'Stop'"
      class="col"
      style="min-width: 10rem"
    />
  </div>
</template>
