<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { Version, versionTypes } from 'app/src-electron/schema/version';
import { useSystemStore } from 'src/stores/SystemStore';
import { useMainStore } from 'src/stores/MainStore';
import SsSelect from 'src/components/util/base/ssSelect.vue';
import Vanilla from './VersionSelecter/VanillaView.vue';
import Spigot from './VersionSelecter/SpigotView.vue';
import PaperMC from './VersionSelecter/PaperMCView.vue';
import Forge from './VersionSelecter/ForgeView.vue';
import MohistMC from './VersionSelecter/MohistMCView.vue';
import Fabric from './VersionSelecter/FabricView.vue';

const sysStore = useSystemStore()
const mainStore = useMainStore()
const { t } = useI18n()

// エラーが発生してバージョン一覧の取得ができなかったバージョンを選択させない
const validVersionTypes = versionTypes.filter(
  serverType => sysStore.serverVersions.get(serverType) !== void 0
)

function createTranslateObject(value: Version['type']) {
  return {
    value: value,
    label: t(`home.serverType.${value}`), 
  };
}

const translatedVersionTypes = validVersionTypes.map((value) => createTranslateObject(value));
</script>

<template>
  <!-- その際に、すでに存在しているバージョンのタイプのみは選択できるようにする -->
  <SsSelect
    v-model="mainStore.selectedVersionType"
    :options="translatedVersionTypes"
    option-label="label"
    option-value="value"
    :label="$t('home.version.serverType')"
    class="q-pb-md"
  />

  <!-- バージョンの一覧を取得できていないときには、編集ができないようにする -->
  <Vanilla  v-if="mainStore.selectedVersionType      === 'vanilla'"  />
  <Spigot   v-else-if="mainStore.selectedVersionType === 'spigot'"   />
  <PaperMC  v-else-if="mainStore.selectedVersionType === 'papermc'"  />
  <Forge    v-else-if="mainStore.selectedVersionType === 'forge'"    />
  <MohistMC v-else-if="mainStore.selectedVersionType === 'mohistmc'" />
  <Fabric   v-else-if="mainStore.selectedVersionType === 'fabric'"   />
</template>