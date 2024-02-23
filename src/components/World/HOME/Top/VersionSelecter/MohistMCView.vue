<script setup lang="ts">
import { computed } from 'vue';
import { useQuasar } from 'quasar';
import {
  AllMohistmcVersion,
  MohistmcVersion,
} from 'app/src-electron/schema/version';
import { useMainStore } from 'src/stores/MainStore';
import { useConsoleStore } from 'src/stores/ConsoleStore';
import { openWarningDialog } from './versionComparator';
import SsSelect from 'src/components/util/base/ssSelect.vue';

interface Prop {
  versionData: AllMohistmcVersion;
}
const prop = defineProps<Prop>();

const $q = useQuasar();
const mainStore = useMainStore();
const consoleStore = useConsoleStore();
let currentMohistVer: MohistmcVersion;

type mohistBuildType = { number: number; forge_version?: string | undefined };

/**
 * 描画する際にForgeの対応番号を記載する
 */
function getNumberName(build: mohistBuildType) {
  if (build.forge_version !== void 0) {
    return `${build.number} (Forge: ${build.forge_version})`;
  } else {
    return build.number;
  }
}

function buildMohistVer(id: string, build: mohistBuildType) {
  return {
    id: id,
    type: 'mohistmc' as const,
    forge_version: build.forge_version,
    number: build.number,
  };
}

const mohistVers = () => {
  return prop.versionData.map((ver) => ver.id);
};
const mohistVer = computed({
  get: () => {
    // 前のバージョンがMohistに存在しないバージョンの時は，最新バージョンを割り当てる
    if (mohistVers().indexOf(mainStore.world.version.id) === -1) {
      return mohistVers()[0];
    }
    return mainStore.world.version.id;
  },
  set: (val) => {
    const newVer = buildMohistVer(val, mohistBuilds(val)[0]);
    openWarningDialog($q, mohistVers(), currentMohistVer, newVer, 'id');
  },
});

const mohistBuilds = (mVer: string) => {
  return (
    prop.versionData.find((ver) => ver.id === mVer)?.builds ?? [
      {
        number: 0,
        forge_version: undefined,
      },
    ]
  );
};
const mohistBuild = computed({
  get: () => {
    // 前のバージョンがPaperでない時は，最新のビルド番号を割り当てる
    if (mainStore.world.version.type !== 'mohistmc') {
      return mohistBuilds(mohistVer.value)[0];
    }
    return {
      number: mainStore.world.version.number,
      forge_version: mainStore.world.version.forge_version,
    };
  },
  set: (val) => {
    mainStore.world.version = buildMohistVer(mohistVer.value, val);
  },
});

// 表示内容と内部データを整合させる
currentMohistVer = buildMohistVer(mohistVer.value, mohistBuild.value);
mainStore.world.version = currentMohistVer;
</script>

<template>
  <div class="row justify-between q-gutter-md">
    <SsSelect
      v-model="mohistVer"
      :options="
        mohistVers().map((ver, idx) => {
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
      :disable="consoleStore.status(mainStore.world.id) !== 'Stop'"
      class="col"
      style="min-width: 10rem"
    />
    <SsSelect
      v-model="mohistBuild"
      :options="
        mohistBuilds(mohistVer).map((val, idx) => {
          return {
            data: val,
            label:
              idx === 0
                ? `${getNumberName(val)} (${$t('home.version.recommend')})`
                : getNumberName(val),
          };
        })
      "
      :label="$t('home.version.buildNumber') + $t('home.version.notChange')"
      option-label="label"
      option-value="data"
      :disable="consoleStore.status(mainStore.world.id) !== 'Stop'"
      class="col"
      style="min-width: 10rem"
    />
  </div>
</template>
