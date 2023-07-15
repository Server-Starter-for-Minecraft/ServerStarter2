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
      <icon-tab-view path="" icon="home" label="ホーム" />
      <icon-tab-view path="console" icon="terminal" label="サーバー" />
      <icon-tab-view path="property" icon="list" label="プロパティ" />
      <icon-tab-view path="player" icon="person" label="プレイヤー" />
      <icon-tab-dropdown-view
        path="contents"
        icon="extension"
        label="追加コンテンツ"
        :btns = "[
          { path: 'datapack', label: 'データパック' },
          { path: 'plugin', label: 'プラグイン' },
          { path: 'mod', label: 'MOD' },
        ]"
      />
      <icon-tab-view path="share-world" icon="cloud" label="ワールド共有" />
    </template>
    <template v-else>
      <icon-tab-view path="system" icon="home" label="共有設定" />
      <icon-tab-view path="system/property" icon="list_alt" label="既定プロパティ" />
      <icon-tab-view path="system/remote" icon="cloud" label="リモート" />
      <icon-tab-view path="system/folder" icon="folder" label="ワールドフォルダ" />
      <icon-tab-view path="system/info" icon="info" label="システム情報" />
    </template> 
  </q-tabs>

  <q-separator />
</template>