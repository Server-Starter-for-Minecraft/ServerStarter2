<script setup lang="ts">
import { computed } from 'vue';
import { useQuasar } from 'quasar';
import {
  AllForgeVersion,
  ForgeVersion,
  VersionId,
} from 'app/src-electron/schema/version';
import { useConsoleStore } from 'src/stores/ConsoleStore';
import { useMainStore } from 'src/stores/MainStore';
import SsSelect from 'src/components/util/base/ssSelect.vue';
import { openWarningDialog } from './versionComparator';
import { $T } from 'src/i18n/utils/tFunc';

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

function buildForgeVer(id: VersionId, fVer: forgeVersType): ForgeVersion {
  return {
    id: id,
    type: 'forge' as const,
    forge_version: fVer.version,
    download_url: fVer.url,
  };
}
/**
 * ワールドオブジェクトのバージョン情報を書き換える
 */
function updateWorldVersion(id: VersionId, fVer: forgeVersType) {
  if (mainStore.world?.version) {
    mainStore.world.version = buildForgeVer(id, fVer);
  }
}

const forgeVers = () => {
  return prop.versionData.map((ver) => ver.id);
};
const forgeVer = computed({
  get: () => {
    const ver = mainStore.world?.version;
    if (!ver || ver.type === 'unknown') return '';
    // 前のバージョンがForgeに存在しないバージョンの時は，最新バージョンを割り当てる
    if (forgeVers().indexOf(ver.id ?? '') === -1) {
      return forgeVers()[0];
    }
    return ver.id ?? '';
  },
  set: (val) => {
    if (val === '') return;
    const buildIdx = getRecommendBuildIdx(val);
    const newVer = buildForgeVer(val, forgeBuilds(val)[buildIdx]);
    if (mainStore.worldBack?.version.type !== 'unknown') {
      openWarningDialog(
        $q,
        forgeVers(),
        mainStore.worldBack?.version ?? newVer,
        newVer,
        'id'
      );
    }
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
    if (mainStore.world?.version.type !== 'forge') {
      const buildIdx = getRecommendBuildIdx(forgeVer.value);
      return forgeBuilds(forgeVer.value)[buildIdx];
    }
    return {
      version: mainStore.world.version.forge_version,
      url: mainStore.world.version.download_url,
    };
  },
  set: (val) => {
    const ver = forgeVer.value;
    if (ver === '') return;
    updateWorldVersion(ver, val);
  },
});

// 表示内容と内部データを整合させる
if (forgeVer.value !== '') {
  updateWorldVersion(forgeVer.value, forgeBuild.value);
}
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
      v-model="forgeBuild"
      :options="
        forgeBuilds(forgeVer).map((build, idx) => {
          return {
            data: build,
            label:
              getRecommendBuildIdx(forgeVer) === idx
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
