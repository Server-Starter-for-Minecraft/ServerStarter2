<script setup lang="ts">
import IconTabView from './utils/IconTabView.vue';
import IconTabDropdownView from './utils/IconTabDropdownView.vue';
</script>

<template>
  <q-tabs
    v-model="$route.path"
    inline-label
    align="left"
    dense
    outside-arrows
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
        :btns = "[
          { path: 'datapack', label: $t('utils.worldSettingTabs.datapack') },
          { path: 'plugin', label: $t('utils.worldSettingTabs.plugin') },
          { path: 'mod', label: $t('utils.worldSettingTabs.mod') },
        ]"
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