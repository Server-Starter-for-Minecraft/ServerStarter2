<script setup lang="ts">
import { computed } from 'vue';
import { useQuasar } from 'quasar';
import {
  AllForgeVersion,
  ForgeVersion,
  VersionId,
} from 'app/src-electron/schema/version';
import { $T } from 'src/i18n/utils/tFunc';
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

type ForgeVersType = AllForgeVersion[number]['forge_versions'][number];

function buildForgeVer(id: VersionId, fVer: ForgeVersType): ForgeVersion {
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
function updateWorldVersion(id: VersionId, fVer: ForgeVersType) {
  if (mainStore.world?.version) {
    mainStore.world.version = buildForgeVer(id, fVer);
  }
}

/**
 * デフォルトバージョン（最新のバージョン）を取得する
 */
function getDefaultVersion() {
  return prop.versionData[0];
}

const forgeVer = computed({
  get: () => {
    const ver = mainStore.world?.version;
    if (!ver || ver.type === 'unknown') return getDefaultVersion();

    // 前のバージョンがForgeに存在しないバージョンの時は，最新バージョンを割り当てる
    const findVer = prop.versionData.find((ops) => ops.id === ver.id);
    if (!findVer) return getDefaultVersion();

    return findVer;
  },
  set: (ver) => {
    const build = ver.recommended ?? ver.forge_versions[0];
    const newVer = buildForgeVer(ver.id, build);
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

const forgeBuild = computed({
  get: () => {
    // 前のバージョンがPaperでない時は，最新のビルド番号を割り当てる
    if (mainStore.world?.version.type !== 'forge') {
      return forgeVer.value.recommended ?? forgeVer.value.forge_versions[0];
    }
    return {
      version: mainStore.world.version.forge_version,
      url: mainStore.world.version.download_url,
    };
  },
  set: (build) => {
    updateWorldVersion(forgeVer.value.id, build);
  },
});

// 表示内容と内部データを整合させる
updateWorldVersion(forgeVer.value.id, forgeBuild.value);
</script>

<template>
  <div class="row justify-between q-gutter-md">
    <SsSelect
      v-model="forgeVer"
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
      v-model="forgeBuild"
      :options="
        forgeVer.forge_versions.map((build) => {
          return {
            data: build,
            label:
              forgeVer.recommended?.version === build.version
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
