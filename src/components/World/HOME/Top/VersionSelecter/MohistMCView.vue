<script setup lang="ts">
import { computed, toRaw } from 'vue';
import { useQuasar } from 'quasar';
import {
  AllMohistmcVersion,
  MohistmcVersion,
  VersionId,
} from 'app/src-electron/schema/version';
import { $T } from 'src/i18n/utils/tFunc';
import { useConsoleStore } from 'src/stores/ConsoleStore';
import { useMainStore } from 'src/stores/MainStore';
import SsSelect from 'src/components/util/base/ssSelect.vue';
import { openWarningDialog } from './versionComparator';

interface Prop {
  versionData: AllMohistmcVersion;
}
const prop = defineProps<Prop>();

const $q = useQuasar();
const mainStore = useMainStore();
const consoleStore = useConsoleStore();

type MohistBuildType = AllMohistmcVersion[number]['builds'][number];

/**
 * 描画する際にForgeの対応番号を記載する
 */
function getNumberName(build: MohistBuildType) {
  const showingName = build.name.slice(0, 8);
  if (build.forge_version !== void 0) {
    return `${showingName} (Forge: ${build.forge_version})`;
  } else {
    return showingName;
  }
}

function buildMohistVer(
  id: VersionId,
  build: MohistBuildType
): MohistmcVersion {
  return {
    id: id,
    type: 'mohistmc' as const,
    buildId: build.id,
    buildName: build.name,
    jar: toRaw(build.jar),
    forge_version: build.forge_version,
  };
}
/**
 * ワールドオブジェクトのバージョン情報を書き換える
 */
function updateWorldVersion(id: VersionId, build: MohistBuildType) {
  if (mainStore.world?.version) {
    mainStore.world.version = buildMohistVer(id, build);
  }
}

const mohistVers = () => {
  return prop.versionData.map((ver) => ver.id);
};
const mohistVer = computed({
  get: () => {
    const ver = mainStore.world?.version;
    if (!ver || ver.type === 'unknown') return '';
    // 前のバージョンがMohistに存在しないバージョンの時は，最新バージョンを割り当てる
    if (mohistVers().indexOf(ver.id ?? '') === -1) {
      return mohistVers()[0];
    }
    return ver.id ?? '';
  },
  set: (val) => {
    if (val === '') return;
    const newVer = buildMohistVer(val, mohistBuilds(val)[0]);
    if (mainStore.worldBack?.version.type !== 'unknown') {
      openWarningDialog(
        $q,
        mohistVers(),
        mainStore.worldBack?.version ?? newVer,
        newVer,
        'id'
      );
    }
  },
});

const mohistBuilds = (mVer: string): MohistBuildType[] => {
  return (
    prop.versionData.find((ver) => ver.id === mVer)?.builds ?? [
      {
        id: -1,
        name: 'invalidBuild',
        jar: { url: '' },
      },
    ]
  );
};
const mohistBuild = computed({
  get: (): MohistBuildType => {
    // 前のバージョンがMohistMCでない時は，最新のビルド番号を割り当てる
    if (mainStore.world?.version.type !== 'mohistmc') {
      return mohistBuilds(mohistVer.value)[0];
    }
    return {
      id: mainStore.world.version.buildId,
      name: mainStore.world.version.buildName,
      forge_version: mainStore.world.version.forge_version,
      jar: {
        url: mainStore.world.version.jar.url,
        sha256: mainStore.world.version.jar.sha256,
      },
    };
  },
  set: (val) => {
    const ver = mohistVer.value;
    if (ver === '') return;
    updateWorldVersion(ver, val);
  },
});

// 表示内容と内部データを整合させる
if (mohistVer.value !== '') {
  updateWorldVersion(mohistVer.value, mohistBuild.value);
}
</script>

<template>
  <div class="row justify-between q-gutter-md">
    <SsSelect
      v-if="mohistVer !== ''"
      v-model="mohistVer"
      :options="
        mohistVers().map((ver, idx) => {
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
      v-model="mohistBuild"
      :options="
        mohistBuilds(mohistVer).map((val, idx) => {
          return {
            data: val,
            label:
              idx === 0
                ? `${getNumberName(val)} (${$T('home.version.recommend')})`
                : getNumberName(val),
          };
        })
      "
      :label="$T('home.version.buildNumber') + $T('home.version.notChange')"
      option-label="label"
      option-value="data"
      :disable="consoleStore.status(mainStore.selectedWorldID) !== 'Stop'"
      class="col"
      style="min-width: 10rem"
    />
  </div>
</template>
