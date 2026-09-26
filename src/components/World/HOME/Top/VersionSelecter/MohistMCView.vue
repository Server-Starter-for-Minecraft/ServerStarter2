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
  const showingName = build.id;
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

/**
 * デフォルトバージョン（最新のバージョン）を取得する
 */
function getDefaultVersion() {
  return prop.versionData[0];
}

const mohistVer = computed({
  get: () => {
    const ver = mainStore.world?.version;
    if (!ver || ver.type === 'unknown') return getDefaultVersion();

    // 前のバージョンがMohistに存在しないバージョンの時は，最新バージョンを割り当てる
    const findVer = prop.versionData.find((ops) => ops.id === ver.id);
    if (!findVer) return getDefaultVersion();

    return findVer;
  },
  set: (ver) => {
    const newVer = buildMohistVer(ver.id, ver.builds[0]);
    if (mainStore.worldBack?.version.type !== 'unknown') {
      openWarningDialog(
        $q,
        prop.versionData.map((ops) => ops.id),
        mainStore.worldBack?.version ?? newVer,
        newVer,
        'id'
      );
    }
  },
});

const mohistBuild = computed({
  get: (): MohistBuildType => {
    // 前のバージョンがMohistMCでない時は，最新のビルド番号を割り当てる
    if (mainStore.world?.version.type !== 'mohistmc') {
      return mohistVer.value.builds[0];
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
  set: (build) => {
    updateWorldVersion(mohistVer.value.id, build);
  },
});

// 表示内容と内部データを整合させる
updateWorldVersion(mohistVer.value.id, mohistBuild.value);
</script>

<template>
  <div class="row justify-between q-gutter-md">
    <SsSelect
      v-model="mohistVer"
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
      v-model="mohistBuild"
      :options="
        mohistVer.builds.map((build, idx) => {
          return {
            data: build,
            label:
              idx === 0
                ? `${getNumberName(build)} (${$T('home.version.recommend')})`
                : getNumberName(build),
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
