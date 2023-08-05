<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { Version } from 'app/src-electron/schema/version';
import { useMainStore } from 'src/stores/MainStore';
import IconTabView from './utils/IconTabView.vue';
import IconTabDropdownView from './utils/IconTabDropdownView.vue';

const { t } = useI18n()
const mainStore = useMainStore()

type contentExists = { [ver in Version['type']]: { datapack: boolean, plugin: boolean, mod: boolean } }
const isContentsExists: contentExists = {
  'vanilla' : { datapack: true, plugin: false, mod: false },
  'spigot'  : { datapack: true, plugin: true , mod: false },
  'papermc' : { datapack: true, plugin: true , mod: false },
  'forge'   : { datapack: true, plugin: false, mod: true  },
  'mohistmc': { datapack: true, plugin: true , mod: true  },
  'fabric'  : { datapack: true, plugin: true , mod: true  },
} 

function getAdditionalContentsBtns() {
  const btns = []
  if (isContentsExists[mainStore.world.version.type].datapack) {
    btns.push({ path: 'datapack', label: t('utils.worldSettingTabs.datapack') })
  }
  if (isContentsExists[mainStore.world.version.type].plugin) {
    btns.push({ path: 'plugin', label: t('utils.worldSettingTabs.plugin') })
  }
  if (isContentsExists[mainStore.world.version.type].mod) {
    btns.push({ path: 'mod', label: t('utils.worldSettingTabs.mod') })
  }
  return btns
}
</script>

<template>
  <q-tabs
    v-model="$route.path"
    inline-label
    align="left"
    dense
    outside-arrows
    active-color="primary"
    indicator-color="primary"
    class="fit q-px-sm"
    style="flex: 1 1 0;"
  >
    <template v-if="$router.currentRoute.value.path.slice(0, 7) !== '/system'">
      <icon-tab-view path="" icon="home" :label="$t('utils.worldSettingTabs.home')" />
      <icon-tab-view path="console" icon="terminal" :label="$t('utils.worldSettingTabs.console')" />
      <icon-tab-view path="property" icon="list" :label="$t('utils.worldSettingTabs.property')" />
      <icon-tab-view path="player" icon="person" :label="$t('utils.worldSettingTabs.player')" />
      <icon-tab-dropdown-view
        path="contents"
        icon="extension"
        :label="$t('utils.worldSettingTabs.contents')"
        :btns = "getAdditionalContentsBtns()"
      />
      <icon-tab-view path="share-world" icon="cloud" :label="$t('utils.worldSettingTabs.cloud')" />
    </template>
    <template v-else>
      <icon-tab-view path="system" icon="home" :label="$t('utils.systemSettingTabs.home')" />
      <icon-tab-view path="system/property" icon="list_alt" :label="$t('utils.systemSettingTabs.list_alt')" />
      <icon-tab-view path="system/remote" icon="cloud" :label="$t('utils.systemSettingTabs.cloud')" />
      <icon-tab-view path="system/folder" icon="folder" :label="$t('utils.systemSettingTabs.folder')" />
      <icon-tab-view path="system/info" icon="info" :label="$t('utils.systemSettingTabs.info')" />
    </template> 
  </q-tabs>

  <q-separator />
</template>