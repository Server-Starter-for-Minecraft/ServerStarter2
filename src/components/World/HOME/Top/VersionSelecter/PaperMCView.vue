<script setup lang="ts">
import { computed } from 'vue';
import { useQuasar } from 'quasar';
import {
  AllPapermcVersion,
  PapermcVersion,
  VersionId,
} from 'app/src-electron/schema/version';
import { $T } from 'src/i18n/utils/tFunc';
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

function buildPaperVer(id: VersionId, build: number): PapermcVersion {
  return {
    id: id,
    type: 'papermc' as const,
    build: build,
  };
}
/**
 * ワールドオブジェクトのバージョン情報を書き換える
 */
function updateWorldVersion(id: VersionId, build: number) {
  if (mainStore.world?.version) {
    mainStore.world.version = buildPaperVer(id, build);
  }
}

const paperVers = () => {
  return prop.versionData.map((ver) => ver.id);
};
const paperVer = computed({
  get: () => {
    const ver = mainStore.world?.version;
    if (!ver || ver.type === 'unknown') return '';
    // 前のバージョンがPaperに存在しないバージョンの時は，最新バージョンを割り当てる
    if (paperVers().indexOf(ver.id ?? '') === -1) {
      return paperVers()[0];
    }
    return ver.id ?? '';
  },
  set: (val) => {
    if (val === '') return;
    const newVer = buildPaperVer(val, paperBuilds(val)[0]);
    if (mainStore.worldBack?.version.type !== 'unknown') {
      openWarningDialog(
        $q,
        paperVers(),
        mainStore.worldBack?.version ?? newVer,
        newVer,
        'id'
      );
    }
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
    if (paperVer.value === '') return;
    updateWorldVersion(paperVer.value, val);
  },
});

// 表示内容と内部データを整合させる
if (paperVer.value !== '') {
  updateWorldVersion(paperVer.value, paperBuild.value);
}
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
              idx === 0 ? `${ver}【${$T('home.version.latestVersion')}】` : ver,
          };
        })
      "
      :label="$T('home.version.versionType')"
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
              idx === 0 ? `${build} (${$T('home.version.recommend')})` : build,
          };
        })
      "
      :label="$T('home.version.buildNumber')"
      option-label="label"
      option-value="data"
      :disable="consoleStore.status(mainStore.selectedWorldID) !== 'Stop'"
      class="col"
      style="min-width: 10rem"
    />
  </div>
</template>
