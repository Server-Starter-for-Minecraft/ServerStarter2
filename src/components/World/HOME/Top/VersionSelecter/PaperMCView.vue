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

/**
 * デフォルトバージョン（最新リリース版または最新のバージョン）を取得する
 */
function getDefaultVersion() {
  return prop.versionData[0];
}

const paperVer = computed({
  get: () => {
    const ver = mainStore.world?.version;
    if (!ver || ver.type === 'unknown') return getDefaultVersion();

    // 前のバージョンがPaperに存在しないバージョンの時は，最新バージョンを割り当てる
    const findVer = prop.versionData.find((ops) => ops.id === ver.id);
    if (!findVer) return getDefaultVersion();

    return findVer;
  },
  set: (ver) => {
    const newVer = buildPaperVer(ver.id, ver.builds[0]);
    if (mainStore.worldBack?.version.type !== 'unknown') {
      openWarningDialog(
        $q,
        prop.versionData.map((ver) => ver.id),
        mainStore.worldBack?.version ?? newVer,
        newVer,
        'id'
      );
    }
  },
});

const paperBuild = computed({
  get: () => {
    // 前のバージョンがPaperでない時は，最新のビルド番号を割り当てる
    if (mainStore.world?.version.type !== 'papermc') {
      return getDefaultVersion().builds[0];
    }
    return mainStore.world.version.build;
  },
  set: (build) => {
    updateWorldVersion(paperVer.value.id, build);
  },
});

// 表示内容と内部データを整合させる
updateWorldVersion(paperVer.value.id, paperBuild.value);
</script>

<template>
  <div class="row justify-between q-gutter-md">
    <SsSelect
      v-model="paperVer"
      :options="
        versionData.map((ver, idx) => {
          return {
            data: ver,
            label:
              idx === 0
                ? `${ver.id}【${$T('home.version.latestVersion')}】`
                : ver.id,
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
        paperVer.builds.map((build, idx) => {
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
