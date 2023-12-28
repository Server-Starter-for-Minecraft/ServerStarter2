<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useMainStore } from 'src/stores/MainStore';
import { useContentsStore } from 'src/stores/WorldTabs/ContentsStore';
import { isContentsExists } from './Contents/contentsPage';
import IconTabView from './utils/IconTabView.vue';
import IconTabDropdownView from './utils/IconTabDropdownView.vue';

const { t } = useI18n()
const mainStore = useMainStore()
const contentsStore = useContentsStore()

function getAdditionalContentsBtns() {
  const btns = []
  if (isContentsExists[mainStore.world.version.type].datapack) {
    btns.push({
      label: t('tabs.worldSettingTabs.datapack'),
      activeModelValue: 'datapack'
    })
  }
  if (isContentsExists[mainStore.world.version.type].plugin) {
    btns.push({
      label: t('tabs.worldSettingTabs.plugin'),
      activeModelValue: 'plugin'
    })
  }
  if (isContentsExists[mainStore.world.version.type].mod) {
    btns.push({
      label: t('tabs.worldSettingTabs.mod'),
      activeModelValue: 'mod'
    })
  }
  return btns
}
</script>

<template>
  <q-tabs v-model="$route.path" inline-label align="left" dense outside-arrows active-color="primary"
    indicator-color="primary" class="fit q-px-sm" style="flex: 1 1 0;">
    <template v-if="$router.currentRoute.value.path.slice(0, 7) !== '/system'">
      <icon-tab-view path="" icon="home" :label="$t('tabs.worldSettingTabs.home')" />
      <icon-tab-view path="console" icon="terminal" :label="$t('tabs.worldSettingTabs.console')" />
      <icon-tab-view path="property" icon="list" :label="$t('tabs.worldSettingTabs.property')" />
      <icon-tab-view path="player" icon="person" :label="$t('tabs.worldSettingTabs.player')" />
      <icon-tab-dropdown-view v-model="contentsStore.selectedTab" path="contents" icon="extension"
        :label="$t('tabs.worldSettingTabs.contents')" :btns="getAdditionalContentsBtns()" />
      <icon-tab-view path="share-world" icon="cloud" :label="$t('tabs.worldSettingTabs.shareWorld')" />
      <icon-tab-view path="others" icon="build" :label="$t('tabs.worldSettingTabs.others')" />
    </template>
    <template v-else>
      <icon-tab-view path="system" icon="home" :label="$t('tabs.systemSettingTabs.home')" />
      <icon-tab-view path="system/property" icon="list_alt" :label="$t('tabs.systemSettingTabs.list_alt')" />
      <icon-tab-view path="system/folder" icon="folder" :label="$t('tabs.systemSettingTabs.folder')" />
      <icon-tab-view path="system/remote" icon="cloud" :label="$t('tabs.systemSettingTabs.cloud')" />
      <icon-tab-view path="system/info" icon="info" :label="$t('tabs.systemSettingTabs.info')" />
    </template>
  </q-tabs>

  <q-separator />
</template>