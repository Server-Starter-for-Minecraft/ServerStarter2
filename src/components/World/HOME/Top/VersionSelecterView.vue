<script setup lang="ts">
import { computed } from 'vue';
import { useQuasar } from 'quasar';
import {
  AllFabricVersion,
  AllForgeVersion,
  AllMohistmcVersion,
  AllPapermcVersion,
  AllSpigotVersion,
  AllVanillaVersion,
  Version,
  versionTypes,
} from 'app/src-electron/schema/version';
import { assets } from 'src/assets/assets';
import { $T } from 'src/i18n/utils/tFunc';
import { useConsoleStore } from 'src/stores/ConsoleStore';
import {
  UNKNOWN_VERSION_ERROR_REASON,
  useErrorWorldStore,
} from 'src/stores/ErrorWorldStore';
import { useMainStore } from 'src/stores/MainStore';
import { useSystemStore } from 'src/stores/SystemStore';
import SsSelectScope from 'src/components/util/base/ssSelectScope.vue';
import Fabric from './VersionSelecter/FabricView.vue';
import Forge from './VersionSelecter/ForgeView.vue';
import MohistMC from './VersionSelecter/MohistMCView.vue';
import PaperMC from './VersionSelecter/PaperMCView.vue';
import ServerTypeItem from './VersionSelecter/ServerTypeItem.vue';
import Spigot from './VersionSelecter/SpigotView.vue';
import Vanilla from './VersionSelecter/VanillaView.vue';
import { openVerTypeWarningDialog } from './VersionSelecter/versionComparator';

const $q = useQuasar();
const sysStore = useSystemStore();
const mainStore = useMainStore();
const errorWorldStore = useErrorWorldStore();
const consoleStore = useConsoleStore();

// エラーが発生してバージョン一覧の取得ができなかったバージョンを選択させない
// validVersionTypesを通過したバージョンのみ選択できるようにするため，getでは値を必ず取得できる
const vanillas = () => {
  return sysStore.serverVersions.get('vanilla') as AllVanillaVersion;
};
const spigots = () => {
  return sysStore.serverVersions.get('spigot') as AllSpigotVersion;
};
const papermcs = () => {
  return sysStore.serverVersions.get('papermc') as AllPapermcVersion;
};
const forges = () => {
  return sysStore.serverVersions.get('forge') as AllForgeVersion;
};
const mohistmcs = () => {
  return sysStore.serverVersions.get('mohistmc') as AllMohistmcVersion;
};
const fabrics = () => {
  return sysStore.serverVersions.get('fabric') as AllFabricVersion;
};
const validVersionTypes = versionTypes.filter(
  (serverType) => sysStore.serverVersions.get(serverType) !== void 0
);

function createServerMap(serverType: (typeof versionTypes)[number]) {
  return {
    value: serverType,
    label: $T(`home.serverType.${serverType}`),
    description: $T(`home.serverDescription.${serverType}`),
    icon: assets.png[serverType],
  };
}

/**
 * 選択されたバージョン設定がUnknownでない場合は，エラー一覧からワールドを除外する
 */
function clearErrWrold(versionType: Version['type']) {
  const worldId = mainStore.selectedWorldID;

  if (versionType === 'unknown') {
    errorWorldStore.lock(worldId, UNKNOWN_VERSION_ERROR_REASON);
  } else {
    errorWorldStore.unlock(worldId, UNKNOWN_VERSION_ERROR_REASON);
  }
}

/**
 * unknownバージョンはバリデーション違反として表示する
 */
function validateVersion(versionType: Version['type']) {
  if (versionType === 'unknown') {
    return $T('home.version.unknownError');
  }
  return true;
}

const selectedVerType = computed({
  get: () => {
    return mainStore.selectedVersionType;
  },
  set: (val) => {
    openVerTypeWarningDialog($q, mainStore.worldBack?.version.type ?? val, val);
  },
});
</script>

<template>
  <!-- その際に、すでに存在しているバージョンのタイプのみは選択できるようにする -->
  <SsSelectScope
    v-model="selectedVerType"
    @update:model-value="clearErrWrold(selectedVerType)"
    :options="validVersionTypes.map(createServerMap)"
    options-selected-class="text-primary"
    :label="$T('home.version.serverType')"
    :disable="consoleStore.status(mainStore.selectedWorldID) !== 'Stop'"
    :rules="[(val) => validateVersion(val)]"
    class="q-pb-md"
  >
    <template v-slot:option="scope">
      <ServerTypeItem
        :item-props="scope.itemProps"
        :icon="scope.opt.icon"
        :label="scope.opt.label"
        :description="scope.opt.description"
      />
    </template>
  </SsSelectScope>

  <!-- バージョンの一覧を取得できていないときには、編集ができないようにする -->
  <Vanilla
    v-if="mainStore.selectedVersionType === 'vanilla'"
    :version-data="vanillas()"
  />
  <Spigot
    v-else-if="mainStore.selectedVersionType === 'spigot'"
    :version-data="spigots()"
  />
  <PaperMC
    v-else-if="mainStore.selectedVersionType === 'papermc'"
    :version-data="papermcs()"
  />
  <Forge
    v-else-if="mainStore.selectedVersionType === 'forge'"
    :version-data="forges()"
  />
  <MohistMC
    v-else-if="mainStore.selectedVersionType === 'mohistmc'"
    :version-data="mohistmcs()"
  />
  <Fabric
    v-else-if="mainStore.selectedVersionType === 'fabric'"
    :version-data="fabrics()"
  />
</template>
