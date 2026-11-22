<script setup lang="ts">
import { computed } from 'vue';
import { useQuasar } from 'quasar';
import { versionTypes } from 'app/src-electron/schema/version';
import { assets } from 'src/assets/assets';
import { $T } from 'src/i18n/utils/tFunc';
import { useConsoleStore } from 'src/stores/ConsoleStore';
import { useMainStore } from 'src/stores/MainStore';
import { useSystemStore } from 'src/stores/SystemStore';
import SsSelectScope from 'src/components/util/base/ssSelectScope.vue';
import Fabric from './VersionSelecter/FabricView.vue';
import Forge from './VersionSelecter/ForgeView.vue';
import MohistMC from './VersionSelecter/MohistMCView.vue';
import NeoForge from './VersionSelecter/NeoForgeView.vue';
import PaperMC from './VersionSelecter/PaperMCView.vue';
import ServerTypeItem from './VersionSelecter/ServerTypeItem.vue';
import Spigot from './VersionSelecter/SpigotView.vue';
import Vanilla from './VersionSelecter/VanillaView.vue';
import { openVerTypeWarningDialog } from './VersionSelecter/versionComparator';

const $q = useQuasar();
const sysStore = useSystemStore();
const mainStore = useMainStore();
const consoleStore = useConsoleStore();

// エラーが発生してバージョン一覧の取得ができなかったバージョンを選択させない
// （一覧を取得できた種類のみ選択でき，画面は一覧がある場合にのみ表示する）
const validVersionTypes = versionTypes.filter(
  (serverType) => sysStore.serverVersions[serverType] !== void 0
);

function createServerMap(serverType: (typeof versionTypes)[number]) {
  return {
    value: serverType,
    label: $T(`home.serverType.${serverType}`),
    description: $T(`home.serverDescription.${serverType}`),
    icon: assets.png[serverType],
  };
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
    :options="validVersionTypes.map(createServerMap)"
    options-selected-class="text-primary"
    :label="$T('home.version.serverType')"
    :disable="consoleStore.status(mainStore.selectedWorldID) !== 'Stop'"
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
    v-if="
      mainStore.selectedVersionType === 'vanilla' &&
      sysStore.serverVersions.vanilla
    "
    :version-data="sysStore.serverVersions.vanilla"
  />
  <Spigot
    v-else-if="
      mainStore.selectedVersionType === 'spigot' &&
      sysStore.serverVersions.spigot
    "
    :version-data="sysStore.serverVersions.spigot"
  />
  <PaperMC
    v-else-if="
      mainStore.selectedVersionType === 'papermc' &&
      sysStore.serverVersions.papermc
    "
    :version-data="sysStore.serverVersions.papermc"
  />
  <Forge
    v-else-if="
      mainStore.selectedVersionType === 'forge' && sysStore.serverVersions.forge
    "
    :version-data="sysStore.serverVersions.forge"
  />
  <NeoForge
    v-else-if="
      mainStore.selectedVersionType === 'neoforge' &&
      sysStore.serverVersions.neoforge
    "
    :version-data="sysStore.serverVersions.neoforge"
  />
  <MohistMC
    v-else-if="
      mainStore.selectedVersionType === 'mohistmc' &&
      sysStore.serverVersions.mohistmc
    "
    :version-data="sysStore.serverVersions.mohistmc"
  />
  <Fabric
    v-else-if="
      mainStore.selectedVersionType === 'fabric' &&
      sysStore.serverVersions.fabric
    "
    :version-data="sysStore.serverVersions.fabric"
  />
</template>
