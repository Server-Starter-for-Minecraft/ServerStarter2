<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { AllFabricVersion, AllForgeVersion, AllMohistmcVersion, AllPapermcVersion, AllSpigotVersion, AllVanillaVersion, Version, versionTypes } from 'app/src-electron/schema/version';
import { useSystemStore } from 'src/stores/SystemStore';
import { useMainStore } from 'src/stores/MainStore';
import { useConsoleStore } from 'src/stores/ConsoleStore';
import { assets } from 'src/assets/assets';
import SsSelectScope from 'src/components/util/base/ssSelectScope.vue';
import ServerTypeItem from './VersionSelecter/ServerTypeItem.vue';
import Vanilla from './VersionSelecter/VanillaView.vue';
import Spigot from './VersionSelecter/SpigotView.vue';
import PaperMC from './VersionSelecter/PaperMCView.vue';
import Forge from './VersionSelecter/ForgeView.vue';
import MohistMC from './VersionSelecter/MohistMCView.vue';
import Fabric from './VersionSelecter/FabricView.vue';

const sysStore = useSystemStore()
const mainStore = useMainStore()
const consoleStore = useConsoleStore()
const { t } = useI18n()

// エラーが発生してバージョン一覧の取得ができなかったバージョンを選択させない
const vanillas  = sysStore.serverVersions.get('vanilla')  as AllVanillaVersion  | undefined
const spigots   = sysStore.serverVersions.get('spigot')   as AllSpigotVersion   | undefined
const papermcs  = sysStore.serverVersions.get('papermc')  as AllPapermcVersion  | undefined
const forges    = sysStore.serverVersions.get('forge')    as AllForgeVersion    | undefined
const mohistmcs = sysStore.serverVersions.get('mohistmc') as AllMohistmcVersion | undefined
const fabrics   = sysStore.serverVersions.get('fabric')   as AllFabricVersion   | undefined
const validVersionTypes = versionTypes.filter(
  serverType => sysStore.serverVersions.get(serverType) !== void 0
)

function createServerMap(serverType: Version['type']) {
  return {
    value: serverType,
    label: t(`home.serverType.${serverType}`),
    description: t(`home.serverDescription.${serverType}`),
    icon: assets.png[serverType]
  };
}
</script>

<template>
  <!-- その際に、すでに存在しているバージョンのタイプのみは選択できるようにする -->
  <SsSelectScope
    v-model="mainStore.selectedVersionType"
    :options="validVersionTypes.map(createServerMap)"
    options-selected-class="text-primary"
    :label="$t('home.version.serverType')"
    :disable="consoleStore.status(mainStore.world.id) !== 'Stop'"
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
  <Vanilla  v-if="mainStore.selectedVersionType      === 'vanilla'  && vanillas"  :version-data="vanillas" />
  <Spigot   v-else-if="mainStore.selectedVersionType === 'spigot'   && spigots"   :version-data="spigots" />
  <PaperMC  v-else-if="mainStore.selectedVersionType === 'papermc'  && papermcs"  :version-data="papermcs" />
  <Forge    v-else-if="mainStore.selectedVersionType === 'forge'    && forges"    :version-data="forges" />
  <MohistMC v-else-if="mainStore.selectedVersionType === 'mohistmc' && mohistmcs" :version-data="mohistmcs" />
  <Fabric   v-else-if="mainStore.selectedVersionType === 'fabric'   && fabrics"   :version-data="fabrics" />
</template>