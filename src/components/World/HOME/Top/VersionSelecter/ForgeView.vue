<script setup lang="ts">
import { computed } from 'vue';
import { useQuasar } from 'quasar';
import { AllForgeVersion } from 'app/src-electron/schema/version';
import { useConsoleStore } from 'src/stores/ConsoleStore';
import { useMainStore } from 'src/stores/MainStore';
import SsSelect from 'src/components/util/base/ssSelect.vue';
import { openWarningDialog } from './versionComparator';

interface Prop {
  versionData: AllForgeVersion;
}
const prop = defineProps<Prop>();

const $q = useQuasar();
const mainStore = useMainStore();
const consoleStore = useConsoleStore();

type forgeVersType = { version: string; url: string };

/**
 * 推奨ビルド番号 or ビルド一覧の先頭を「(推奨)」として提示する
 */
function getRecommendBuildIdx(fVer: string) {
  const recommendBuild =
    prop.versionData.find((v) => v.id === fVer)?.recommended?.version ?? '';

  const idxNumber = forgeBuilds(fVer).findIndex(
    (b) => recommendBuild === b.version
  );
  return idxNumber === -1 ? 0 : idxNumber;
}

function buildForgeVer(id: string, fVer: forgeVersType) {
  return {
    id: id,
    type: 'forge' as const,
    forge_version: fVer.version,
    download_url: fVer.url,
  };
}

const forgeVers = () => {
  return prop.versionData.map((ver) => ver.id);
};
const forgeVer = computed({
  get: () => {
    // 前のバージョンがForgeに存在しないバージョンの時は，最新バージョンを割り当てる
    if (forgeVers().indexOf(mainStore.world.version.id) === -1) {
      return forgeVers()[0];
    }
    return mainStore.world.version.id;
  },
  set: (val) => {
    const buildIdx = getRecommendBuildIdx(val);
    const newVer = buildForgeVer(val, forgeBuilds(val)[buildIdx]);
    openWarningDialog(
      $q,
      forgeVers(),
      mainStore.worldBack?.version ?? newVer,
      newVer,
      'id'
    );
  },
});

const forgeBuilds = (fVer: string) => {
  return (
    prop.versionData.find((ver) => ver.id === fVer)?.forge_versions ?? [
      {
        version: '',
        url: '',
      },
    ]
  );
};
const forgeBuild = computed({
  get: () => {
    // 前のバージョンがPaperでない時は，最新のビルド番号を割り当てる
    if (mainStore.world.version.type !== 'forge') {
      const buildIdx = getRecommendBuildIdx(forgeVer.value);
      return forgeBuilds(forgeVer.value)[buildIdx];
    }
    return {
      version: mainStore.world.version.forge_version,
      url: mainStore.world.version.download_url,
    };
  },
  set: (val) => {
    mainStore.world.version = buildForgeVer(forgeVer.value, val);
  },
});

// 表示内容と内部データを整合させる
mainStore.world.version = buildForgeVer(forgeVer.value, forgeBuild.value);
</script>

<template>
  <div class="row justify-between q-gutter-md">
    <SsSelect
      v-model="forgeVer"
      :options="
        forgeVers().map((ver, idx) => {
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
      v-model="forgeBuild"
      :options="
        forgeBuilds(forgeVer).map((build, idx) => {
          return {
            data: build,
            label:
              getRecommendBuildIdx(forgeVer) === idx
                ? `${build.version} (${$t('home.version.recommend')})`
                : build.version,
          };
        })
      "
      :label="$t('home.version.buildNumber')"
      option-label="label"
      option-value="data"
      :disable="consoleStore.status(mainStore.world.id) !== 'Stop'"
      class="col"
      style="min-width: 10rem"
    />
  </div>
</template>
