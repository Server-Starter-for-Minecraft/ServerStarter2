<script setup lang="ts">
import { computed } from 'vue';
import { useQuasar } from 'quasar';
import {
  AllNeoForgeVersion,
  NeoForgeVersion,
  VersionId,
} from 'app/src-electron/schema/version';
import { $T } from 'src/i18n/utils/tFunc';
import { useConsoleStore } from 'src/stores/ConsoleStore';
import { useMainStore } from 'src/stores/MainStore';
import SsSelect from 'src/components/util/base/ssSelect.vue';
import { openWarningDialog } from './versionComparator';

interface Prop {
  versionData: AllNeoForgeVersion;
}
const prop = defineProps<Prop>();

const $q = useQuasar();
const mainStore = useMainStore();
const consoleStore = useConsoleStore();

function buildNeoForgeVer(id: VersionId, neoVer: string): NeoForgeVersion {
  return {
    id: id,
    type: 'neoforge' as const,
    neoforge_version: neoVer,
  };
}
/**
 * ワールドオブジェクトのバージョン情報を書き換える
 */
function updateWorldVersion(id: VersionId, neoVer: string) {
  if (mainStore.world?.version) {
    mainStore.world.version = buildNeoForgeVer(id, neoVer);
  }
}

const neoforgeVers = () => {
  return prop.versionData.map((ver) => ver.id);
};
const neoforgeVer = computed({
  get: () => {
    const ver = mainStore.world?.version;
    if (!ver || ver.type === 'unknown') return '';
    // 前のバージョンがNeoForgeに存在しないバージョンの時は，最新バージョンを割り当てる
    if (neoforgeVers().indexOf(ver.id ?? '') === -1) {
      return neoforgeVers()[0];
    }
    return ver.id ?? '';
  },
  set: (val) => {
    if (val === '') return;
    const newVer = buildNeoForgeVer(val, neoforgeBuilds(val)[0].version);
    if (mainStore.worldBack?.version.type !== 'unknown') {
      openWarningDialog(
        $q,
        neoforgeVers(),
        mainStore.worldBack?.version ?? newVer,
        newVer,
        'id'
      );
    }
  },
});

const neoforgeBuilds = (fVer: string) => {
  return (
    prop.versionData.find((ver) => ver.id === fVer)?.neoforge_versions ?? [
      { version: '' },
    ]
  );
};
const neoforgeBuild = computed({
  get: () => {
    // 前のバージョンがPaperでない時は，最新のビルド番号を割り当てる
    if (mainStore.world?.version.type !== 'neoforge') {
      return neoforgeBuilds(neoforgeVer.value)[0].version;
    }
    return mainStore.world.version.neoforge_version;
  },
  set: (val) => {
    const ver = neoforgeVer.value;
    if (ver === '') return;
    updateWorldVersion(ver, val);
  },
});

// 表示内容と内部データを整合させる
if (neoforgeVer.value !== '') {
  updateWorldVersion(neoforgeVer.value, neoforgeBuild.value);
}
</script>

<template>
  <div class="row justify-between q-gutter-md">
    <SsSelect
      v-model="neoforgeVer"
      :options="
        neoforgeVers().map((ver, idx) => {
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
      v-model="neoforgeBuild"
      :options="
        neoforgeBuilds(neoforgeVer).map((build, idx) => {
          return {
            data: build.version,
            label:
              idx === 0
                ? `${build.version} (${$T('home.version.recommend')})`
                : build.version,
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
