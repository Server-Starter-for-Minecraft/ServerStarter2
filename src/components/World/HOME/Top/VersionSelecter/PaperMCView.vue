<script setup lang="ts">
import { computed } from 'vue';
import { useQuasar } from 'quasar';
import { AllPapermcVersion } from 'app/src-electron/schema/version';
import { useConsoleStore } from 'src/stores/ConsoleStore';
import { useMainStore } from 'src/stores/MainStore';
import SsSelect from 'src/components/util/base/ssSelect.vue';
import { openWarningDialog } from './versionComparator';

interface Prop {
  versionData: AllPapermcVersion;
}
const prop = defineProps<Prop>();

const $q = useQuasar();
const mainStore = useMainStore();
const consoleStore = useConsoleStore();

function buildPaperVer(id: string, build: number) {
  return {
    id: id,
    type: 'papermc' as const,
    build: build,
  };
}
/**
 * ワールドオブジェクトのバージョン情報を書き換える
 */
function updateWorldVersion(id: string, build: number) {
  if (mainStore.world?.version) {
    mainStore.world.version = buildPaperVer(id, build);
  }
}

const paperVers = () => {
  return prop.versionData.map((ver) => ver.id);
};
const paperVer = computed({
  get: () => {
    // 前のバージョンがPaperに存在しないバージョンの時は，最新バージョンを割り当てる
    if (paperVers().indexOf(mainStore.world?.version.id ?? '') === -1) {
      return paperVers()[0];
    }
    return mainStore.world?.version.id ?? '';
  },
  set: (val) => {
    const newVer = buildPaperVer(val, paperBuilds(val)[0]);
    openWarningDialog(
      $q,
      paperVers(),
      mainStore.worldBack?.version ?? newVer,
      newVer,
      'id'
    );
  },
});

const paperBuilds = (pVer: string) => {
  return prop.versionData.find((ver) => ver.id === pVer)?.builds ?? [0];
};
const paperBuild = computed({
  get: () => {
    // 前のバージョンがPaperでない時は，最新のビルド番号を割り当てる
    if (mainStore.world?.version.type !== 'papermc') {
      return paperBuilds(paperVer.value)[0];
    }
    return mainStore.world.version.build;
  },
  set: (val) => {
    updateWorldVersion(paperVer.value, val);
  },
});

// 表示内容と内部データを整合させる
updateWorldVersion(paperVer.value, paperBuild.value);
</script>

<template>
  <div class="row justify-between q-gutter-md">
    <SsSelect
      v-model="paperVer"
      :options="
        paperVers().map((ver, idx) => {
          return {
            data: ver,
            label:
              idx === 0 ? `${ver}【${$t('home.version.latestVersion')}】` : ver,
          };
        })
      "
      :label="$t('home.version.versionType')"
      option-label="label"
      option-value="data"
      :disable="consoleStore.status(mainStore.selectedWorldID) !== 'Stop'"
      class="col"
      style="min-width: 10rem"
    />
    <SsSelect
      v-model="paperBuild"
      :options="
        paperBuilds(paperVer).map((build, idx) => {
          return {
            data: build,
            label:
              idx === 0 ? `${build} (${$t('home.version.recommend')})` : build,
          };
        })
      "
      :label="$t('home.version.buildNumber')"
      option-label="label"
      option-value="data"
      :disable="consoleStore.status(mainStore.selectedWorldID) !== 'Stop'"
      class="col"
      style="min-width: 10rem"
    />
  </div>
</template>
