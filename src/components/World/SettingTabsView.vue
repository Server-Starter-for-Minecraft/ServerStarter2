<script setup lang="ts">
import { ref } from 'vue';
import IconTabView from './utils/IconTabView.vue';
import IconTabDropdownView from './utils/IconTabDropdownView.vue';

const tab = ref('home')
</script>

<template>
  <q-tabs
    v-model="tab"
    inline-label
    align="left"
    dense
    outside-arrows
    indicator-color="primary"
    class="fit q-px-sm"
    style="flex: 1 1 0;"
  >
    <icon-tab-view name="home" icon="home" label="ホーム" to="" />
    <icon-tab-view name="console" icon="dns" label="サーバー本体" />
    <icon-tab-view name="property" icon="list_alt" label="プロパティ" />
    <icon-tab-view name="player" icon="group" label="プレイヤー管理" />
    <icon-tab-dropdown-view
      v-model="tab"
      name="contents"
      icon="library_add"
      label="追加コンテンツ"
      :btns = "[
        { name: 'datapack', label: 'データパック' },
        { name: 'plugin', label: 'プラグイン' },
        { name: 'mod', label: 'MOD' },
      ]"
    />
    <icon-tab-view name="share-world" icon="share" label="ワールド共有" />
  </q-tabs>

  <q-separator />
</template>