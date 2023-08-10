<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { Version, versionTypes } from 'app/src-electron/schema/version';
import { sendError } from 'src/components/Error/Error';
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

/**
 * バージョンの一覧を取得する
 */
function getAllVers() {
  const versionList = sysStore.serverVersions.get(mainStore.world.version.type);

  // versionListがundefinedの時にエラー処理
  if (versionList === void 0) {
    sendError(
      t('home.error.title'),
      t('home.error.failedGetVersion', { serverVersion: mainStore.world.version })
    );
    mainStore.world.version.type = 'vanilla';
    return;
  }

  // Serverの種類が変更されたときには、一旦最新バージョンを提示
  mainStore.world.version = versionList[0];
}
</script>

<template>
  <!-- その際に、すでに存在しているバージョンのタイプのみは選択できるようにする -->
  <SsSelect
    v-model="mainStore.world.version.type"
    @update:model-value="getAllVers"
    :options="translatedVersionTypes"
    option-label="label"
    option-value="value"
    :label="$t('home.version.serverType')"
    class="q-pb-md"
  />

  <!-- バージョンの一覧を取得できていないときには、編集ができないようにする -->
  <Vanilla  v-if="mainStore.world.version.type      === 'vanilla'"  />
  <Spigot   v-else-if="mainStore.world.version.type === 'spigot'"   />
  <PaperMC  v-else-if="mainStore.world.version.type === 'papermc'"  />
  <Forge    v-else-if="mainStore.world.version.type === 'forge'"    />
  <MohistMC v-else-if="mainStore.world.version.type === 'mohistmc'" />
  <Fabric   v-else-if="mainStore.world.version.type === 'fabric'"   />
</template>